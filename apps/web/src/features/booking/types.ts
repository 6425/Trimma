export interface Booking {
  id: string;
  userId: string;
  salonId: string;
  serviceIds: string[];
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "09:30"
  isAvailable: boolean;
}
