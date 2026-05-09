'use client';

import { useState } from 'react';
import { estimateRouteToll } from '@/lib/google-maps';
import { formatCurrency } from '@/lib/calculations';
import type { TollSegmentInput } from '@/types';

type Props = {
  segments: TollSegmentInput[];
  onAdd: () => void;
  onRemove: (tempId: string) => void;
  onUpdate: (tempId: string, updates: Partial<TollSegmentInput>) => void;
};

export default function TollSegmentList({ segments, onAdd, onRemove, onUpdate }: Props) {
  // tempId → 推定中かどうか
  const [estimatingIds, setEstimatingIds] = useState<Set<string>>(new Set());
  // tempId → 推定失敗メッセージ
  const [estimateErrors, setEstimateErrors] = useState<Map<string, string>>(new Map());

  const handleEstimate = async (seg: TollSegmentInput) => {
    const from = seg.from_ic.trim();
    const to = seg.to_ic.trim();
    if (!from || !to) return;

    setEstimatingIds((prev) => new Set(prev).add(seg.tempId));
    setEstimateErrors((prev) => { const m = new Map(prev); m.delete(seg.tempId); return m; });

    const result = await estimateRouteToll([
      { tempId: 'from', place_name: from },
      { tempId: 'to',   place_name: to },
    ]);

    setEstimatingIds((prev) => {
      const s = new Set(prev); s.delete(seg.tempId); return s;
    });

    if (result !== null) {
      onUpdate(seg.tempId, { amount: result });
    } else {
      setEstimateErrors((prev) =>
        new Map(prev).set(seg.tempId, '料金を取得できませんでした')
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-sm">🛣️ 高速料金（ETC）</h2>
        <a
          href="https://www.driveplaza.com/dp/SearchTop"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 underline"
        >
          NEXCO料金確認 ↗
        </a>
      </div>

      {segments.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          高速を使わない場合は追加不要です
        </p>
      )}

      <div className="space-y-3">
        {segments.map((seg) => {
          const canEstimate = seg.from_ic.trim().length > 0 && seg.to_ic.trim().length > 0;
          const isEstimating = estimatingIds.has(seg.tempId);
          const estimateError = estimateErrors.get(seg.tempId);

          return (
            <div key={seg.tempId} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50">
              {/* IC入力 + 削除 */}
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">乗ったIC</label>
                    <input
                      type="text"
                      value={seg.from_ic}
                      onChange={(e) => onUpdate(seg.tempId, { from_ic: e.target.value })}
                      placeholder="例: 東京IC"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">降りたIC</label>
                    <input
                      type="text"
                      value={seg.to_ic}
                      onChange={(e) => onUpdate(seg.tempId, { to_ic: e.target.value })}
                      placeholder="例: 名古屋IC"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
                <button
                  onClick={() => onRemove(seg.tempId)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors mt-5"
                  aria-label="削除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ETC料金 + 推定ボタン */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">ETC料金 (円)</label>
                  <input
                    type="number"
                    value={seg.amount || ''}
                    onChange={(e) => onUpdate(seg.tempId, { amount: parseInt(e.target.value) || 0 })}
                    placeholder="例: 3220"
                    min="0"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
                {/* Google推定ボタン：両IC入力済みのときだけ表示 */}
                {canEstimate && (
                  <button
                    onClick={() => handleEstimate(seg)}
                    disabled={isEstimating}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 border border-blue-300 text-blue-700 rounded text-xs font-medium transition-colors whitespace-nowrap mb-0.5"
                  >
                    {isEstimating ? (
                      <>
                        <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        推定中
                      </>
                    ) : (
                      <>🤖 推定</>
                    )}
                  </button>
                )}
              </div>

              {/* 推定結果の表示 */}
              {!isEstimating && seg.amount > 0 && canEstimate && (
                <p className="text-xs text-gray-500">
                  → {formatCurrency(seg.amount)}（手動入力 or Google推定）
                </p>
              )}
              {estimateError && (
                <p className="text-xs text-red-500">{estimateError}</p>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onAdd}
        className="w-full py-2 border border-dashed border-orange-400 text-orange-600 rounded-lg text-sm hover:bg-orange-50 transition-colors flex items-center justify-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        高速区間を追加
      </button>
    </div>
  );
}
