export class LegendManager {
    constructor(containerId = "legend-container") {
        this.containerId = containerId;
        this.content = null;
    }

    initialize() {
        let container = document.getElementById(this.containerId);
        this.content = container.querySelector('.legend-content');
    }

    updateLegend(driverColors) {
        if (!this.content) return;

        Object.entries(driverColors).forEach(([driverId, color]) => {
            const item = document.createElement('div');
            item.className = 'legend-item';

            const colorBox = document.createElement('span');
            colorBox.className = 'legend-color-box';
            colorBox.style.backgroundColor = color;

            const label = document.createElement('span');
            label.className = 'legend-label';
            label.textContent = `Driver ${driverId}`;

            item.appendChild(colorBox);
            item.appendChild(label);
            this.content.appendChild(item);
        });
    }

    cleanup() {
        if (this.content) {
            this.content.innerHTML = '';
        }
    }
}