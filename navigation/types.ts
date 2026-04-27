import type { CargoDetails } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Auth: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  DriverTab?: undefined;
  AdminTab?: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  SelectTeam: undefined;
  CargoDetails: undefined;
  PriceCalculation: { cargo: CargoDetails };
};

export type HistoryStackParamList = {
  History: undefined;
};

