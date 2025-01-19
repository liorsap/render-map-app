export class PerformanceManager {
    constructor(rendererType) {
        this.rendererType = rendererType;
        this.measurements = {};
        this.animationMetrics = {
            frameCount: 0,
            totalFrameTime: 0,
            maxFrameTime: 0,
            minFrameTime: Infinity,
            fpsReadings: [],
            lastTimestamp: null,
            updateTimes: {
                marker: [],
                path: []
            },
            memoryReadings: []
        };
        this.metricsHistory = [];

        this.cpuMetrics = {
            measurements: [],
            lastMeasurement: null,
            frameMonitoringId: null,
            lastSampleTime: performance.now(),
            totalTaskDuration: 0
        };
        this.startCPUMonitoring();
    }

    startMeasure(operationName) {
        if (!this.measurements[operationName]) {
            this.measurements[operationName] = {};
        }
        this.measurements[operationName].start = performance.now();
        return () => this.endMeasure(operationName);
    }

    endMeasure(operationName) {
        if (this.measurements[operationName]?.start) {
            const end = performance.now();
            const duration = end - this.measurements[operationName].start;
            this.measurements[operationName].duration = duration;
            console.log(`${operationName}: ${duration.toFixed(2)}ms`);
            return duration;
        }
        return null;
    }

    measureUpdate(type, callback) {
        const start = performance.now();
        callback();
        const duration = performance.now() - start;

        // Store the update time
        this.animationMetrics.updateTimes[type].push({
            timestamp: start,
            duration: duration
        });

        // Keep only last 100 readings
        if (this.animationMetrics.updateTimes[type].length > 100) {
            this.animationMetrics.updateTimes[type].shift();
        }

        return duration;
    }

    startFrameMeasure() {
        const frameStart = performance.now();

        this.captureMemorySnapshot(frameStart);

        return () => this.recordFrameMetrics(frameStart);
    }

    captureMemorySnapshot(timestamp) {
        if (window.performance?.memory) {
            this.animationMetrics.memoryReadings.push({
                timestamp,
                usedHeapSize: window.performance.memory.usedJSHeapSize,
                totalHeapSize: window.performance.memory.totalJSHeapSize
            });

            // Keep only last 300 readings (about 5 seconds at 60fps)
            if (this.animationMetrics.memoryReadings.length > 300) {
                this.animationMetrics.memoryReadings.shift();
            }
        }
    }

    recordFrameMetrics(frameStart) {
        const frameDuration = performance.now() - frameStart;

        this.animationMetrics.frameCount++;
        this.animationMetrics.totalFrameTime += frameDuration;
        this.animationMetrics.maxFrameTime = Math.max(this.animationMetrics.maxFrameTime, frameDuration);
        this.animationMetrics.minFrameTime = Math.min(this.animationMetrics.minFrameTime, frameDuration);

        // Calculate FPS
        if (this.animationMetrics.lastTimestamp) {
            const timeElapsed = frameStart - this.animationMetrics.lastTimestamp;
            const fps = 1000 / timeElapsed;

            this.animationMetrics.fpsReadings.push({
                timestamp: frameStart,
                fps: fps,
                frameDuration: frameDuration
            });

            // Keep only last second of readings
            const oneSecondAgo = frameStart - 1000;
            this.animationMetrics.fpsReadings = this.animationMetrics.fpsReadings.filter(
                reading => reading.timestamp > oneSecondAgo
            );
        }

        this.animationMetrics.lastTimestamp = frameStart;
        return frameDuration;
    }

    getUpdateStats() {
        const calculateStats = (updates) => {
            if (updates.length === 0) return null;

            const durations = updates.map(u => u.duration);
            return {
                average: durations.reduce((a, b) => a + b, 0) / durations.length,
                min: Math.min(...durations),
                max: Math.max(...durations),
                last100Average: durations.slice(-100).reduce((a, b) => a + b, 0) / Math.min(100, durations.length)
            };
        };

        return {
            marker: calculateStats(this.animationMetrics.updateTimes.marker),
            path: calculateStats(this.animationMetrics.updateTimes.path)
        };
    }

    getMemoryStats() {
        if (!this.animationMetrics.memoryReadings.length) return null;

        const readings = this.animationMetrics.memoryReadings;
        const getStats = (metric) => {
            const values = readings.map(r => r[metric]);
            return {
                current: values[values.length - 1] / 1048576, // Convert to MB
                min: Math.min(...values) / 1048576,
                max: Math.max(...values) / 1048576,
                average: values.reduce((a, b) => a + b, 0) / values.length / 1048576
            };
        };

        return {
            usedHeap: getStats('usedHeapSize'),
            totalHeap: getStats('totalHeapSize'),
            growth: (readings[readings.length - 1].usedHeapSize - readings[0].usedHeapSize) / 1048576 // MB growth
        };
    }

    async startCPUMonitoring() {
        if (!performance.now) {
            console.warn('Performance API not supported');
            return;
        }

        try {
            if (window.PerformanceObserver) {
                const observer = new PerformanceObserver((list) => {
                    const now = performance.now();
                    const entries = list.getEntries();

                    // Calculate time window and task durations
                    const timeWindow = now - this.cpuMetrics.lastSampleTime;
                    this.cpuMetrics.totalTaskDuration += entries.reduce((sum, entry) => sum + entry.duration, 0);

                    if (timeWindow >= 1000) { // Sample every second
                        // Calculate CPU usage as percentage of time spent in tasks
                        const cpuUsage = Math.min((this.cpuMetrics.totalTaskDuration / timeWindow) * 100, 100);

                        this.cpuMetrics.measurements.push({
                            timestamp: now,
                            usage: cpuUsage,
                            taskDuration: this.cpuMetrics.totalTaskDuration,
                            timeWindow,
                            source: 'longtask'
                        });

                        // Reset for next window
                        this.cpuMetrics.lastSampleTime = now;
                        this.cpuMetrics.totalTaskDuration = 0;
                    }

                    const fiveSecondsAgo = now - 5000;
                    this.cpuMetrics.measurements = this.cpuMetrics.measurements.filter(
                        m => m.timestamp > fiveSecondsAgo
                    );
                });

                observer.observe({ entryTypes: ['longtask', 'resource', 'measure'] });

                // Start supplementary frame-based monitoring
                this.startPeriodicSampling();
                console.log('Using combined CPU monitoring (PerformanceObserver + frame timing)');
            } else {
                console.log('Falling back to frame-based CPU monitoring');
                this.startFrameBasedMonitoring();
            }
        } catch (error) {
            console.error('Error starting CPU monitoring:', error);
            this.startFrameBasedMonitoring();
        }
    }

    startPeriodicSampling() {
        let lastFrameTime = performance.now();
        let frameCount = 0;

        const sample = () => {
            const now = performance.now();
            const elapsed = now - lastFrameTime;
            frameCount++;

            // Take a sample every second
            if (elapsed >= 1000) {
                const fps = (frameCount * 1000) / elapsed;
                const cpuLoad = Math.min(100 * (1 - fps / 60), 100);

                // Add frame-based measurement if no recent longtask measurement exists
                const recentMeasurement = this.cpuMetrics.measurements.find(
                    m => now - m.timestamp < 1000 && m.source === 'longtask'
                );

                if (!recentMeasurement) {
                    this.cpuMetrics.measurements.push({
                        timestamp: now,
                        usage: Math.max(cpuLoad, 0),
                        frameCount,
                        fps,
                        source: 'frame-timing'
                    });
                }

                frameCount = 0;
                lastFrameTime = now;
            }

            this.cpuMetrics.frameMonitoringId = requestAnimationFrame(sample);
        };

        this.cpuMetrics.frameMonitoringId = requestAnimationFrame(sample);
    }

    startFrameBasedMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        let totalFrameTime = 0;

        const measure = () => {
            const currentTime = performance.now();
            const frameDuration = currentTime - lastTime;
            lastTime = currentTime;

            frameCount++;
            totalFrameTime += frameDuration;

            // Calculate metrics every second
            if (totalFrameTime >= 1000) {
                const averageFrameTime = totalFrameTime / frameCount;
                const targetFrameTime = 1000 / 60; // 60 FPS target
                const estimatedLoad = (averageFrameTime / targetFrameTime) * 100;

                this.cpuMetrics.measurements.push({
                    timestamp: currentTime,
                    usage: Math.min(estimatedLoad, 100),
                    frameCount,
                    averageFrameTime
                });

                // Reset counters
                frameCount = 0;
                totalFrameTime = 0;

                if (this.cpuMetrics.measurements.length > 300) {
                    this.cpuMetrics.measurements.shift();
                }
            }

            requestAnimationFrame(measure);
        };

        requestAnimationFrame(measure);
    }

    getCPUStats() {
        if (!this.cpuMetrics.measurements || this.cpuMetrics.measurements.length === 0) {
            return {
                current: 0,
                average: 0,
                min: 0,
                max: 0,
                measurements: [],
                samplesCount: 0
            };
        }

        const now = performance.now();
        const recentMeasurements = this.cpuMetrics.measurements.filter(
            m => now - m.timestamp < 5000
        );

        const usages = recentMeasurements
            .map(m => m.usage)
            .filter(u => !isNaN(u) && isFinite(u));

        if (usages.length === 0) {
            return {
                current: 0,
                average: 0,
                min: 0,
                max: 0,
                measurements: [],
                samplesCount: 0
            };
        }

        // Calculate weighted average based on measurement source
        const weightedUsages = recentMeasurements.map(m => ({
            usage: m.usage,
            weight: m.source === 'longtask' ? 0.7 : 0.3
        }));

        const weightedAverage = weightedUsages.reduce((acc, curr) =>
            acc + (curr.usage * curr.weight), 0) /
            weightedUsages.reduce((acc, curr) => acc + curr.weight, 0);

        return {
            current: usages[usages.length - 1],
            average: weightedAverage,
            min: Math.min(...usages),
            max: Math.max(...usages),
            measurements: recentMeasurements,
            samplesCount: usages.length,
            sourcesBreakdown: {
                longtask: recentMeasurements.filter(m => m.source === 'longtask').length,
                frameTiming: recentMeasurements.filter(m => m.source === 'frame-timing').length
            }
        };
    }

    getReport() {
        return {
            rendererType: this.rendererType,
            timing: { ...this.measurements },
            animation: {
                frameStats: {
                    total: this.animationMetrics.frameCount,
                    averageTime: this.animationMetrics.totalFrameTime / Math.max(1, this.animationMetrics.frameCount),
                    minTime: this.animationMetrics.minFrameTime,
                    maxTime: this.animationMetrics.maxFrameTime
                },
                fps: this.getCurrentFPS(),
                updates: this.getUpdateStats(),
                memory: this.getMemoryStats(),
                cpu: this.getCPUStats()
            },
            dom: this.getDOMMetrics()
        };
    }

    getCurrentFPS() {
        const recentReadings = this.animationMetrics.fpsReadings;
        return recentReadings.length > 0
            ? recentReadings.reduce((sum, r) => sum + r.fps, 0) / recentReadings.length
            : 0;
    }

    getDOMMetrics() {
        return {
            svgElements: this.rendererType === 'svg'
                ? document.querySelectorAll('path, g, image').length
                : 0,
            mapboxElements: this.rendererType === 'mapbox'
                ? document.querySelectorAll('.mapboxgl-marker').length
                : 0,
            totalElements: document.querySelectorAll('*').length
        };
    }

    logReport() {
        console.group(`Performance Report - ${this.rendererType}`);
        console.table(this.getReport());
        console.groupEnd();

        this.metricsHistory.push({
            timestamp: Date.now(),
            ...this.getReport()
        });
    }

    downloadFullReport() {
        const filename = `${this.rendererType}-performance-${new Date().toISOString()}.json`;
        const finalReport = {
            renderer: this.rendererType,
            startTime: this.metricsHistory[0]?.timestamp,
            endTime: Date.now(),
            metrics: this.metricsHistory,
            summary: {
                totalFrames: this.animationMetrics.frameCount,
                averageFPS: this.getCurrentFPS(),
                memoryGrowth: this.getMemoryStats()?.growth || 0,
                updateStats: this.getUpdateStats()
            }
        };

        const data = JSON.stringify(finalReport, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    cleanup() {
        if (this.cpuMetrics.frameMonitoringId) {
            cancelAnimationFrame(this.cpuMetrics.frameMonitoringId);
            this.cpuMetrics.frameMonitoringId = null;
        }
    }
}