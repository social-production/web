const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function radiusBounds(
  latitude: number,
  longitude: number,
  radiusKm: number
): [[number, number], [number, number]] {
  const latDelta = radiusKm / 111;
  const cosLat = Math.max(Math.cos((latitude * Math.PI) / 180), 0.01);
  const lonDelta = radiusKm / (111 * cosLat);
  return [
    [longitude - lonDelta, latitude - latDelta],
    [longitude + lonDelta, latitude + latDelta]
  ];
}

export function circlePolygon(
  latitude: number,
  longitude: number,
  radiusKm: number,
  points = 64
): { type: 'Polygon'; coordinates: [number, number][][] } {
  const coordinates: [number, number][] = [];
  const latRad = (latitude * Math.PI) / 180;
  const lonRad = (longitude * Math.PI) / 180;
  const angularDistance = radiusKm / EARTH_RADIUS_KM;

  for (let index = 0; index <= points; index += 1) {
    const bearing = (2 * Math.PI * index) / points;
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance) +
        Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const lon2 =
      lonRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
        Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(lat2)
      );
    coordinates.push([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }

  return {
    type: 'Polygon',
    coordinates: [coordinates]
  };
}

export function viewportRadiusKm(
  latitude: number,
  longitude: number,
  northEast: { latitude: number; longitude: number },
  southWest: { latitude: number; longitude: number }
): number {
  const north = haversineKm(latitude, longitude, northEast.latitude, longitude);
  const east = haversineKm(latitude, longitude, latitude, northEast.longitude);
  const south = haversineKm(latitude, longitude, southWest.latitude, longitude);
  const west = haversineKm(latitude, longitude, latitude, southWest.longitude);
  return Math.max(1, Math.round(Math.max(north, east, south, west)));
}
