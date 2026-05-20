export interface Salon {
  id: string;
  slug: string;
  name: string;
  description: string;
  rating: number;
  reviewCount: number;
  
  // Geo Hierarchy
  province: string;
  district: string;
  city: string;
  address: string;
  
  // Categories
  mainCategories: string[];
  subCategories: string[];
  
  pricingLevel: 1 | 2 | 3 | 4; // e.g., $, $$, $$$, $$$$
  isOpen: boolean;
  images: string[];
}

export interface Service {
  id: string;
  salonId: string;
  categoryId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}
