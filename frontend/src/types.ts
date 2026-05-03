export interface ClientConfig {
  id: string;
  name: string;
  tagline: string;
  brandColor: string;
  brandColorLight: string;
  logoText: string;
  services: string[];
  businessHours: string;
  assistantName: string;
  welcomeMessage: string;
}

export interface Booking {
  id?: number;
  client_id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  address: string;
  slot: string;
  status?: string;
  created_at?: string;
}

export interface BookingFormData {
  name: string;
  phone: string;
  email: string;
  service: string;
  address: string;
  slot: string;
}
