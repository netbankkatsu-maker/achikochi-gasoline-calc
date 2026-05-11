'use client';

import { useState } from 'react';
import { useCars } from '@/hooks/useCars';
import { useTrips } from '@/hooks/useTrips';
import { formatCurrency, formatDistance } from '@/lib/calculations';
import type { Car, Trip } from '@/types';

// ─── 共通 ───────────────────────────────────────────────
type Tab = 'routes' | 'cars' | 'export';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

/** trip_date (YYYY-MM-DD) があればそれを優先、なければ created_at を使う */
function tripDisplayDate(trip: Trip): string {
  return trip.trip_date
    ? trip.trip_date.replace(/-/g, '/')
    : formatDateShort(trip.created_at);
}

function tripDisplayDateLong(trip: Trip): string {
  const src = trip.trip_date ?? trip.created_at;
  return formatDate(src);
}

// ─── 経路カード ──────────────────────────────────────────
function RouteCard({
  trip,
  onDelete,
  onUpdate,
}: {
  trip: Trip;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { name?: string }) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(trip.name ?? '');
  const [saving, setSaving] = useState(false);

  const displayName =
    trip.name ||
    (trip.waypoints && trip.waypoints.length >= 2
      ? `${trip.waypoints[0].place_name} → ${trip.waypoints[trip.waypoints.length - 1].place_name}`
      : '経路記録');

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await onUpdate(trip.id, { name: nameInput.trim() || null as unknown as string });
      setEditingName(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate text-sm">{displayName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{tripDisplayDateLong(trip)}</p>
          </div>
          <span className="text-sm font-bold text-blue-600 flex-shrink-0">
            {formatCurrency(trip.total_cost)}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor"
            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* 展開コンテンツ */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">

          {/* 名前編集 */}
          <div className="pt-3">
            {editingName ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  placeholder="旅行名を入力"
                  autoFocus
                  className="flex-1 px-3 py-1.5 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:bg-gray-300"
                >
                  {saving ? '保存中' : '保存'}
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameInput(trip.name ?? ''); }}
                  className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                旅行名を編集
              </button>
            )}
          </div>

          {/* ルート */}
          {trip.waypoints && trip.waypoints.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ルート</p>
              <div className="space-y-1">
                {trip.waypoints.map((wp, i) => (
                  <div key={wp.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 truncate">{wp.place_name}</span>
                    {wp.distance_from_prev_km != null && (
                      <span className="text-gray-400 text-xs ml-auto flex-shrink-0">
                        {formatDistance(wp.distance_from_prev_km)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 高速区間 */}
          {trip.toll_segments && trip.toll_segments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">高速区間（ETC）</p>
              <div className="space-y-1">
                {trip.toll_segments.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{s.from_ic} → {s.to_ic}</span>
                    <span className="text-orange-600 font-medium">{formatCurrency(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trip.parking_segments && trip.parking_segments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">駐車場</p>
              <div className="space-y-1">
                {trip.parking_segments.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{s.location || '（場所未入力）'}</span>
                    <span className="text-purple-600 font-medium">{formatCurrency(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 費用サマリー */}
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
            {(trip.parking_cost ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">駐車場代</span>
                <span className="text-purple-600">{formatCurrency(trip.parking_cost)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5 mt-1.5">
              <span>合計</span>
              <span className="text-blue-600">{formatCurrency(trip.total_cost)}</span>
            </div>
          </div>

          {/* 削除 */}
          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => onDelete(trip.id)}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
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

// ─── 経路タブ ────────────────────────────────────────────
function RoutesTab({
  trips,
  loading,
  deleteTrip,
  updateTrip,
}: {
  trips: Trip[];
  loading: boolean;
  deleteTrip: (id: string) => void;
  updateTrip: (id: string, updates: { name?: string }) => Promise<void>;
}) {
  if (loading) {
    return <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>;
  }
  if (trips.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">🗺️</p>
        <p className="text-sm">まだ保存された経路がありません</p>
        <p className="text-xs mt-1">計算ページで旅行を保存してください</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {trips.map((trip) => (
        <RouteCard
          key={trip.id}
          trip={trip}
          onDelete={deleteTrip}
          onUpdate={updateTrip}
        />
      ))}
    </div>
  );
}

// ─── 車登録タブ ───────────────────────────────────────────
type FormState = { name: string; fuel_efficiency: string };
const emptyForm: FormState = { name: '', fuel_efficiency: '' };

function CarsTab() {
  const { cars, loading, addCar, updateCar, deleteCar } = useCars();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validate = (f: FormState): string | null => {
    if (!f.name.trim()) return '車の名前を入力してください';
    const fe = parseFloat(f.fuel_efficiency);
    if (isNaN(fe) || fe <= 0 || fe > 50) return '燃費は1〜50の数値を入力してください';
    return null;
  };

  const handleAdd = async () => {
    const err = validate(addForm);
    if (err) { setError(err); return; }
    setSaving(true); setError(null);
    try {
      await addCar(addForm.name.trim(), parseFloat(addForm.fuel_efficiency));
      setAddForm(emptyForm); setShowAdd(false);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '保存に失敗しました'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const err = validate(editForm);
    if (err) { setError(err); return; }
    setSaving(true); setError(null);
    try {
      await updateCar(editingId, editForm.name.trim(), parseFloat(editForm.fuel_efficiency));
      setEditingId(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '更新に失敗しました'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteCar(id); setDeleteConfirmId(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : '削除に失敗しました'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowAdd(true); setError(null); }}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          ＋ 追加
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
      )}

      {showAdd && (
        <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">新しい車を追加</h3>
          <div>
            <label className="text-xs text-gray-500 block mb-1">車の名前</label>
            <input
              type="text" value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="例: プリウス、N-BOX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">燃費 (km/L)</label>
            <input
              type="number" value={addForm.fuel_efficiency}
              onChange={(e) => setAddForm((f) => ({ ...f, fuel_efficiency: e.target.value }))}
              placeholder="例: 20.5" step="0.1" min="1" max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAdd(false); setAddForm(emptyForm); setError(null); }}
              className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleAdd} disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
      ) : cars.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🚗</p>
          <p className="text-sm">まだ車が登録されていません</p>
          <p className="text-xs mt-1">「＋追加」から登録してください</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cars.map((car: Car) => (
            <div key={car.id} className="bg-white rounded-xl border border-gray-200 p-4">
              {editingId === car.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">車の名前</label>
                    <input
                      type="text" value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">燃費 (km/L)</label>
                    <input
                      type="number" value={editForm.fuel_efficiency}
                      onChange={(e) => setEditForm((f) => ({ ...f, fuel_efficiency: e.target.value }))}
                      step="0.1" min="1" max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingId(null); setError(null); }}
                      className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleUpdate} disabled={saving}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      {saving ? '保存中...' : '更新する'}
                    </button>
                  </div>
                </div>
              ) : deleteConfirmId === car.id ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{car.name}</span> を削除しますか？
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleDelete(car.id)}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      削除する
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{car.name}</p>
                    <p className="text-sm text-gray-500">{car.fuel_efficiency} km/L</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(car.id);
                        setEditForm({ name: car.name, fuel_efficiency: String(car.fuel_efficiency) });
                        setError(null);
                      }}
                      className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(car.id)}
                      className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 出力タブ（税務署提出用） ──────────────────────────────
function ExportTab({ trips, loading }: { trips: Trip[]; loading: boolean }) {

  // 税務署提出用（1行1トリップ）
  const handleExportTax = () => {
    const rows: string[][] = [];

    rows.push([
      '日付', '旅行名', '経路（経由地）', '経由高速道路',
      'ガソリン代（円）', '高速道路料金（円）', '駐車場代（円）', '合計（円）',
    ]);

    trips.forEach((trip) => {
      const wps = trip.waypoints ?? [];
      const tolls = trip.toll_segments ?? [];
      const route = wps.map((w) => w.place_name).join(' → ');
      const highways = tolls.length > 0
        ? tolls.map((s) => `${s.from_ic}→${s.to_ic}`).join('、')
        : '−';
      rows.push([
        tripDisplayDate(trip),
        trip.name ?? '',
        route,
        highways,
        String(trip.fuel_cost),
        String(trip.toll_cost),
        String(trip.parking_cost ?? 0),
        String(trip.total_cost),
      ]);
    });

    if (trips.length > 0) {
      const totalFuel    = trips.reduce((s, t) => s + t.fuel_cost, 0);
      const totalToll    = trips.reduce((s, t) => s + t.toll_cost, 0);
      const totalParking = trips.reduce((s, t) => s + (t.parking_cost ?? 0), 0);
      const totalAll     = trips.reduce((s, t) => s + t.total_cost, 0);
      rows.push([]);
      rows.push(['合計', '', '', '', String(totalFuel), String(totalToll), String(totalParking), String(totalAll)]);
    }

    downloadCsv(rows, `交通費明細_${todayStr()}.csv`);
  };

  // freee / マネーフォワード用（1行1費目）
  const handleExportAccounting = () => {
    const rows: string[][] = [];
    rows.push(['日付', '内容', '金額（円）']);

    trips.forEach((trip) => {
      const wps = trip.waypoints ?? [];
      const route = wps.length >= 2
        ? `${wps[0].place_name}→${wps[wps.length - 1].place_name}`
        : (trip.name ?? '移動');
      const label = trip.name ? `${trip.name}（${route}）` : route;
      const date = tripDisplayDate(trip);

      // ガソリン代
      rows.push([date, `ガソリン代（${label}）`, String(trip.fuel_cost)]);

      // 高速料金（IC区間ごと）
      const tolls = trip.toll_segments ?? [];
      if (tolls.length > 0) {
        tolls.forEach((s) => {
          rows.push([date, `高速料金（${s.from_ic}→${s.to_ic}）`, String(s.amount)]);
        });
      } else if (trip.toll_cost > 0) {
        rows.push([date, `高速料金（${label}）`, String(trip.toll_cost)]);
      }

      // 駐車場代（場所ごと）
      const parkings = trip.parking_segments ?? [];
      if (parkings.length > 0) {
        parkings.forEach((p) => {
          const loc = p.location || '駐車場';
          rows.push([date, `駐車場代（${loc}）`, String(p.amount)]);
        });
      } else if ((trip.parking_cost ?? 0) > 0) {
        rows.push([date, `駐車場代（${label}）`, String(trip.parking_cost)]);
      }
    });

    downloadCsv(rows, `交通費_会計ソフト用_${todayStr()}.csv`);
  };

  function todayStr() {
    return new Date().toLocaleDateString('ja-JP').replace(/\//g, '-');
  }

  function downloadCsv(rows: string[][], filename: string) {
    const csv =
      '﻿' +
      rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>;

  return (
    <div className="space-y-4">

      {/* 税務署提出用 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏛️</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">税務署提出用</p>
            <p className="text-xs text-gray-500">1行1件・確定申告の交通費明細に</p>
          </div>
        </div>
        <div className="text-xs text-gray-500 space-y-0.5 pl-1">
          <p>日付 / 旅行名 / 経路 / 経由高速道路</p>
          <p>ガソリン代 / 高速料金 / 駐車場代 / 合計</p>
          <p className="text-gray-400">最終行に全件の合計が自動追加されます</p>
        </div>
        <button
          onClick={handleExportTax}
          disabled={trips.length === 0}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          📥 税務署用をダウンロード（{trips.length}件）
        </button>
      </div>

      {/* freee / マネーフォワード用 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📱</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">freee / マネーフォワード用</p>
            <p className="text-xs text-gray-500">費目ごとに1行・会計ソフトに読み込める形式</p>
          </div>
        </div>
        <div className="text-xs text-gray-500 space-y-0.5 pl-1">
          <p>列：日付 / 内容 / 金額</p>
          <p>ガソリン代・高速料金・駐車場代を別行で出力</p>
          <p className="text-gray-400">例：「ガソリン代（東京→大阪）　3,250円」</p>
        </div>
        <button
          onClick={handleExportAccounting}
          disabled={trips.length === 0}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          📥 会計ソフト用をダウンロード（{trips.length}件）
        </button>
      </div>

      {trips.length === 0 && (
        <p className="text-center text-xs text-gray-400 py-2">
          保存された経路がありません。計算ページで旅行を保存してください。
        </p>
      )}
      <p className="text-center text-xs text-gray-400">
        CSV形式 / Excelで開くと日本語が正しく表示されます
      </p>
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'routes', label: '経路',  emoji: '🗺️' },
  { id: 'cars',   label: '車登録', emoji: '🚗' },
  { id: 'export', label: '出力',  emoji: '📊' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('routes');
  const { trips, loading: tripsLoading, deleteTrip, updateTrip } = useTrips();

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-lg font-bold text-gray-800">⚙️ 設定</h1>
        {activeTab === 'routes' && (
          <p className="text-xs text-gray-500 mt-0.5">{trips.length}件の経路</p>
        )}
      </div>

      {/* タブバー */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'routes' && (
        <RoutesTab
          trips={trips}
          loading={tripsLoading}
          deleteTrip={deleteTrip}
          updateTrip={updateTrip}
        />
      )}
      {activeTab === 'cars' && <CarsTab />}
      {activeTab === 'export' && <ExportTab trips={trips} loading={tripsLoading} />}
    </div>
  );
}
