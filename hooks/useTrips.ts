'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Trip, WaypointInput, TollSegmentInput } from '@/types';

function parseTrip(raw: Record<string, unknown>): Trip {
  return {
    id: raw.id as string,
    name: raw.name as string | null,
    total_distance_km: parseFloat(raw.total_distance_km as string),
    fuel_cost: Number(raw.fuel_cost),
    toll_cost: Number(raw.toll_cost),
    total_cost: Number(raw.total_cost),
    gas_price_per_liter: Number(raw.gas_price_per_liter),
    car_name: raw.car_name as string,
    fuel_efficiency: parseFloat(raw.fuel_efficiency as string),
    created_at: raw.created_at as string,
  };
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (!tripData) { setLoading(false); return; }

    const tripsWithDetails = await Promise.all(
      tripData.map(async (t) => {
        const trip = parseTrip(t as Record<string, unknown>);
        const { data: wps } = await supabase
          .from('waypoints')
          .select('*')
          .eq('trip_id', t.id)
          .order('order_index');
        const { data: tolls } = await supabase
          .from('toll_segments')
          .select('*')
          .eq('trip_id', t.id);
        return {
          ...trip,
          waypoints: (wps ?? []).map((w) => ({
            ...w,
            distance_from_prev_km: w.distance_from_prev_km ? parseFloat(w.distance_from_prev_km) : null,
          })),
          toll_segments: tolls ?? [],
        };
      })
    );
    setTrips(tripsWithDetails);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const saveTrip = async (params: {
    name: string;
    totalDistanceKm: number;
    fuelCost: number;
    tollCost: number;
    totalCost: number;
    gasPricePerLiter: number;
    carName: string;
    fuelEfficiency: number;
    waypoints: WaypointInput[];
    tollSegments: TollSegmentInput[];
    segmentDistances: number[];
  }) => {
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert({
        name: params.name || null,
        total_distance_km: params.totalDistanceKm,
        fuel_cost: params.fuelCost,
        toll_cost: params.tollCost,
        total_cost: params.totalCost,
        gas_price_per_liter: params.gasPricePerLiter,
        car_name: params.carName,
        fuel_efficiency: params.fuelEfficiency,
      })
      .select()
      .single();

    if (tripError) throw new Error(tripError.message);
    const tripId = tripData.id;

    await supabase.from('waypoints').insert(
      params.waypoints.map((w, i) => ({
        trip_id: tripId,
        order_index: i,
        place_name: w.place_name,
        distance_from_prev_km: i === 0 ? null : (params.segmentDistances[i - 1] ?? null),
      }))
    );

    if (params.tollSegments.length > 0) {
      await supabase.from('toll_segments').insert(
        params.tollSegments.map((s) => ({
          trip_id: tripId,
          from_ic: s.from_ic,
          to_ic: s.to_ic,
          amount: s.amount,
        }))
      );
    }

    await fetchTrips();
  };

  const deleteTrip = async (id: string) => {
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTrip = async (id: string, updates: { name?: string }) => {
    const { error } = await supabase.from('trips').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  return { trips, loading, saveTrip, deleteTrip, updateTrip, refetch: fetchTrips };
}
