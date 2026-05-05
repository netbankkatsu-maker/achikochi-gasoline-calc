'use client';

import { useState } from 'react';
import { useCars } from '@/hooks/useCars';
import type { Car } from '@/types';

type FormState = { name: string; fuel_efficiency: string };
const emptyForm: FormState = { name: '', fuel_efficiency: '' };

export default function CarsPage() {
  const { cars, loading, addCar, updateCar, deleteCar } = useCars();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validateForm = (f: FormState): string | null => {
    if (!f.name.trim()) return '車の名前を入力してください';
    const fe = parseFloat(f.fuel_efficiency);
    if (isNaN(fe) || fe <= 0 || fe > 50) return '燃費は1〜50の数値を入力してください';
    return null;
  };

  const handleAdd = async () => {
    const err = validateForm(addForm);
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    try {
      await addCar(addForm.name.trim(), parseFloat(addForm.fuel_efficiency));
      setAddForm(emptyForm);
      setShowAdd(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (car: Car) => {
    setEditingId(car.id);
    setEditForm({ name: car.name, fuel_efficiency: String(car.fuel_efficiency) });
    setError(null);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const err = validateForm(editForm);
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    try {
      await updateCar(editingId, editForm.name.trim(), parseFloat(editForm.fuel_efficiency));
      setEditingId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCar(id);
      setDeleteConfirmId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '削除に失敗しました');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-lg font-bold text-gray-800">🚗 車登録</h1>
        <button
          onClick={() => { setShowAdd(true); setError(null); }}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + 追加
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 追加フォーム */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
          <h2 className="font-semibold text-sm text-gray-700">新しい車を追加</h2>
          <div>
            <label className="text-xs text-gray-500 block mb-1">車の名前</label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="例: プリウス、N-BOX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">燃費 (km/L)</label>
            <input
              type="number"
              value={addForm.fuel_efficiency}
              onChange={(e) => setAddForm((f) => ({ ...f, fuel_efficiency: e.target.value }))}
              placeholder="例: 20.5"
              step="0.1"
              min="1"
              max="50"
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
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>
      )}

      {/* 車一覧 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
      ) : cars.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🚗</p>
          <p className="text-sm">まだ車が登録されていません</p>
          <p className="text-xs mt-1">上の「＋追加」から登録してください</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cars.map((car) => (
            <div key={car.id} className="bg-white rounded-xl border border-gray-200 p-4">
              {editingId === car.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">車の名前</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">燃費 (km/L)</label>
                    <input
                      type="number"
                      value={editForm.fuel_efficiency}
                      onChange={(e) => setEditForm((f) => ({ ...f, fuel_efficiency: e.target.value }))}
                      step="0.1"
                      min="1"
                      max="50"
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
                      onClick={handleUpdate}
                      disabled={saving}
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
                      onClick={() => handleEdit(car)}
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
