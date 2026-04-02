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
};

