export class TaxiManager {
    constructor() {
        this.taxiData = null;
        this.groupedPaths = null;
        this.geoJSON = null;
        this.driverColors = null;
    }

    async loadData() {
        try {
            const response = await fetch('./assets/taxiData.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.taxiData = await response.json();
            this.groupedPaths = this.organizePathsByDriver(this.taxiData);
            this.geoJSON = this.createGeoJSON(this.groupedPaths);
            this.driverColors = this.generateDriverColors(this.groupedPaths);
            return true;
        } catch (error) {
            console.error('Error loading taxi data:', error);
            return false;
        }
    }

    organizePathsByDriver(taxiDataPaths) {
        const groupedByDriver = {};

        taxiDataPaths.forEach(point => {
            if (!groupedByDriver[point.DriveNo]) {
                groupedByDriver[point.DriveNo] = [];
            }

            // The provided json swapped the lat/lon coordinates so fixed it here
            groupedByDriver[point.DriveNo].push({
                Date: new Date(point.Date).getTime(),
                DriveNo: point.DriveNo,
                Longitude: point.Latitude,
                Latitude: point.Longitude,
            });
        });

        Object.keys(groupedByDriver).forEach(driverId => {
            groupedByDriver[driverId].sort((a, b) => a.Date - b.Date);
        });

        return groupedByDriver;
    }

    createGeoJSON(groupedPaths) {
        return {
            type: 'FeatureCollection',
            features: Object.entries(groupedPaths).map(([driverId, points]) => ({
                type: 'Feature',
                properties: {
                    driverId: driverId,
                    startTime: points[0].Date,
                    endTime: points[points.length - 1].Date
                },
                geometry: {
                    type: 'LineString',
                    coordinates: points.map(point => [point.Longitude, point.Latitude])
                }
            }))
        };
    }

    generateDriverColors(groupedPaths) {
        const colors = {};
        const baseHue = 360 / Object.keys(groupedPaths).length;

        Object.keys(groupedPaths).forEach((driverId, index) => {
            const hue = baseHue * index;
            colors[driverId] = `hsl(${hue}, 70%, 50%)`;
        });

        return colors;
    }

    getGroupedPaths() {
        return this.groupedPaths;
    }

    getGeoJSON() {
        return this.geoJSON;
    }

    getDriverColors() {
        return this.driverColors;
    }
}