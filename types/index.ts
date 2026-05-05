export type Car = {
  id: string;
  name: string;
  fuel_efficiency: number; // km/L
  created_at: string;
};

export type Waypoint = {
  id: string;
  trip_id: string;
  order_index: number;
  place_name: string;
  distance_from_prev_km: number | null;
};

export type TollSegment = {
  id: string;
  trip_id: string;
  from_ic: string;
  to_ic: string;
  amount: number;
};

export type Trip = {
  id: string;
  name: string | null;
  total_distance_km: number;
  fuel_cost: number;
  toll_cost: number;
  total_cost: number;
  gas_price_per_liter: number;
  car_name: string;
  fuel_efficiency: number;
  created_at: string;
  waypoints?: Waypoint[];
  toll_segments?: TollSegment[];
};

export type WaypointInput = {
  tempId: string;
  place_name: string;
  placeId?: string;
  distance_from_prev_km?: number;
};

export type TollSegmentInput = {
  tempId: string;
  from_ic: string;
  to_ic: string;
  amount: number;
};

export type CalculationResult = {
  totalDistanceKm: number;
  fuelCost: number;
  tollCost: number;
  totalCost: number;
  segmentDistances: number[];
};
