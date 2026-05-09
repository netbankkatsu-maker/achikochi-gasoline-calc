import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import type { WaypointInput } from '@/types';

// Cache the in-flight promise so concurrent callers all await the same load
let loadPromise: Promise<void> | null = null;

export async function loadGoogleMaps(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
        v: 'weekly',
        language: 'ja',
        region: 'JP',
      });
      await importLibrary('maps');
      await importLibrary('places');
    })();
  }
  return loadPromise;
}

export async function calculateRoute(
  waypoints: WaypointInput[]
): Promise<{ segmentDistances: number[]; totalKm: number }> {
  if (waypoints.length < 2) {
    throw new Error('2地点以上入力してください');
  }

  await loadGoogleMaps();

  const directionsService = new google.maps.DirectionsService();

  const getLocation = (w: WaypointInput): string | { placeId: string } =>
    w.placeId ? { placeId: w.placeId } : w.place_name;

  const intermediates = waypoints.slice(1, -1).map((w) => ({
    location: getLocation(w) as google.maps.LatLng | string | google.maps.Place,
    stopover: true,
  }));

  const result = await directionsService.route({
    origin: getLocation(waypoints[0]),
    destination: getLocation(waypoints[waypoints.length - 1]),
    waypoints: intermediates,
    optimizeWaypoints: false,
    travelMode: google.maps.TravelMode.DRIVING,
    region: 'jp',
  });

  const legs = result.routes[0].legs;
  const segmentDistances = legs.map((leg) => (leg.distance?.value ?? 0) / 1000);
  const totalKm = segmentDistances.reduce((a, b) => a + b, 0);

  return { segmentDistances, totalKm };
}
