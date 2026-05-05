'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Car } from '@/types';

function parseCar(raw: Record<string, unknown>): Car {
  return {
    id: raw.id as string,
    name: raw.name as string,
    fuel_efficiency: parseFloat(raw.fuel_efficiency as string),
    created_at: raw.created_at as string,
  };
}

export function useCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setCars((data ?? []).map(parseCar));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const addCar = async (name: string, fuel_efficiency: number) => {
    const { error } = await supabase.from('cars').insert({ name, fuel_efficiency });
    if (error) throw new Error(error.message);
    await fetchCars();
  };

  const updateCar = async (id: string, name: string, fuel_efficiency: number) => {
    const { error } = await supabase
      .from('cars')
      .update({ name, fuel_efficiency })
      .eq('id', id);
    if (error) throw new Error(error.message);
    await fetchCars();
  };

  const deleteCar = async (id: string) => {
    const { error } = await supabase.from('cars').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchCars();
  };

  return { cars, loading, error, addCar, updateCar, deleteCar, refetch: fetchCars };
}
