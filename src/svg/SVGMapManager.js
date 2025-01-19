import { MAP_BOUNDS } from '../common/constants.js';

export class SVGMapManager {
    constructor() {
        this.svgElement = null;
        this.mapImage = null;
        this.bounds = MAP_BOUNDS;
    }

    async initialize() {
        this.svgElement = document.getElementById('taxi-map');
        this.mapImage = document.querySelector('.map img');

        if (!this.mapImage.complete) {
            await new Promise(resolve => {
                this.mapImage.onload = resolve;
            });
        }

        this.setupSVG();
    }

    setupSVG() {
        const mapWidth = this.mapImage.clientWidth;
        const mapHeight = this.mapImage.clientHeight;

        this.svgElement.setAttribute("viewBox", `0 0 ${mapWidth} ${mapHeight}`);
        this.svgElement.style.width = mapWidth + 'px';
        this.svgElement.style.height = mapHeight + 'px';
        this.svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        this.svgElement.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    }

    getSVGElement() {
        return this.svgElement;
    }

    getDimensions() {
        return {
            width: this.mapImage.clientWidth,
            height: this.mapImage.clientHeight
        };
    }

    getBounds() {
        return this.bounds;
    }

    cleanup() {
        const mapContainer = document.querySelector('.map');
        if (mapContainer) {
            mapContainer.remove();
        }
    }
}