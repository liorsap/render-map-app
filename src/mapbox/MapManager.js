import { ROME_CENTER } from "../common/constants.js";
export class MapManager {
    constructor() {
        this.map = null;
    }

    initializeMap() {
        mapboxgl.accessToken = 'pk.eyJ1IjoibGlvcnNhcGlyNTciLCJhIjoiY201ejM3dmk0MDVrMDJsc2hyNjgzeDZvbiJ9.xGzXOJJhj30ZvS0BYnOJlw';
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: ROME_CENTER,
            zoom: 10
        });

        return new Promise((resolve) => {
            this.map.on('load', () => resolve(this.map));
        });
    }

    addRoutes(geoJSON, driverColors) {
        this.map.addSource('taxi-routes', {
            type: 'geojson',
            data: geoJSON
        });

        this.map.addLayer({
            id: 'taxi-routes',
            type: 'line',
            source: 'taxi-routes',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': [
                    'match',
                    ['get', 'driverId'],
                    ...Object.entries(driverColors).flatMap(([id, color]) => [id, color]),
                    '#888888' 
                ],
                'line-width': 3,
                'line-opacity': 0.8
            }
        });

        this.map.on('mouseenter', 'taxi-routes', (e) => {
            this.map.getCanvas().style.cursor = 'pointer';

            const feature = e.features[0];
            const startTime = new Date(feature.properties.startTime).toLocaleString();
            const endTime = new Date(feature.properties.endTime).toLocaleString();

            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                    <strong>Driver: ${feature.properties.driverId}</strong><br>
                    Start: ${startTime}<br>
                    End: ${endTime}
                `)
                .addTo(this.map);
        });

        this.map.on('mouseleave', 'taxi-routes', () => {
            this.map.getCanvas().style.cursor = '';
        });
    }

    getMap() {
        return this.map;
    }
}