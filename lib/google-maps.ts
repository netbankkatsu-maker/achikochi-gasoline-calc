import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import type { WaypointInput } from '@/types';

// Routes API v2 で ETC 料金を推定（サーバーサイド不要、同じ API キーを使用）
export async function estimateRouteToll(waypoints: WaypointInput[]): Promise<number | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  if (!apiKey || waypoints.length < 2) return null;

  const makeLocation = (w: WaypointInput) =>
    w.placeId ? { placeId: w.placeId } : { address: w.place_name };

  try {
    const res = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.travelAdvisory.tollInfo',
        },
        body: JSON.stringify({
          origin: makeLocation(waypoints[0]),
          destination: makeLocation(waypoints[waypoints.length - 1]),
          intermediates: waypoints.slice(1, -1).map(makeLocation),
          travelMode: 'DRIVE',
          extraComputations: ['TOLLS'],
          routeModifiers: {
            vehicleInfo: { emissionType: 'GASOLINE' },
            tollPasses: ['JP_ETC'],
          },
        }),
      }
    );

    if (!res.ok) return null;

    const data: {
      routes?: Array<{
        travelAdvisory?: {
          tollInfo?: {
            estimatedPrice?: Array<{ currencyCode: string; units?: string; nanos?: number }>;
          };
        };
      }>;
    } = await res.json();

    const prices = data?.routes?.[0]?.travelAdvisory?.tollInfo?.estimatedPrice;
    if (!prices?.length) return null;

    const jpy = prices.find((p) => p.currencyCode === 'JPY');
    if (!jpy) return null;

    return Math.round(Number(jpy.units ?? 0) + (jpy.nanos ?? 0) / 1e9);
  } catch {
    return null;
  }
}

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
