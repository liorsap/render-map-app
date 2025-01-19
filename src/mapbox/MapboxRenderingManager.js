import { MapManager } from './MapManager.js';
import { MarkerManager } from './MarkerManager.js';
import {LegendManager} from '../common/LegendManager.js'
import { AnimationControlManager } from '../common/AnimationControlManager.js';
import { PerformanceManager } from '../performance/PerformanceManager.js';

export class MapboxRenderingManager {
    constructor(taxiManager) {
        this.mapManager = new MapManager();
        this.markerManager = null; 
        this.taxiManager = taxiManager;
        this.legendManager = new LegendManager();
        this.performanceManager = new PerformanceManager("mapbox");
        this.animationControlManager = new AnimationControlManager();
    }

    async initialize() {
        const endInit = this.performanceManager.startMeasure('initialization');        
        try {
            const map = await this.mapManager.initializeMap();
            this.legendManager.initialize();
            this.markerManager = new MarkerManager(map, this.performanceManager);
            this.animationControlManager.initialize(this.performanceManager);
            
            this.animationControlManager.setCallbacks({
                onStart: () => this.markerManager.startAnimation(),
                onPause: () => this.markerManager.pauseAnimation(),
                onReset: () => this.markerManager.resetAnimation()
            });
            
            this.render(); 
            endInit();
        } catch (error) {
            console.error('Error initializing MapboxRenderer:', error);
        }
    }

    render() {
        const endRender = this.performanceManager.startMeasure('render');
        const groupedPaths = this.taxiManager.getGroupedPaths();
        const geoJSON = this.taxiManager.getGeoJSON();
        const driverColors = this.taxiManager.getDriverColors();

        this.legendManager.updateLegend(driverColors);

        this.mapManager.addRoutes(geoJSON, driverColors);
        this.markerManager.createMarkers(groupedPaths);

        endRender();
        this.performanceManager.logReport();
    }

    cleanup() {
        if (this.markerManager) {
            this.markerManager.removeAllMarkers();
        }
        if (this.mapManager && this.mapManager.getMap()) {
            const map = this.mapManager.getMap();
            if (map.getLayer('taxi-routes')) {
                map.removeLayer('taxi-routes');
            }
            if (map.getSource('taxi-routes')) {
                map.removeSource('taxi-routes');
            }
            this.legendManager.cleanup();

            this.animationControlManager.cleanup();
        }
    }
}