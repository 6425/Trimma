// Global TypeScript Interfaces
export interface User { id: string; name: string; }

export type SalonLeadStatus = 'new' | 'contacted' | 'claimed' | 'rejected';

export interface SalonLead {
  id: string;
  place_id: string;
  name: string;
  address?: string;
  rating?: number;
  phone?: string;
  website?: string;
  map_url?: string;
  category?: string;
  opening_hours?: any;
  latitude?: number;
  longitude?: number;
  price_level?: string;
  summary?: string;
  hero_image?: string;
  assign_to?: string;
  role?: string;
  status: SalonLeadStatus;
  created_at: string;
  updated_at: string;
}
