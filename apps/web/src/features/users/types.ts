export type Role = 'customer' | 'salon_owner' | 'agent' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phoneNumber?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
