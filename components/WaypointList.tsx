'use client';

import { useRef, useState } from 'react';
import type { WaypointInput } from '@/types';
import WaypointItem from './WaypointItem';

type Props = {
  waypoints: WaypointInput[];
  isLoaded: boolean;
  avoidTolls: boolean;
  onUpdate: (tempId: string, updates: Partial<WaypointInput>) => void;
  onAdd: () => void;
  onRemove: (tempId: string) => void;
  onReorder: (fromTempId: string, toTempId: string) => void;
  onToggleAvoidTolls: () => void;
};

export default function WaypointList({ waypoints, isLoaded, avoidTolls, onUpdate, onAdd, onRemove, onReorder, onToggleAvoidTolls }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Each row's DOM element, keyed by tempId
  const rowRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // Called when the grip handle fires pointerdown → start capture
  const handleGripPointerDown = (tempId: string) => (e: React.PointerEvent) => {
    e.preventDefault(); // prevent text selection / page scroll
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingId(tempId);
    setDragOverId(null);
  };

  // While captured, pointermove fires only on the grip that captured it.
  // Use elementFromPoint to find which row is under the pointer.
  const handleGripPointerMove = (e: React.PointerEvent) => {
    if (!draggingId) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;

    for (const [id, rowEl] of rowRefs.current) {
      if (id !== draggingId && rowEl && rowEl.contains(el)) {
        if (dragOverId !== id) setDragOverId(id);
        return;
      }
    }
    setDragOverId(null);
  };

  // Release → perform reorder
  const handleGripPointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (draggingId && dragOverId && draggingId !== dragOverId) {
      onReorder(draggingId, dragOverId);
    }
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-sm">経由地点</h2>
        <span className="text-xs text-gray-400">{waypoints.length}地点</span>
      </div>

      <div className="space-y-1">
        {waypoints.map((wp, i) => (
          <div
            key={wp.tempId}
            ref={(el) => { rowRefs.current.set(wp.tempId, el); }}
          >
            {i > 0 && (
              <div className="flex items-center gap-2 py-0.5 pl-5">
                <div className="w-6 flex justify-center">
                  <div className="w-0.5 h-4 bg-gray-300" />
                </div>
                {wp.distance_from_prev_km != null && (
                  <span className="text-xs text-gray-400">{wp.distance_from_prev_km.toFixed(1)} km</span>
                )}
              </div>
            )}
            <WaypointItem
              waypoint={wp}
              index={i}
              total={waypoints.length}
              isLoaded={isLoaded}
              isDragging={draggingId === wp.tempId}
              isDragOver={dragOverId === wp.tempId && draggingId !== wp.tempId}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onGripPointerDown={handleGripPointerDown(wp.tempId)}
              onGripPointerMove={handleGripPointerMove}
              onGripPointerUp={handleGripPointerUp}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="w-full py-2 border border-dashed border-blue-400 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        経由地を追加
      </button>

      {/* ルート種別 */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500 mb-2">ルートの種類</p>
        <div className="flex gap-2">
          <button
            onClick={() => avoidTolls && onToggleAvoidTolls()}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
              !avoidTolls
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            🛣️ 通常（高速あり）
          </button>
          <button
            onClick={() => !avoidTolls && onToggleAvoidTolls()}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
              avoidTolls
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            🏘️ 下道のみ
          </button>
        </div>
        {avoidTolls && (
          <p className="text-xs text-gray-400 mt-1.5">
            高速を使わないルートで距離を計算します
          </p>
        )}
        {!avoidTolls && (
          <p className="text-xs text-gray-400 mt-1.5">
            途中から高速に乗る場合は経由地に「乗った場所」を追加してください
          </p>
        )}
      </div>
    </div>
  );
}
