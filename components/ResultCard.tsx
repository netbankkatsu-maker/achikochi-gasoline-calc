'use client';

import { formatCurrency, formatDistance } from '@/lib/calculations';
import type { CalculationResult, WaypointInput } from '@/types';

type Props = {
  result: CalculationResult;
  waypoints: WaypointInput[];
  carName: string;
  gasPrice: number;
  tripName: string;
  onTripNameChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
};

export default function ResultCard({
  result,
  waypoints,
  carName,
  gasPrice,
  tripName,
  onTripNameChange,
  onSave,
  isSaving,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-blue-600 text-white px-4 py-3">
        <h2 className="font-semibold text-sm">計算結果</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* 区間距離 */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">区間距離</h3>
          <div className="space-y-1">
            {result.segmentDistances.map((dist, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate max-w-[200px]">
                  {waypoints[i]?.place_name || `地点${i + 1}`} → {waypoints[i + 1]?.place_name || `地点${i + 2}`}
                </span>
                <span className="text-gray-800 font-medium ml-2 flex-shrink-0">{formatDistance(dist)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* サマリー */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">総距離</span>
            <span className="font-medium">{formatDistance(result.totalDistanceKm)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">燃料費（{carName}、{gasPrice}円/L）</span>
            <span className="font-medium text-blue-700">{formatCurrency(result.fuelCost)}</span>
          </div>
          {result.tollCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">高速料金（ETC合計）</span>
              <span className="font-medium text-orange-600">{formatCurrency(result.tollCost)}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
          <span className="font-bold text-gray-800">合計</span>
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(result.totalCost)}</span>
        </div>

        {/* 保存 */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <input
            type="text"
            value={tripName}
            onChange={(e) => onTripNameChange(e.target.value)}
            placeholder="旅行名（省略可）例: 大阪旅行"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={onSave}
            disabled={isSaving}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {isSaving ? '保存中...' : '💾 この結果を保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
