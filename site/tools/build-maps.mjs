// Builds each tracker's map.json. Only needs re-running to change a map itself.
//
//   npm i --no-save world-atlas@2 us-atlas@3 topojson-client@3 topojson-simplify@3 d3-geo@3
//   node site/tools/build-maps.mjs [plague|measles|ebola|marburg|mpox|cholera|dengue]   (no argument: all)
//
// Map kinds:
//   points  - land outlines plus a projection the app uses to place markers (plague)
//   regions - one SVG path per region, filled by the app from data.json (measles, ebola)
// Boundary data: Natural Earth (public domain) via world-atlas and us-atlas; DR Congo provinces
// from geoBoundaries (CC BY 4.0).
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";
import { presimplify, simplify } from "topojson-simplify";
import { geoAlbersUsa, geoAzimuthalEqualArea, geoConicConformal, geoNaturalEarth1, geoPath } from "d3-geo";

const require = createRequire(import.meta.url);
const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const LAKES_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_lakes.geojson";
const COD_URL = "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/main/releaseData/gbOpen/COD/ADM1/geoBoundaries-COD-ADM1_simplified.geojson";
const rad = Math.PI / 180;

const rings = (g) => (g.type === "Polygon" ? g.coordinates : g.type === "MultiPolygon" ? g.coordinates.flat() : []);
const world = () => {
  const topo = require("world-atlas/countries-50m.json");
  return feature(topo, topo.objects.countries).features;
};
const lakes = async (names) => (await (await fetch(LAKES_URL)).json()).features.filter((f) => names.includes(f.properties.name));

