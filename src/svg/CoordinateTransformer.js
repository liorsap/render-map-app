 /* export class CoordinateTransformer {
    static latLonToOffsets(latitude, longitude, mapWidth, mapHeight, bounds) {
        const x = mapWidth * (longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng);
        const y = mapHeight * (1 - (latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat));
        return { x, y };
    }
}
 */
export class CoordinateTransformer {
    static latLonToOffsets(latitude, longitude, mapWidth, mapHeight, bounds) {
        if (longitude < bounds.minLng || longitude > bounds.maxLng ||
            latitude < bounds.minLat || latitude > bounds.maxLat) {
            console.warn(`Coordinate out of bounds: (${latitude}, ${longitude})`);
        }
        
        const normalizedX = (longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng);
        const normalizedY = 1 - (latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat);
        
        const x = Math.round(mapWidth * normalizedX);
        const y = Math.round(mapHeight * normalizedY);
        
        return { x, y };
    }
} 