import { Booking, ClientConfig } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function fetchConfig(clientId: string): Promise<ClientConfig> {
  const res = await fetch(`${API_BASE}/api/config/${clientId}`);
  if (!res.ok) throw new Error('Client config not found');
  return res.json();
}

export async function fetchBookings(clientId?: string): Promise<Booking[]> {
  const url = clientId
    ? `${API_BASE}/api/bookings?clientId=${clientId}`
    : `${API_BASE}/api/bookings`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
}

export async function createBooking(
  booking: Omit<Booking, 'id' | 'created_at'>
): Promise<Booking> {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error((data.errors as string[])?.join(', ') ?? 'Failed to create booking');
  }
  return res.json();
}
