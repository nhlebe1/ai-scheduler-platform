import React from 'react';
import { Booking } from '../../types'; // status: New | Confirmed

interface Props {
  bookings: Booking[];
}

function StatusBadge({ status }: { status?: string }) {
  const s = status ?? 'New';
  const styles =
    s === 'Confirmed'
      ? 'bg-green-100 text-green-700'
      : 'bg-amber-50 text-amber-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {s}
    </span>
  );
}

export default function Dashboard({ bookings }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-lg font-medium text-gray-600">No bookings yet</p>
        <p className="text-sm mt-1">
          Bookings will appear here after customers complete the scheduling flow.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
      <table className="w-full text-sm text-left bg-white">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Phone</th>
            <th className="px-5 py-3">Email</th>
            <th className="px-5 py-3">Service</th>
            <th className="px-5 py-3">Address</th>
            <th className="px-5 py-3">Slot</th>
            <th className="px-5 py-3">Booked At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3">
                <StatusBadge status={b.status} />
              </td>
              <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{b.name}</td>
              <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{b.phone}</td>
              <td className="px-5 py-3 text-gray-600">{b.email}</td>
              <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{b.service}</td>
              <td className="px-5 py-3 text-gray-600 max-w-xs truncate" title={b.address}>
                {b.address}
              </td>
              <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{b.slot}</td>
              <td className="px-5 py-3 text-gray-400 whitespace-nowrap text-xs">
                {b.created_at ? new Date(b.created_at + 'Z').toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
