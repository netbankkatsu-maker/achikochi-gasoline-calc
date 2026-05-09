'use client';

import { useState, useCallback } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useCars } from '@/hooks/useCars';
import { useTrips } from '@/hooks/useTrips';
import { calculateRoute, estimateRouteToll } from '@/lib/google-maps';
import { calculateFuelCost, calculateTollCost } from '@/lib/calculations';
import WaypointList from '@/components/WaypointList';
import TollSegmentList from '@/components/TollSegmentList';
import ResultCard from '@/components/ResultCard';
import type { WaypointInput, TollSegmentInput, CalculationResult } from '@/types';

const GAS_PRESETS = [155, 165, 175, 185];

function uuid() {
  return Math.random().toString(36).slice(2);
}

export default function HomePage() {
  const { isLoaded, error: mapsError } = useGoogleMaps();
  const { cars } = useCars();
  const { saveTrip } = useTrips();

  const [waypoints, setWaypoints] = useState<WaypointInput[]>([
    { tempId: uuid(), place_name: '' },
    { tempId: uuid(), place_name: '' },
  ]);
  // Filled waypoints used for the last calculation (matches segmentDistances indices)
  const [resultWaypoints, setResultWaypoints] = useState<WaypointInput[]>([]);
  const [selectedCarId, setSelectedCarId] = useState('');
  const [gasPrice, setGasPrice] = useState(175);
  const [tollSegments, setTollSegments] = useState<TollSegmentInput[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [tripName, setTripName] = useState('');
  const [googleTollEstimate, setGoogleTollEstimate] = useState<number | null>(null);
  const [isEstimatingToll, setIsEstimatingToll] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const selectedCar = cars.find((c) => c.id === selectedCarId);

  const updateWaypoint = useCallback((tempId: string, updates: Partial<WaypointInput>) => {
    setWaypoints((prev) =>
      prev.map((wp) => (wp.tempId === tempId ? { ...wp, ...updates } : wp))
    );
    setResult(null);
  }, []);

  const addWaypoint = useCallback(() => {
    setWaypoints((prev) => [
      ...prev.slice(0, -1),
      { tempId: uuid(), place_name: '' },
      prev[prev.length - 1],
    ]);
    setResult(null);
  }, []);

  const removeWaypoint = useCallback((tempId: string) => {
    setWaypoints((prev) => prev.filter((wp) => wp.tempId !== tempId));
    setResult(null);
  }, []);

  const reorderWaypoints = useCallback((fromTempId: string, toTempId: string) => {
    setWaypoints((prev) => {
      const fromIdx = prev.findIndex((wp) => wp.tempId === fromTempId);
      const toIdx = prev.findIndex((wp) => wp.tempId === toTempId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const next = [...prev];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return next;
    });
    setResult(null);
  }, []);

  const addTollSegment = () => {
    setTollSegments((prev) => [...prev, { tempId: uuid(), from_ic: '', to_ic: '', amount: 0 }]);
  };

  const addTollFromGoogleEstimate = (amount: number) => {
    setTollSegments((prev) => [
      ...prev,
      { tempId: uuid(), from_ic: '自動検出', to_ic: '自動検出', amount },
    ]);
  };

  const removeTollSegment = (tempId: string) => {
    setTollSegments((prev) => prev.filter((s) => s.tempId !== tempId));
  };

  const updateTollSegment = (tempId: string, updates: Partial<TollSegmentInput>) => {
    setTollSegments((prev) => prev.map((s) => (s.tempId === tempId ? { ...s, ...updates } : s)));
  };

  const handleCalculate = async () => {
    setError(null);
    setGoogleTollEstimate(null);

    const filledWaypoints = waypoints.filter((wp) => wp.place_name.trim());
    if (filledWaypoints.length < 2) {
      setError('出発地と目的地を入力してください');
      return;
    }
    if (!selectedCar) {
      setError('使用する車を選択してください');
      return;
    }
    if (!gasPrice || gasPrice <= 0) {
      setError('ガソリン単価を入力してください');
      return;
    }

    setIsCalculating(true);
    setIsEstimatingToll(true);
    try {
      // ルート計算と高速料金推定を並行実行
      const [routeResult, tollEstimate] = await Promise.all([
        calculateRoute(filledWaypoints),
        estimateRouteToll(filledWaypoints),
      ]);

      const { segmentDistances, totalKm } = routeResult;
      setGoogleTollEstimate(tollEstimate);

      // Map distances back by tempId so empty/skipped waypoints don't shift indices
      const distanceMap = new Map<string, number | undefined>();
      filledWaypoints.forEach((wp, i) => {
        distanceMap.set(wp.tempId, i === 0 ? undefined : segmentDistances[i - 1]);
      });
      setWaypoints((prev) =>
        prev.map((wp) => ({
          ...wp,
          distance_from_prev_km: distanceMap.get(wp.tempId),
        }))
      );

      // Store the filled waypoints so ResultCard and saveTrip use the correct ordering
      setResultWaypoints(filledWaypoints);

      const fuelCost = calculateFuelCost(totalKm, selectedCar.fuel_efficiency, gasPrice);
      const tollCost = calculateTollCost(tollSegments);

      setResult({
        totalDistanceKm: totalKm,
        fuelCost,
        tollCost,
        totalCost: fuelCost + tollCost,
        segmentDistances,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'ルート計算に失敗しました');
    } finally {
      setIsCalculating(false);
      setIsEstimatingToll(false);
    }
  };

  const handleSave = async () => {
    if (!result || !selectedCar) return;
    setIsSaving(true);
    try {
      await saveTrip({
        name: tripName,
        totalDistanceKm: result.totalDistanceKm,
        fuelCost: result.fuelCost,
        tollCost: result.tollCost,
        totalCost: result.totalCost,
        gasPricePerLiter: gasPrice,
        carName: selectedCar.name,
        fuelEfficiency: selectedCar.fuel_efficiency,
        waypoints: resultWaypoints, // use filled waypoints that align with segmentDistances
        tollSegments,
        segmentDistances: result.segmentDistances,
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
      setTripName('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (!result || !selectedCar) return;

    const rows: string[][] = [];

    // ヘッダー情報
    rows.push(['ガソリン代計算結果']);
    rows.push(['車種', selectedCar.name]);
    rows.push(['燃費', `${selectedCar.fuel_efficiency} km/L`]);
    rows.push(['ガソリン単価', `${gasPrice} 円/L`]);
    if (tripName) rows.push(['旅行名', tripName]);
    rows.push([]);

    // 経由地と区間距離
    rows.push(['#', '地点名', '区間距離 (km)']);
    resultWaypoints.forEach((wp, i) => {
      const dist = i === 0 ? '' : result.segmentDistances[i - 1]?.toFixed(1) ?? '';
      rows.push([String(i + 1), wp.place_name, dist]);
    });
    rows.push([]);

    // 高速料金
    if (tollSegments.length > 0) {
      rows.push(['高速区間', '乗り口', '降り口', '料金 (円)']);
      tollSegments.forEach((s) => {
        rows.push(['', s.from_ic, s.to_ic, String(s.amount)]);
      });
      rows.push([]);
    }

    // 合計
    rows.push(['総距離', `${result.totalDistanceKm.toFixed(1)} km`]);
    rows.push(['燃料費', `${result.fuelCost} 円`]);
    if (result.tollCost > 0) rows.push(['高速料金合計', `${result.tollCost} 円`]);
    rows.push(['合計', `${result.totalCost} 円`]);

    // CSV文字列生成（UTF-8 BOM付き for Excel）
    const csvContent =
      '﻿' +
      rows
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = tripName ? `${tripName}.csv` : 'ガソリン代計算結果.csv';
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-lg font-bold text-gray-800">⛽ ガソリン代計算</h1>
        {mapsError && (
          <p className="text-xs text-red-500 mt-1">地図エラー: {mapsError}</p>
        )}
      </div>

      {savedMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm text-center">
          ✅ 保存しました！
        </div>
      )}

      <WaypointList
        waypoints={waypoints}
        isLoaded={isLoaded}
        onUpdate={updateWaypoint}
        onAdd={addWaypoint}
        onRemove={removeWaypoint}
        onReorder={reorderWaypoints}
      />

      {/* 車選択 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="font-semibold text-gray-800 text-sm">🚗 使用する車</h2>
        {cars.length === 0 ? (
          <p className="text-sm text-gray-400">
            車が登録されていません。
            <a href="/cars" className="text-blue-600 underline ml-1">車登録ページ</a>で追加してください。
          </p>
        ) : (
          <select
            value={selectedCarId}
            onChange={(e) => setSelectedCarId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">車を選択してください</option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.name}（{car.fuel_efficiency} km/L）
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ガソリン単価 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="font-semibold text-gray-800 text-sm">💴 ガソリン単価</h2>
        <div className="relative">
          <input
            type="number"
            value={gasPrice}
            onChange={(e) => setGasPrice(parseInt(e.target.value) || 0)}
            min="100"
            max="300"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">円/L</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {GAS_PRESETS.map((price) => (
            <button
              key={price}
              onClick={() => setGasPrice(price)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                gasPrice === price
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {price}円
            </button>
          ))}
        </div>
      </div>

      <TollSegmentList
        segments={tollSegments}
        onAdd={addTollSegment}
        onRemove={removeTollSegment}
        onUpdate={updateTollSegment}
        googleTollEstimate={googleTollEstimate}
        isEstimatingToll={isEstimatingToll}
        onAddFromEstimate={addTollFromGoogleEstimate}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleCalculate}
        disabled={isCalculating || !isLoaded}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl text-base transition-colors shadow-sm"
      >
        {isCalculating ? '⏳ 計算中...' : isLoaded ? '⛽ ガソリン代を計算する' : '🗺️ 地図を読み込み中...'}
      </button>

      {result && selectedCar && (
        <ResultCard
          result={result}
          waypoints={resultWaypoints}
          carName={selectedCar.name}
          gasPrice={gasPrice}
          tripName={tripName}
          onTripNameChange={setTripName}
          onSave={handleSave}
          isSaving={isSaving}
          onExport={handleExportCsv}
        />
      )}
    </div>
  );
}
