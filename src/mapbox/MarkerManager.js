export class MarkerManager {
    constructor(map, performanceManager) {
        this.map = map;
        this.markers = {};
        this.animationProgress = {};
        this.animationFrameId = null;
        this.isAnimating = false;
        this.groupedPaths = null;
        this.performanceManager = performanceManager;
    }

    createMarkers(groupedPaths) {
        const endMarkerCreation = this.performanceManager.startMeasure('marker-creation');
        this.groupedPaths = groupedPaths;
        
        Object.entries(groupedPaths).forEach(([driverId, points]) => {
            const el = document.createElement('div');
            el.className = 'taxi-marker';
            this.markers[driverId] = new mapboxgl.Marker(el)
                .setLngLat([points[0].Longitude, points[0].Latitude])
                .addTo(this.map);

            this.animationProgress[driverId] = 0;
        });

        endMarkerCreation();
    }

    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    pauseAnimation() {
        if (this.isAnimating) {
            this.isAnimating = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
        }
    }

    resetAnimation() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // Reset markers to starting positions
        Object.entries(this.groupedPaths).forEach(([driverId, points]) => {
            this.markers[driverId].setLngLat([points[0].Longitude, points[0].Latitude]);
            this.animationProgress[driverId] = 0;
        });
    }

    animate() {
        if (!this.isAnimating) return;
    
        const endFrame = this.performanceManager.startFrameMeasure();
    
        Object.entries(this.groupedPaths).forEach(([driverId, points]) => {
            const marker = this.markers[driverId];
            const progress = this.animationProgress[driverId];
    
            const pointIndex = Math.floor(progress * (points.length - 1));
            const nextIndex = Math.min(pointIndex + 1, points.length - 1);
    
            const currentPoint = points[pointIndex];
            const nextPoint = points[nextIndex];
            const fraction = progress * (points.length - 1) - pointIndex;
    
            this.performanceManager.measureUpdate('marker', () => {
                const lat = currentPoint.Latitude + (nextPoint.Latitude - currentPoint.Latitude) * fraction;
                const lng = currentPoint.Longitude + (nextPoint.Longitude - currentPoint.Longitude) * fraction;
                marker.setLngLat([lng, lat]);
            });
    
            this.animationProgress[driverId] = (progress + 0.0005) % 1;
        });
    
        endFrame();
    
        // Log detailed report every 60 frames
        if (this.performanceManager.animationMetrics.frameCount % 60 === 0) {
            this.performanceManager.logReport();
        }
    
        if (this.isAnimating) {
            this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        }
    }

    removeAllMarkers() {
        Object.values(this.markers).forEach(marker => marker.remove());
        this.markers = {};
        this.animationProgress = {};
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.isAnimating = false;
    }
}