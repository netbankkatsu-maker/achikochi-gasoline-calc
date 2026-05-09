'use client';

import { formatCurrency } from '@/lib/calculations';
import type { TollSegmentInput } from '@/types';

type Props = {
  segments: TollSegmentInput[];
  onAdd: () => void;
  onRemove: (tempId: string) => void;
  onUpdate: (tempId: string, updates: Partial<TollSegmentInput>) => void;
  googleTollEstimate: number | null;
  isEstimatingToll: boolean;
  onAddFromEstimate: (amount: number) => void;
};

export default function TollSegmentList({
  segments,
  onAdd,
  onRemove,
  onUpdate,
  googleTollEstimate,
  isEstimatingToll,
  onAddFromEstimate,
}: Props) {
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

      {/* Google Routes API による推定料金 */}
      {isEstimatingToll && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <svg className="animate-spin w-4 h-4 text-blue-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-xs text-gray-500">Google Maps で高速料金を推定中...</span>
        </div>
      )}

      {!isEstimatingToll && googleTollEstimate !== null && googleTollEstimate > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-blue-800">🤖 Google推定ETC料金</span>
              <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">参考</span>
            </div>
            <span className="text-sm font-bold text-blue-700">{formatCurrency(googleTollEstimate)}</span>
          </div>
          <p className="text-xs text-blue-600">
            Google Maps のルートから推定した ETC 料金です。実際の料金と異なる場合があります。
          </p>
          <button
            onClick={() => onAddFromEstimate(googleTollEstimate)}
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            この料金を手動入力欄に追加する
          </button>
        </div>
      )}

      {!isEstimatingToll && googleTollEstimate === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">🤖 Google Maps: このルートに高速料金はありません</span>
        </div>
      )}

      {segments.length === 0 && !isEstimatingToll && googleTollEstimate === null && (
        <p className="text-xs text-gray-400 text-center py-2">
          計算ボタンを押すと Google Maps が高速料金を自動推定します
        </p>
      )}

      <div className="space-y-3">
        {segments.map((seg) => (
          <div key={seg.tempId} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50">
            <div className="flex items-center gap-2">
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
                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors mt-4"
                aria-label="削除"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div>
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
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="w-full py-2 border border-dashed border-orange-400 text-orange-600 rounded-lg text-sm hover:bg-orange-50 transition-colors flex items-center justify-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        高速区間を手動で追加
      </button>
    </div>
  );
}
