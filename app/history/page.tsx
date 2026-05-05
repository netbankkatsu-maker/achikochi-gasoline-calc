'use client';

import { useState } from 'react';
import { useTrips } from '@/hooks/useTrips';
import { formatCurrency, formatDistance } from '@/lib/calculations';
import type { Trip } from '@/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">
            {trip.name || (trip.waypoints?.[0]?.place_name
              ? `${trip.waypoints[0].place_name} → ${trip.waypoints[trip.waypoints.length - 1]?.place_name}`
              : '旅行記録')}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(trip.created_at)}</p>
        </div>
        <div className="flex items-center gap-3 ml-2">
          <span className="text-lg font-bold text-blue-600 flex-shrink-0">
            {formatCurrency(trip.total_cost)}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {/* 経由地 */}
          {trip.waypoints && trip.waypoints.length > 0 && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ルート</p>
              <div className="space-y-1">
                {trip.waypoints.map((wp, i) => (
                  <div key={wp.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-700">{wp.place_name}</span>
                    {wp.distance_from_prev_km != null && (
                      <span className="text-gray-400 text-xs ml-auto">{formatDistance(wp.distance_from_prev_km)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* コスト詳細 */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">総距離</span>
              <span>{formatDistance(trip.total_distance_km)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{trip.car_name}（{trip.fuel_efficiency} km/L）</span>
              <span>{formatCurrency(trip.fuel_cost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ガソリン単価</span>
              <span>{trip.gas_price_per_liter}円/L</span>
            </div>
            {trip.toll_cost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">高速料金（ETC）</span>
                <span className="text-orange-600">{formatCurrency(trip.toll_cost)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5 mt-1.5">
              <span>合計</span>
              <span className="text-blue-600">{formatCurrency(trip.total_cost)}</span>
            </div>
          </div>

          {/* 高速区間 */}
          {trip.toll_segments && trip.toll_segments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">高速区間</p>
              <div className="space-y-1">
                {trip.toll_segments.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{s.from_ic} → {s.to_ic}</span>
                    <span className="text-orange-600">{formatCurrency(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 削除 */}
          {confirmDelete ? (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => onDelete(trip.id)}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                削除する
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors"
            >
              この記録を削除
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { trips, loading, deleteTrip } = useTrips();

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-lg font-bold text-gray-800">📋 走行履歴</h1>
        <p className="text-xs text-gray-500 mt-0.5">{trips.length}件の記録</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
      ) : trips.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">まだ記録がありません</p>
          <p className="text-xs mt-1">計算ページで旅行を保存してください</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
          ))}
        </div>
      )}
    </div>
  );
}
