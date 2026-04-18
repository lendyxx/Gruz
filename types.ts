export type TeamOptionId = 'standard' | 'premium' | 'office';

export type TeamOption = {
  id: TeamOptionId;
  title: string;
  subtitle: string;
  pricePerHour: number;
};

export type OrderStatus = 'created' | 'pickup' | 'enroute' | 'delivered' | 'cancelled';

export type User = {
  id: string;
  name: string;
  login: string; // phone or email
};

export type AuthState = {
  user: User | null;
  isReady: boolean;
  signIn: (args: { login: string; password: string }) => Promise<{ ok: boolean; message?: string }>;
  signUp: (args: { name: string; login: string; password: string }) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
};

export type CargoDetails = {
  sizeText: string; // e.g. "2x1.5x1 м"
  weightKg?: number;
  fromAddress: string;
  toAddress: string;
  needsPacking: boolean;
  needsFloors: boolean;
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

