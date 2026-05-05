'use client';

import { useEffect, useRef } from 'react';
import type { WaypointInput } from '@/types';

type Props = {
  waypoint: WaypointInput;
  index: number;
  total: number;
  isLoaded: boolean;
  onUpdate: (tempId: string, updates: Partial<WaypointInput>) => void;
  onRemove: (tempId: string) => void;
};

const labels = ['出発地', '目的地'];
function getLabel(index: number, total: number) {
  if (index === 0) return '出発地';
  if (index === total - 1) return '目的地';
  return `経由地 ${index}`;
}

export default function WaypointItem({ waypoint, index, total, isLoaded, onUpdate, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'jp' },
      fields: ['place_id', 'name', 'formatted_address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      onUpdate(waypoint.tempId, {
        place_name: place.formatted_address ?? place.name ?? '',
        placeId: place.place_id,
      });
    });

    autocompleteRef.current = autocomplete;
  }, [isLoaded, waypoint.tempId, onUpdate]);

  const canRemove = total > 2;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
        {index + 1}
      </div>
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          defaultValue={waypoint.place_name}
          placeholder={getLabel(index, total)}
          onChange={(e) => onUpdate(waypoint.tempId, { place_name: e.target.value, placeId: undefined })}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>
      {canRemove && (
        <button
          onClick={() => onRemove(waypoint.tempId)}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
          aria-label="地点を削除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {!canRemove && <div className="w-7" />}
    </div>
  );
}
