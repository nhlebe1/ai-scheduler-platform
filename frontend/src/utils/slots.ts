const TIMES = ['9:00 AM', '11:00 AM', '2:00 PM'];

export function generateAvailableSlots(): string[] {
  const slots: string[] = [];
  const today = new Date();
  let daysAdded = 0;
  let offset = 1;

  while (daysAdded < 5) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) {
      const label = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      TIMES.forEach((t) => slots.push(`${label} at ${t}`));
      daysAdded++;
    }
    offset++;
  }

  return slots;
}
