export class SVGPathManager {
    constructor() {
        this.coordinateTransformer = null;
        this.svgElement = null;
    }

    initialize(svgElement, coordinateTransformer) {
        this.svgElement = svgElement;
        this.coordinateTransformer = coordinateTransformer;
    }

    createPaths(taxiData, colors) {
        const paths = [];
        
        taxiData.forEach(driver => {
            const pathElement = this.createPathElement(
                driver,
                colors[driver.DriveNo]
            );
            paths.push({ driver, pathElement });
            this.svgElement.appendChild(pathElement);
        });

        return paths;
    }

    createPathElement(driver, color) {
        let pathString = "";
        const points = driver.Path;
        
        points.forEach((point, index) => {
            const { x, y } = this.coordinateTransformer.latLngToPoint(
                point.Latitude,
                point.Longitude
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