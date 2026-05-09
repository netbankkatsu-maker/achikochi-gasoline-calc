'use client';

import { useState } from 'react';
import { useCars } from '@/hooks/useCars';
import { useTrips } from '@/hooks/useTrips';
import { formatCurrency, formatDistance } from '@/lib/calculations';
import type { Car, Trip } from '@/types';

// ─── 共通 ───────────────────────────────────────────────
type Tab = 'history' | 'cars' | 'export';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── 履歴 ───────────────────────────────────────────────
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
          <span className="text-base font-bold text-blue-600 flex-shrink-0">
            {formatCurrency(trip.total_cost)}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {trip.waypoints && trip.waypoints.length > 0 && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ルート</p>
              <div className="space-y-1">
                {trip.waypoints.map((wp, i) => (
                  <div key={wp.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                    <span className="text-gray-700 truncate">{wp.place_name}</span>
                    {wp.distance_from_prev_km != null && (
                      <span className="text-gray-400 text-xs ml-auto flex-shrink-0">{formatDistance(wp.distance_from_prev_km)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {confirmDelete ? (
            <div className="flex gap-2 pt-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                キャンセル
              </button>
              <button onClick={() => onDelete(trip.id)}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                削除する
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors">
              この記録を削除
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryTab({ trips, loading, deleteTrip }: {
  trips: Trip[];
  loading: boolean;
  deleteTrip: (id: string) => void;
}) {
  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>;
  if (trips.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-4xl mb-2">📋</p>
      <p className="text-sm">まだ記録がありません</p>
      <p className="text-xs mt-1">計算ページで旅行を保存してください</p>
    </div>
  );
  return (
    <div className="space-y-2">
      {trips.map((trip) => <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />)}
    </div>
  );
}

// ─── 車登録 ──────────────────────────────────────────────
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
        <button onClick={() => { setShowAdd(true); setError(null); }}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
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
            <input type="text" value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="例: プリウス、N-BOX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">燃費 (km/L)</label>
            <input type="number" value={addForm.fuel_efficiency}
              onChange={(e) => setAddForm((f) => ({ ...f, fuel_efficiency: e.target.value }))}
              placeholder="例: 20.5" step="0.1" min="1" max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowAdd(false); setAddForm(emptyForm); setError(null); }}
              className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              キャンセル
            </button>
            <button onClick={handleAdd} disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors">
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
                    <input type="text" value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">燃費 (km/L)</label>
                    <input type="number" value={editForm.fuel_efficiency}
                      onChange={(e) => setEditForm((f) => ({ ...f, fuel_efficiency: e.target.value }))}
                      step="0.1" min="1" max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(null); setError(null); }}
                      className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                      キャンセル
                    </button>
                    <button onClick={handleUpdate} disabled={saving}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300">
                      {saving ? '保存中...' : '更新する'}
                    </button>
                  </div>
                </div>
              ) : deleteConfirmId === car.id ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700"><span className="font-semibold">{car.name}</span> を削除しますか？</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                      キャンセル
                    </button>
                    <button onClick={() => handleDelete(car.id)}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
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
                    <button onClick={() => { setEditingId(car.id); setEditForm({ name: car.name, fuel_efficiency: String(car.fuel_efficiency) }); setError(null); }}
                      className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">
                      編集
                    </button>
                    <button onClick={() => setDeleteConfirmId(car.id)}
                      className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
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

// ─── スプレッドシート出力 ────────────────────────────────
function ExportTab({ trips, loading }: { trips: Trip[]; loading: boolean }) {
  const handleExportAll = () => {
    const rows: string[][] = [];

    rows.push(['日付', '旅行名', '出発地', '目的地', '経由地数', '総距離(km)',
      '車種', '燃費(km/L)', 'ガソリン単価(円/L)', '燃料費(円)', '高速料金(円)', '合計(円)']);

    trips.forEach((trip) => {
      const wps = trip.waypoints ?? [];
      rows.push([
        new Date(trip.created_at).toLocaleString('ja-JP'),
        trip.name ?? '',
        wps[0]?.place_name ?? '',
        wps[wps.length - 1]?.place_name ?? '',
        String(wps.length),
        trip.total_distance_km.toFixed(1),
        trip.car_name,
        String(trip.fuel_efficiency),
        String(trip.gas_price_per_liter),
        String(trip.fuel_cost),
        String(trip.toll_cost),
        String(trip.total_cost),
      ]);
    });

    const csv =
      '﻿' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ガソリン代履歴_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDetail = () => {
    const rows: string[][] = [];

    trips.forEach((trip, idx) => {
      if (idx > 0) rows.push([]); // blank line between trips

      const wps = trip.waypoints ?? [];
      const tolls = trip.toll_segments ?? [];

      rows.push([`▼ ${trip.name || '旅行記録'} (${new Date(trip.created_at).toLocaleString('ja-JP')})`]);
      rows.push(['車種', trip.car_name, '燃費', `${trip.fuel_efficiency} km/L`,
        'ガソリン単価', `${trip.gas_price_per_liter} 円/L`]);
      rows.push([]);
      rows.push(['#', '地点名', '区間距離(km)']);
      wps.forEach((wp, i) => {
        rows.push([String(i + 1), wp.place_name,
          i === 0 ? '' : (wp.distance_from_prev_km?.toFixed(1) ?? '')]);
      });
      rows.push([]);
      rows.push(['総距離', `${trip.total_distance_km.toFixed(1)} km`,
        '燃料費', `${trip.fuel_cost} 円`,
        '高速料金', `${trip.toll_cost} 円`,
        '合計', `${trip.total_cost} 円`]);

      if (tolls.length > 0) {
        rows.push([]);
        rows.push(['高速区間', '乗り口', '降り口', '料金(円)']);
        tolls.forEach((s) => rows.push(['', s.from_ic, s.to_ic, String(s.amount)]));
      }
    });

    const csv =
      '﻿' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ガソリン代履歴_詳細_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">一覧表（サマリー）</p>
            <p className="text-xs text-gray-500">1行1件、全履歴をまとめたシート</p>
          </div>
        </div>
        <ul className="text-xs text-gray-500 space-y-0.5 pl-1">
          <li>・ 日付 / 旅行名 / 出発地 / 目的地</li>
          <li>・ 総距離 / 車種 / 燃費 / ガソリン単価</li>
          <li>・ 燃料費 / 高速料金 / 合計</li>
        </ul>
        <button
          onClick={handleExportAll}
          disabled={trips.length === 0}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          📥 一覧表をダウンロード（{trips.length}件）
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">詳細シート</p>
            <p className="text-xs text-gray-500">経由地・区間距離・高速区間ごとの明細</p>
          </div>
        </div>
        <ul className="text-xs text-gray-500 space-y-0.5 pl-1">
          <li>・ 旅行ごとに区切られた詳細レイアウト</li>
          <li>・ 各経由地の区間距離を含む</li>
          <li>・ 高速区間の乗降ICと料金</li>
        </ul>
        <button
          onClick={handleExportDetail}
          disabled={trips.length === 0}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          📥 詳細シートをダウンロード（{trips.length}件）
        </button>
      </div>

      {trips.length === 0 && (
        <p className="text-center text-xs text-gray-400 py-4">
          保存された履歴がありません。計算ページで旅行を保存してください。
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
  { id: 'history', label: '履歴', emoji: '📋' },
  { id: 'cars',    label: '車登録', emoji: '🚗' },
  { id: 'export',  label: '出力', emoji: '📊' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('history');
  const { trips, loading: tripsLoading, deleteTrip } = useTrips();

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-lg font-bold text-gray-800">⚙️ 設定</h1>
        {activeTab === 'history' && (
          <p className="text-xs text-gray-500 mt-0.5">{trips.length}件の記録</p>
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
      {activeTab === 'history' && (
        <HistoryTab trips={trips} loading={tripsLoading} deleteTrip={deleteTrip} />
      )}
      {activeTab === 'cars' && <CarsTab />}
      {activeTab === 'export' && <ExportTab trips={trips} loading={tripsLoading} />}
    </div>
  );
}
