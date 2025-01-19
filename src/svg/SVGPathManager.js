import { CoordinateTransformer } from './CoordinateTransformer.js';

export class SVGPathManager {
    constructor() {
        this.svgElement = null;
    }

    initialize(svgElement) {
        this.svgElement = svgElement;
    }

    createPaths(taxiData, dimensions, bounds, colors) {
        const paths = [];
        
        taxiData.forEach(driver => {
            const pathElement = this.createPathElement(
                driver,
                dimensions,
                bounds,
                colors[driver.DriveNo]
            );
            paths.push({ driver, pathElement });
            this.svgElement.appendChild(pathElement);
        });

        return paths;
    }

    createPathElement(driver, dimensions, bounds, color) {
        let pathString = "";
        const points = driver.Path;
        
        points.forEach((point, index) => {
            const { x, y } = CoordinateTransformer.latLonToOffsets(
                point.Latitude,
                point.Longitude,
                dimensions.width,
                dimensions.height,
                bounds
            );
            
            pathString += index === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
        });

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathString);
        path.setAttribute("stroke", color || '#888888');
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
        path.setAttribute("id", `path-${driver.DriveNo}`);

        return path;
    }

    cleanup() {
        const paths = this.svgElement.querySelectorAll('path');
        paths.forEach(path => path.remove());
    }
}