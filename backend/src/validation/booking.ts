export interface BookingInput {
  client_id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  address: string;
  slot: string;
}

export function validateBooking(body: Partial<BookingInput>): string[] {
  const errors: string[] = [];

  if (!body.client_id?.trim()) errors.push('client_id is required');
  if (!body.name?.trim()) errors.push('name is required');

  if (!body.phone?.trim()) {
    errors.push('phone is required');
  } else if (!/^[\d\s\-().+]{7,20}$/.test(body.phone.trim())) {
    errors.push('phone must be a valid phone number');
  }

  if (!body.email?.trim()) {
    errors.push('email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    errors.push('email must be a valid email address');
  }

  if (!body.service?.trim()) errors.push('service is required');
  if (!body.address?.trim()) errors.push('address is required');
  if (!body.slot?.trim()) errors.push('slot is required');

  return errors;
}
