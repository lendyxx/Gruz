export type TeamOptionId = 'standard' | 'premium' | 'office';

export type TeamOption = {
  id: TeamOptionId;
  title: string;
  subtitle: string;
  pricePerHour: number;
};

export type OrderStatus = 'created' | 'pickup' | 'enroute' | 'delivered' | 'cancelled';

export type UserRole = 'user' | 'admin';

export type User = {
  id: string;
  name: string;
  login: string; // phone or email
  role: UserRole;
};

export type AuthState = {
  user: User | null;
  isReady: boolean;
  signIn: (args: { login: string; password: string }) => Promise<{ ok: boolean; message?: string }>;
  signUp: (args: { name: string; login: string; password: string }) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
};

export type CargoDetails = {
  // Габариты
  widthCm?: number;
  heightCm?: number;
  lengthCm?: number;
  weightKg?: number;
  // Адреса
  fromAddress: string;
  toAddress: string;
  // Дата и время доставки
  deliveryDate: string; // ISO date: YYYY-MM-DD
  deliveryTime?: string; // HH:MM format
  // Услуги
  needsPacking: boolean;
  needsFloors: boolean;
  floorFrom?: number;
  floorTo?: number;
  hasElevator: boolean;
  // Примечания
  notes: string;
};

export type Order = {
  id: string;
  number: number;
  createdAt: string; // ISO
  status: OrderStatus;
  team: TeamOption;
  cargo: CargoDetails;
  totalRub: number;
  userId: string; // Добавлено для связи с пользователем
};

