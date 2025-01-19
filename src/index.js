import { TaxiManager } from './common/TaxiManager.js';
import { SVGRenderingManager } from './svg/SVGRenderingManager.js';
import { MapboxRenderingManager } from './mapbox/MapboxRenderingManager.js';

class App {
    constructor() {
        this.taxiManager = new TaxiManager();
        this.currentRenderer = null;
        this.initialize();
    }

    async initialize() {
        try {
            const dataLoaded = await this.taxiManager.loadData();
            if (!dataLoaded) {
                throw new Error('Failed to load taxi data');
            }
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('svg-choice').addEventListener('click', () => this.initializeRenderer('svg'));
        document.getElementById('mapbox-choice').addEventListener('click', () => this.initializeRenderer('mapbox'));
    }

    hideAllContainers() {
        document.querySelectorAll('.renderer-container').forEach(container => {
            container.style.display = 'none';
        });
    }

    async initializeRenderer(type) {
        if (this.currentRenderer) {
            this.currentRenderer.cleanup();
        }

        document.querySelector('.renderer-choice').style.display = 'none';
        this.hideAllContainers();

        const containerId = type === 'svg' ? 'svg-container' : 'mapbox-container';
        document.getElementById(containerId).style.display = 'block';
        document.getElementById("legend-container").style.display = 'block'

        try {
            if (type === 'svg') {
                this.currentRenderer = new SVGRenderingManager(this.taxiManager);
            } else {
                this.currentRenderer = new MapboxRenderingManager(this.taxiManager);
            }

            await this.currentRenderer.initialize();
        } catch (error) {
            console.error('Failed to initialize renderer:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});