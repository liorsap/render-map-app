import { CoordinateTransformer } from './CoordinateTransformer.js';
import { PerformanceManager } from '../performance/PerformanceManager.js';
export class SVGAnimationManager {
    constructor() {
        this.svgElement = null;
        this.taxiIcons = {};
        this.animationProgress = {};
        this.animationFrameId = null;
        this.isAnimating = false;
        this.groupedPaths = null;
        this.dimensions = null;
        this.bounds = null;
        this.performanceManager = null;
    }

    initialize(svgElement, dimensions, bounds, performanceManager) {
        this.svgElement = svgElement;
        this.dimensions = dimensions;
        this.bounds = bounds;
        this.performanceManager = performanceManager;
    }

    animateDrivers(paths) {
        this.groupedPaths = {};
        
        paths.forEach(({ driver, pathElement }) => {
            this.groupedPaths[driver.DriveNo] = driver.Path;
            this.createTaxiIcon(driver.DriveNo, driver.Path[0]);
            this.animationProgress[driver.DriveNo] = 0;
        });
    }

    createTaxiIcon(driverId, startPoint) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        
        const taxi = document.createElementNS("http://www.w3.org/2000/svg", "image");
        taxi.setAttributeNS("http://www.w3.org/1999/xlink", "href", "../assets/taxi-marker.svg");
        taxi.setAttribute("width", "20");
        taxi.setAttribute("height", "20");
        taxi.setAttribute("x", "-10");
        taxi.setAttribute("y", "-10");

        g.appendChild(taxi);
        this.svgElement.appendChild(g);
        
        this.taxiIcons[driverId] = g;
        this.updateTaxiPosition(driverId, startPoint);
    }

    updateTaxiPosition(driverId, point) {
        const g = this.taxiIcons[driverId];
        const { x, y } = CoordinateTransformer.latLonToOffsets(
            point.Latitude,
            point.Longitude,
            this.dimensions.width,
            this.dimensions.height,
            this.bounds
        );
        g.setAttribute("transform", `translate(${x}, ${y})`);
    }

    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate = this.animate.bind(this);
            this.animate();
        }
    }

    pauseAnimation() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    resetAnimation() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        Object.entries(this.groupedPaths).forEach(([driverId, points]) => {
            this.updateTaxiPosition(driverId, points[0]);
            this.animationProgress[driverId] = 0;
        });
    }

    animate() {
        if (!this.isAnimating) return;
    
        const endFrame = this.performanceManager.startFrameMeasure();
        
        Object.entries(this.groupedPaths).forEach(([driverId, points]) => {
            const progress = this.animationProgress[driverId];
            const pointIndex = Math.floor(progress * (points.length - 1));
            const nextIndex = Math.min(pointIndex + 1, points.length - 1);
    
            const currentPoint = points[pointIndex];
            const nextPoint = points[nextIndex];
            const fraction = progress * (points.length - 1) - pointIndex;
    
            this.performanceManager.measureUpdate('path', () => {
                const interpolatedPoint = {
                    Latitude: currentPoint.Latitude + (nextPoint.Latitude - currentPoint.Latitude) * fraction,
                    Longitude: currentPoint.Longitude + (nextPoint.Longitude - currentPoint.Longitude) * fraction
                };
                this.updateTaxiPosition(driverId, interpolatedPoint);
            });
            
            this.animationProgress[driverId] = (progress + 0.0005) % 1;
        });
    
        endFrame();
    
        if (this.performanceManager.animationMetrics.frameCount % 60 === 0) {
            this.performanceManager.logReport();
        }
    
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    cleanup() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        Object.values(this.taxiIcons).forEach(icon => icon.remove());
        this.taxiIcons = {};
        this.animationProgress = {};
        this.groupedPaths = null;
    }
} 