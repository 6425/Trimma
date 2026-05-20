import { create } from 'zustand';

interface LocationState {
  province: string | null;
  district: string | null;
  city: string | null;
  salonId: string | null;
  
  setProvince: (province: string | null) => void;
  setDistrict: (district: string | null) => void;
  setCity: (city: string | null) => void;
  setSalonId: (salonId: string | null) => void;
  
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  province: null,
  district: null,
  city: null,
  salonId: null,

  setProvince: (province) => set({ province, district: null, city: null, salonId: null }),
  setDistrict: (district) => set({ district, city: null, salonId: null }),
  setCity: (city) => set({ city, salonId: null }),
  setSalonId: (salonId) => set({ salonId }),
  
  clearLocation: () => set({ province: null, district: null, city: null, salonId: null }),
}));
