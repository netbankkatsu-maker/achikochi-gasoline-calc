'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type Suggestion = {
  mainText: string;
  secondaryText: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoaded: boolean;
};

export default function ICAutocompleteInput({ value, onChange, placeholder, isLoaded }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
  }, []);

  const getSessionToken = useCallback(() => {
    if (!sessionTokenRef.current && isLoaded) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current ?? undefined;
  }, [isLoaded]);

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!isLoaded || input.trim().length < 1) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      try {
        // Use AutocompleteSuggestion (new Places API)
        const { suggestions: results } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: input.trim(),
            sessionToken: getSessionToken(),
            includedRegionCodes: ['jp'],
            language: 'ja',
          });

        const mapped: Suggestion[] = (results ?? []).map((s) => ({
          mainText: s.placePrediction?.mainText?.text ?? '',
          secondaryText: s.placePrediction?.secondaryText?.text ?? '',
        }));

        setSuggestions(mapped);
        setActiveIndex(-1);
        setIsOpen(mapped.length > 0);
      } catch {
        // Fallback: AutocompleteService (legacy but stable)
        try {
          const service = new google.maps.places.AutocompleteService();
          service.getPlacePredictions(
            { input: input.trim(), componentRestrictions: { country: 'jp' }, language: 'ja' },
            (predictions, status) => {
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                predictions &&
                predictions.length > 0
              ) {
                const mapped: Suggestion[] = predictions.map((p) => ({
                  mainText: p.structured_formatting?.main_text ?? p.description,
                  secondaryText: p.structured_formatting?.secondary_text ?? '',
                }));
                setSuggestions(mapped);
                setActiveIndex(-1);
                setIsOpen(true);
              } else {
                setSuggestions([]);
                setIsOpen(false);
              }
            }
          );
        } catch {
          setSuggestions([]);
          setIsOpen(false);
        }
      }
    },
    [isLoaded, getSessionToken]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (s: Suggestion) => {
    onChange(s.mainText);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    resetSession();
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  // Close on outside click
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto text-sm">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur before select
                handleSelect(s);
              }}
              className={`px-3 py-2 cursor-pointer flex flex-col gap-0.5 ${
                i === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-800 leading-tight">{s.mainText}</span>
              {s.secondaryText && (
                <span className="text-xs text-gray-400 leading-tight">{s.secondaryText}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
