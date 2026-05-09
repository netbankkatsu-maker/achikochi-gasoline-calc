'use client';

import { useEffect, useRef } from 'react';
import type { WaypointInput } from '@/types';

type Props = {
  waypoint: WaypointInput;
  index: number;
  total: number;
  isLoaded: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onUpdate: (tempId: string, updates: Partial<WaypointInput>) => void;
  onRemove: (tempId: string) => void;
  // Pointer events forwarded from WaypointList (pointer capture lives on the grip)
  onGripPointerDown: (e: React.PointerEvent) => void;
  onGripPointerMove: (e: React.PointerEvent) => void;
  onGripPointerUp: (e: React.PointerEvent) => void;
};

function getLabel(index: number, total: number) {
  if (index === 0) return '出発地';
  if (index === total - 1) return '目的地';
  return `経由地 ${index}`;
}

export default function WaypointItem({
  waypoint, index, total, isLoaded,
  isDragging, isDragOver,
  onUpdate, onRemove,
  onGripPointerDown, onGripPointerMove, onGripPointerUp,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const tempIdRef = useRef(waypoint.tempId);
  tempIdRef.current = waypoint.tempId;

  useEffect(() => {
    if (!isLoaded || !containerRef.current || elementRef.current) return;

    const el = new google.maps.places.PlaceAutocompleteElement({
      includedRegionCodes: ['jp'],
      requestedLanguage: 'ja',
      requestedRegion: 'jp',
    });
    el.setAttribute('placeholder', getLabel(index, total));
    el.style.width = '100%';

    const handleSelect: EventListener = (event) => {
      const { placePrediction } = event as google.maps.places.PlacePredictionSelectEvent;
      const place = placePrediction.toPlace();
      void place.fetchFields({ fields: ['formattedAddress', 'displayName'] }).then(() => {
        onUpdateRef.current(tempIdRef.current, {
          place_name: place.formattedAddress ?? place.displayName ?? '',
          placeId: place.id,
        });
      });
    };

    el.addEventListener('gmp-select', handleSelect);
    containerRef.current.appendChild(el);
    elementRef.current = el;

    return () => {
      el.removeEventListener('gmp-select', handleSelect);
      el.remove();
      elementRef.current = null;
    };
  }, [isLoaded]);

  useEffect(() => {
    elementRef.current?.setAttribute('placeholder', getLabel(index, total));
  }, [index, total]);

  const canRemove = total > 2;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg transition-all duration-150 ${
        isDragOver ? 'bg-blue-50 ring-2 ring-blue-400 ring-inset' : ''
      } ${isDragging ? 'opacity-40 scale-95' : ''}`}
    >
      {/* ドラッグハンドル — touch-none で慣性スクロールと競合しない */}
      <div
        onPointerDown={onGripPointerDown}
        onPointerMove={onGripPointerMove}
        onPointerUp={onGripPointerUp}
        onPointerCancel={onGripPointerUp}
        className="flex-shrink-0 w-5 flex justify-center touch-none select-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors py-2"
        aria-label="ドラッグして並び替え"
      >
        <svg viewBox="0 0 10 16" fill="currentColor" className="w-3 h-4">
          <circle cx="2.5" cy="2"  r="1.5" />
          <circle cx="7.5" cy="2"  r="1.5" />
          <circle cx="2.5" cy="6"  r="1.5" />
          <circle cx="7.5" cy="6"  r="1.5" />
          <circle cx="2.5" cy="10" r="1.5" />
          <circle cx="7.5" cy="10" r="1.5" />
          <circle cx="2.5" cy="14" r="1.5" />
          <circle cx="7.5" cy="14" r="1.5" />
        </svg>
      </div>

      {/* 番号バッジ */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
        {index + 1}
      </div>

      {/* PlaceAutocompleteElement はここに DOM ノードとして追加される */}
      <div className="flex-1 min-w-0" ref={containerRef} />

      {/* 削除ボタン */}
      {canRemove ? (
        <button
          onClick={() => onRemove(waypoint.tempId)}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
          aria-label="地点を削除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <div className="w-7" />
      )}
    </div>
  );
}
