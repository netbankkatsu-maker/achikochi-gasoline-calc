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

function getLabel(index: number, total: number) {
  if (index === 0) return '出発地';
  if (index === total - 1) return '目的地';
  return `経由地 ${index}`;
}

export default function WaypointItem({ waypoint, index, total, isLoaded, onUpdate, onRemove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  // Use refs so the event handler always sees the latest values without recreating the element
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const tempIdRef = useRef(waypoint.tempId);
  tempIdRef.current = waypoint.tempId;

  // Create PlaceAutocompleteElement once when the Maps SDK becomes ready
  useEffect(() => {
    if (!isLoaded || !containerRef.current || elementRef.current) return;

    const el = new google.maps.places.PlaceAutocompleteElement({
      includedRegionCodes: ['jp'],
      requestedLanguage: 'ja',
      requestedRegion: 'jp',
    });
    el.setAttribute('placeholder', getLabel(index, total));
    el.style.width = '100%';

    const handleSelect = (event: google.maps.places.PlacePredictionSelectEvent) => {
      const place = event.placePrediction.toPlace();
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
  }, [isLoaded]); // Only (re)create when load state changes; not on every render

  // Update placeholder text when position changes without recreating the element
  useEffect(() => {
    elementRef.current?.setAttribute('placeholder', getLabel(index, total));
  }, [index, total]);

  const canRemove = total > 2;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
        {index + 1}
      </div>
      {/* PlaceAutocompleteElement is appended here as a real DOM node */}
      <div className="flex-1" ref={containerRef} />
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
