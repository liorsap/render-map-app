export class CoordinateTransformer {
    constructor(dimensions, bounds) {
        this.dimensions = dimensions;
        this.bounds = bounds;

        const boundsCoords = {
            min: this.projectPoint(bounds.minLat, bounds.minLng),
            max: this.projectPoint(bounds.maxLat, bounds.maxLng)
        };

        this.xScale = dimensions.width / (boundsCoords.max.x - boundsCoords.min.x);
        this.yScale = dimensions.height / (boundsCoords.max.y - boundsCoords.min.y);
        
        this.xOffset = -boundsCoords.min.x * this.xScale;
        this.yOffset = -boundsCoords.min.y * this.yScale;
    }

    degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    projectPoint(latitude, longitude) {
        const FE = 180;
        const radius = this.dimensions.width / (2 * Math.PI);
        
        const latRad = this.degreesToRadians(latitude);
        const lonRad = this.degreesToRadians(longitude + FE);
        
        const x = lonRad * radius;
        const yFromEquator = radius * Math.log(Math.tan(Math.PI / 4 + latRad / 2));
        const y = this.dimensions.height / 2 - yFromEquator;

        return { x, y };
    }

    latLngToPoint(latitude, longitude) {
        if (isNaN(latitude) || isNaN(longitude)) {
            console.warn('Invalid coordinates:', { latitude, longitude });
            return null;
        }

        const projected = this.projectPoint(latitude, longitude);

        const x = (projected.x * this.xScale + this.xOffset);
        const y = this.dimensions.height - (projected.y * this.yScale + this.yOffset);

        return { x, y };
    }
} 