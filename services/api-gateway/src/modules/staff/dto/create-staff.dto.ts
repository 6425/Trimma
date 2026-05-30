export class CreateStaffDto {
  name: string;
  role: string;
  email: string;
  working_hours: Record<string, any>;
}
