import React, { useEffect, useState } from 'react';
import { Booking } from '../types';
import { fetchBookings } from '../api';
import Dashboard from '../components/Dashboard/Dashboard';

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings()
      .then(setBookings)
      .catch(() => setError('Failed to load bookings. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">All scheduled appointments</p>
        </div>
        {!loading && !error && (
          <span className="text-sm text-gray-400">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading && <p className="text-gray-400">Loading bookings...</p>}
      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-6 py-4">
          {error}
        </div>
      )}
      {!loading && !error && <Dashboard bookings={bookings} />}
    </div>
  );
}