// Turns lon/lat rings into a thinned SVG path in screen space.
function pathMaker(toScreen, W, H) {
  return (geometry, minStep = 1.4, minExtent = 3) => {
    let d = "";
    for (const ring of rings(geometry)) {
      const pts = [];
      for (const [lon, lat] of ring) {
        const p = toScreen(lon, lat);
        const last = pts[pts.length - 1];
        if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= minStep) pts.push(p);
      }
      if (pts.length < 3) continue;
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      if (Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < minExtent) continue;
      if (Math.max(...xs) < -50 || Math.min(...xs) > W + 50 || Math.max(...ys) < -50 || Math.min(...ys) > H + 50) continue;
      d += "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
    }
    return d;
  };
}
function centroid(toScreen, geometry) {
  // Area-weighted centroid of the largest ring, good enough for label placement.
  let best = null, bestA = 0;
  for (const ring of rings(geometry)) {
    const pts = ring.map(([lon, lat]) => toScreen(lon, lat));
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const f = pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
      a += f; cx += (pts[i][0] + pts[i + 1][0]) * f; cy += (pts[i][1] + pts[i + 1][1]) * f;
    }
    if (Math.abs(a) > bestA) { bestA = Math.abs(a); best = [cx / (3 * a), cy / (3 * a)]; }
  }
  return best ? best.map((v) => +v.toFixed(1)) : [0, 0];
}
const write = (slug, out) => {
  writeFileSync(join(site, slug, "map.json"), JSON.stringify(out));
  console.log(`${slug}/map.json: ${out.width}x${out.height}, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
};

/* Plague: Russia with neighbours, Albers equal-area conic, markers placed by the app. */
async function plague() {
  const P = { type: "albers", lon0: 100, lat0: 60, lat1: 50, lat2: 70 };
  const n = (Math.sin(P.lat1 * rad) + Math.sin(P.lat2 * rad)) / 2;
  const C = Math.cos(P.lat1 * rad) ** 2 + 2 * n * Math.sin(P.lat1 * rad);
  const rho0 = Math.sqrt(C - 2 * n * Math.sin(P.lat0 * rad)) / n;
  const albers = (lon, lat) => {
    if (lon < -20) lon += 360;
    const rho = Math.sqrt(C - 2 * n * Math.sin(lat * rad)) / n;
    const t = n * (lon - P.lon0) * rad;
    return [rho * Math.sin(t), rho0 - rho * Math.cos(t)];
  };
  const countries = world();
  const russia = countries.find((f) => f.properties.name === "Russia");
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const ring of rings(russia.geometry)) for (const [lon, lat] of ring) {
    const [x, y] = albers(lon, lat);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const padX = (x1 - x0) * 0.02, padTop = (y1 - y0) * 0.02, padBottom = (y1 - y0) * 0.12;
  x0 -= padX; x1 += padX; y0 -= padBottom; y1 += padTop;
  const W = 1000, k = W / (x1 - x0), H = Math.round((y1 - y0) * k), tx = -x0 * k, ty = y1 * k;
  const toScreen = (lon, lat) => { const [x, y] = albers(lon, lat); return [x * k + tx, -y * k + ty]; };
  const path = pathMaker(toScreen, W, H);
  write("plague", {
    kind: "points",
    note: "Generated by tools/build-maps.mjs from Natural Earth (public domain). Do not edit by hand.",
    width: W, height: H,
    projection: { ...P, k: +k.toFixed(4), tx: +tx.toFixed(2), ty: +ty.toFixed(2) },
    focus: path(russia.geometry),
    others: countries.filter((f) => f !== russia).map((f) => path(f.geometry, 2.6, 4)).join(""),
    lakes: (await lakes(["Lake Baikal", "Lake Ladoga", "Lake Onega", "Lake Balkhash"])).map((f) => ({ name: f.properties.name, d: path(f.geometry, 0.8, 1) })),
    labels: [{ text: "Lake Baikal", lon: 109.9, lat: 55.7 }],
  });
}

/* Measles: US states, Albers USA (Alaska and Hawaii inset). Regions keyed by state name. */
async function measles() {
  const topo = require("us-atlas/states-10m.json");
  const states = feature(topo, topo.objects.states).features;
  const W = 975, H = 610;
  const projection = geoAlbersUsa().fitExtent([[8, 8], [W - 8, H - 8]], { type: "FeatureCollection", features: states });
  const gp = geoPath(projection);
  const round = (d) => d.replace(/(\d+\.\d)\d+/g, "$1");
  const regions = states.map((f) => {
    const d = gp(f);
    if (!d) return null;
    const c = gp.centroid(f);
    return { id: f.properties.name, d: round(d), cx: +c[0].toFixed(1), cy: +c[1].toFixed(1) };
  }).filter(Boolean);
  write("measles", {
    kind: "regions",
    note: "Generated by tools/build-maps.mjs from US Census boundaries via us-atlas. Do not edit by hand.",
    width: W, height: H, regions,
  });
}

/* Ebola: DR Congo's 26 provinces with neighbours, equirectangular (near the equator). */
async function ebola() {
  const FR = {
    "Central Kasai": "Kasaï-Central", "Kasai": "Kasaï", "Kasai-Oriental": "Kasaï-Oriental", "Lower Uele": "Bas-Uélé",
    "Upper Uele": "Haut-Uélé", "North Kivu": "Nord-Kivu", "South Kivu": "Sud-Kivu",
  };
  const cod = (await (await fetch(COD_URL)).json()).features;
  const lon0 = 23.5, lat0 = -3, cosL = Math.cos(lat0 * rad);
  const bbox = [11.5, -14.2, 32.5, 6.2]; // lon/lat frame: DRC plus a margin for neighbours
  const W = 900, k = W / ((bbox[2] - bbox[0]) * cosL), H = Math.round((bbox[3] - bbox[1]) * k);
  const tx = -(bbox[0] - lon0) * cosL * k, ty = bbox[3] * k;
  const toScreen = (lon, lat) => [(lon - lon0) * cosL * k + tx, -lat * k + ty];
  const path = pathMaker(toScreen, W, H);
  const countries = world();
  write("ebola", {
    kind: "regions",
    note: "Generated by tools/build-maps.mjs. Provinces: geoBoundaries (CC BY 4.0). Countries and lakes: Natural Earth. Do not edit by hand.",
    width: W, height: H,
    projection: { type: "equirect", lon0, lat0, k: +k.toFixed(4), tx: +tx.toFixed(2), ty: +ty.toFixed(2) },
    others: countries.filter((f) => f.properties.name !== "Dem. Rep. Congo").map((f) => path(f.geometry, 1.6, 3)).join(""),
    regions: cod.map((f) => {
      const name = FR[f.properties.shapeName] || f.properties.shapeName;
      const [cx, cy] = centroid(toScreen, f.geometry);
      return { id: name, d: path(f.geometry, 0.9, 1), cx, cy };
    }),
    lakes: (await lakes(["Lake Tanganyika", "Lake Kivu", "Lake Albert", "Lake Edward", "Lake Mweru", "Lake Victoria"])).map((f) => ({ name: f.properties.name, d: path(f.geometry, 0.8, 1) })),
    labels: [
      { text: "Uganda", lon: 31.5, lat: 3.3 }, { text: "South Sudan", lon: 29.6, lat: 5.6 }, { text: "CAR", lon: 21.0, lat: 5.6 },
      { text: "Rwanda", lon: 30.2, lat: -1.6 }, { text: "Angola", lon: 17.0, lat: -11.5 }, { text: "Zambia", lon: 27.5, lat: -13.6 },
      { text: "Rep. of Congo", lon: 14.0, lat: 0.6 },
    ],
  });
}


/* Country display names: world-atlas abbreviates some. Region ids use these display names. */
const NAME = {
  "Dem. Rep. Congo": "DR Congo", "Congo": "Republic of the Congo", "Central African Rep.": "Central African Republic",
  "S. Sudan": "South Sudan", "Eq. Guinea": "Equatorial Guinea", "eSwatini": "Eswatini", "W. Sahara": "Western Sahara",
  "Bosnia and Herz.": "Bosnia and Herzegovina", "Macedonia": "North Macedonia", "Dominican Rep.": "Dominican Republic",
  "United States of America": "United States", "Solomon Is.": "Solomon Islands", "Czechia": "Czechia",
};
const nice = (n) => NAME[n] || n;
const AFRICA = ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Rep.", "Chad",
  "Comoros", "Congo", "Dem. Rep. Congo", "Djibouti", "Egypt", "Eq. Guinea", "Eritrea", "eSwatini", "Ethiopia", "Gabon", "Gambia", "Ghana",
  "Guinea", "Guinea-Bissau", "Côte d'Ivoire", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania",
  "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Principe", "Senegal", "Seychelles",
  "Sierra Leone", "Somalia", "Somaliland", "South Africa", "S. Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia",
  "Zimbabwe", "W. Sahara"];
const EUROPE = ["Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herz.", "Bulgaria", "Croatia", "Cyprus", "Czechia",
  "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo", "Latvia",
  "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands", "Macedonia", "Norway",
  "Poland", "Portugal", "Romania", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Ukraine",
  "United Kingdom", "Vatican", "N. Cyprus", "Turkey"];
const round = (d) => (d || "").replace(/(\d+\.\d)\d+/g, "$1");

// Shaded-country map with d3-geo: `members` become regions, everything else faint land.
function countryMap(slug, note, { features, members, projection, W, H, labels = [] }) {
  projection.clipExtent([[0, 0], [W, H]]);
  const gp = geoPath(projection);
  const isMember = (f) => !members || members.includes(f.properties.name);
  const regions = [];
  let others = "";
  for (const f of features) {
    if (gp.area(f) < 1) continue; // off-frame or too small to see
    const d = round(gp(f)).replace(/(L[-\d.]+,[-\d.]+)(?:\1)+/g, "$1"); // drop repeated points
    if (!d) continue;
    if (isMember(f)) {
      const c = gp.centroid(f);
      regions.push({ id: nice(f.properties.name), d, cx: +(c[0] || 0).toFixed(1), cy: +(c[1] || 0).toFixed(1) });
    } else others += d;
  }
  write(slug, { kind: "regions", note, width: W, height: H, others, regions, textLabels: labels });
}

/* Marburg: Ethiopia and neighbours as land; places are markers (Ethiopia's regions changed in 2020-2023,
   and current boundaries aren't available as open data). */
async function marburg() {
  const lon0 = 39, lat0 = 7, cosL = Math.cos(lat0 * rad);
  const bbox = [29.0, -1.6, 49.5, 16.0];
  const W = 900, k = W / ((bbox[2] - bbox[0]) * cosL), H = Math.round((bbox[3] - bbox[1]) * k);
  const tx = -(bbox[0] - lon0) * cosL * k, ty = bbox[3] * k;
  const toScreen = (lon, lat) => [(lon - lon0) * cosL * k + tx, -lat * k + ty];
  const path = pathMaker(toScreen, W, H);
  const countries = world();
  const focus = countries.filter((f) => ["Ethiopia", "Uganda"].includes(f.properties.name));
  write("marburg", {
    kind: "points",
    note: "Generated by tools/build-maps.mjs from Natural Earth (public domain). Do not edit by hand.",
    width: W, height: H,
    projection: { type: "equirect", lon0, lat0, k: +k.toFixed(4), tx: +tx.toFixed(2), ty: +ty.toFixed(2) },
    focus: focus.map((f) => path(f.geometry, 0.9, 1)).join(""),
    others: countries.filter((f) => !focus.includes(f)).map((f) => path(f.geometry, 1.4, 2)).join(""),
    lakes: (await lakes(["Lake Turkana", "Lake Tana", "Lake Abaya", "Lake Victoria", "Lake Albert", "Lake Kyoga"])).map((f) => ({ name: f.properties.name, d: path(f.geometry, 0.8, 1) })),
    labels: [
      { text: "Kenya", lon: 38.0, lat: 2.8 }, { text: "South Sudan", lon: 31.8, lat: 7.0 }, { text: "Sudan", lon: 33.5, lat: 13.5 },
      { text: "Eritrea", lon: 39.0, lat: 15.4 }, { text: "Somalia", lon: 46.5, lat: 5.0 }, { text: "Djibouti", lon: 42.6, lat: 11.9 },
      { text: "Uganda", lon: 32.9, lat: 2.6 }, { text: "Ethiopia", lon: 42.2, lat: 8.4 }, { text: "Addis Ababa", lon: 38.75, lat: 9.25 },
    ],
  });
}

/* Mpox: African countries shaded; the rest of the world as faint land. */
const simplified = (file, minWeight) => simplify(presimplify(structuredClone(require(file))), minWeight);

async function mpox() {
  const topo = simplified("world-atlas/countries-50m.json", 2e-5);
  const features = feature(topo, topo.objects.countries).features;
  const africa = features.filter((f) => AFRICA.includes(f.properties.name));
  const W = 820, H = 860;
  const projection = geoAzimuthalEqualArea().rotate([-20, -2]).fitExtent([[10, 10], [W - 10, H - 10]], { type: "FeatureCollection", features: africa });
  countryMap("mpox", "Generated by tools/build-maps.mjs from Natural Earth (public domain). Do not edit by hand.",
    { features, members: AFRICA, projection, W, H });
}

/* Cholera: every country shaded (world, Natural Earth projection, 1:110m for size). */
async function cholera() {
  const topo = require("world-atlas/countries-110m.json");
  const features = feature(topo, topo.objects.countries).features.filter((f) => f.properties.name !== "Antarctica");
  const W = 980, H = 500;
  const projection = geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: "FeatureCollection", features });
  countryMap("cholera", "Generated by tools/build-maps.mjs from Natural Earth (public domain). Do not edit by hand.",
    { features, members: null, projection, W, H });
}

/* Dengue: European countries shaded, conic projection centred on southern Europe. */
async function dengue() {
  const topo = simplified("world-atlas/countries-50m.json", 4e-6);
  const features = feature(topo, topo.objects.countries).features;
  const W = 900, H = 700;
  const frame = { type: "MultiPoint", coordinates: [[-12, 34], [32, 34], [32, 60], [-12, 60], [10, 34], [10, 60]] };
  const projection = geoConicConformal().rotate([-10, 0]).parallels([38, 55]).fitExtent([[0, 0], [W, H]], frame);
  countryMap("dengue", "Generated by tools/build-maps.mjs from Natural Earth (public domain). Do not edit by hand.",
    { features, members: EUROPE, projection, W, H });
}

const which = process.argv[2];
const jobs = { plague, measles, ebola, marburg, mpox, cholera, dengue };
for (const [name, fn] of Object.entries(jobs)) if (!which || which === name) await fn();
