import {SVGMapManager} from './SVGMapManager.js';
import { CoordinateTransformer } from './CoordinateTransformer.js';
import {SVGPathManager} from './SVGPathManager.js';
import {SVGAnimationManager} from './SVGAnimationManager.js';
import {LegendManager} from '../common/LegendManager.js'
import { AnimationControlManager } from '../common/AnimationControlManager.js';
import { PerformanceManager } from '../performance/PerformanceManager.js';

export class SVGRenderingManager {
    constructor(taxiManager) {
        this.performanceManager = new PerformanceManager("svg");
        this.taxiManager = taxiManager;
        this.mapManager = new SVGMapManager();
        this.pathManager = new SVGPathManager();
        this.animationManager = new SVGAnimationManager(this.performanceManager);
        this.legendManager = new LegendManager();
        this.animationControlManager = new AnimationControlManager();
        this.CoordinateTransformer = null;
    }

    async initialize() {
        const endInit = this.performanceManager.startMeasure('initialization');       
        await this.mapManager.initialize();
        const dimensions = this.mapManager.getDimensions();
        const bounds = this.mapManager.getBounds();
        const svgElement = this.mapManager.getSVGElement();
        this.coordinateTransformer = new CoordinateTransformer(dimensions, bounds); 
        this.pathManager.initialize(svgElement, this.coordinateTransformer);
        this.animationManager.initialize(
            svgElement,
            this.coordinateTransformer,
            this.performanceManager
        );
        this.legendManager.initialize();
        this.animationControlManager.initialize(this.performanceManager);

        this.animationControlManager.setCallbacks({
            onStart: () => this.animationManager.startAnimation(),
            onPause: () => this.animationManager.pauseAnimation(),
            onReset: () => this.animationManager.resetAnimation()
        });
        this.render();
        endInit();
    }

    render() {
        const endRender = this.performanceManager.startMeasure('render');
        
        const groupedPaths = this.taxiManager.getGroupedPaths();
        const driverColors = this.taxiManager.getDriverColors();
        const pathData = Object.entries(groupedPaths).map(([DriveNo, Path]) => ({
            DriveNo: Number(DriveNo),
            Path: Path.map(point => ({
                Latitude: point.Latitude,
                Longitude: point.Longitude,
                Date: point.Date
            }))
        }));

        const paths = this.pathManager.createPaths(pathData, driverColors);
        this.legendManager.updateLegend(driverColors);
        this.animationManager.animateDrivers(paths);

        endRender();
        this.performanceManager.logReport();
    }

    cleanup() {
        this.mapManager.cleanup();
        this.pathManager.cleanup();
        this.legendManager.cleanup();
        this.animationManager.cleanup();
        this.animationControlManager.cleanup();
    }
}