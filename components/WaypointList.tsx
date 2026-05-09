'use client';

import { useRef, useState } from 'react';
import type { WaypointInput } from '@/types';
import WaypointItem from './WaypointItem';

type Props = {
  waypoints: WaypointInput[];
  isLoaded: boolean;
  onUpdate: (tempId: string, updates: Partial<WaypointInput>) => void;
  onAdd: () => void;
  onRemove: (tempId: string) => void;
  onReorder: (fromTempId: string, toTempId: string) => void;
};

export default function WaypointList({ waypoints, isLoaded, onUpdate, onAdd, onRemove, onReorder }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // gripPressed tracks whether the drag started from the grip handle
  const gripPressedRef = useRef(false);

  const handleDragStart = (e: React.DragEvent, tempId: string) => {
    if (!gripPressedRef.current) {
      e.preventDefault();
      return;
    }
    setDraggingId(tempId);
    e.dataTransfer.effectAllowed = 'move';
    // ドラッグ中のゴースト画像を少し透過させる
    e.dataTransfer.setDragImage(e.currentTarget as HTMLElement, 20, 20);
  };

  const handleDragOver = (e: React.DragEvent, tempId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== tempId) setDragOverId(tempId);
  };

  const handleDrop = (e: React.DragEvent, toTempId: string) => {
    e.preventDefault();
    if (draggingId && draggingId !== toTempId) {
      onReorder(draggingId, toTempId);
    }
    setDraggingId(null);
    setDragOverId(null);
    gripPressedRef.current = false;
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
    gripPressedRef.current = false;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-sm">経由地点</h2>
        <span className="text-xs text-gray-400">{waypoints.length}地点</span>
      </div>

      <div className="space-y-1">
        {waypoints.map((wp, i) => (
          <div key={wp.tempId}>
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
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, wp.tempId)}
              onDragOver={(e) => handleDragOver(e, wp.tempId)}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => handleDrop(e, wp.tempId)}
              onDragEnd={handleDragEnd}
              className="rounded-lg"
            >
              <WaypointItem
                waypoint={wp}
                index={i}
                total={waypoints.length}
                isLoaded={isLoaded}
                isDragging={draggingId === wp.tempId}
                isDragOver={dragOverId === wp.tempId && draggingId !== wp.tempId}
                onUpdate={onUpdate}
                onRemove={onRemove}
                onGripPointerDown={() => { gripPressedRef.current = true; }}
              />
            </div>
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
    </div>
  );
}
