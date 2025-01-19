export class AnimationControlManager {
    constructor(containerId = 'animation-controls') {
        this.containerId = containerId;
        this.container = null;
        this.isAnimating = false;
        this.onStart = null;
        this.onPause = null;
        this.onReset = null;
        this.performanceManager = null; 
    }

    initialize(performanceManager) {
        this.performanceManager = performanceManager;
        let container = document.getElementById(this.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = this.containerId;
            container.className = 'animation-controls';
            document.body.appendChild(container);
        }
        
        this.container = container;
        this.container.innerHTML = `
            <button id="start-animation" class="control-button">
                Start Animation
            </button>
            <button id="reset-animation" class="control-button">
                Reset
            </button>
            <button id="generate-report" class="control-button">
                Generate Performance Report
            </button>
        `;
        
        document.getElementById('start-animation').addEventListener('click', () => {
            this.toggleAnimation();
        });

        document.getElementById('reset-animation').addEventListener('click', () => {
            this.resetAnimation();
        });

        document.getElementById('generate-report').addEventListener('click', () => {
            if (this.performanceManager) {
                this.performanceManager.downloadFullReport();
            }
        });
    }

    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const startButton = document.getElementById('start-animation');
        startButton.textContent = this.isAnimating ? 'Pause Animation' : 'Start Animation';

        if (this.isAnimating && this.onStart) {
            this.onStart();
        } else if (!this.isAnimating && this.onPause) {
            this.onPause();
        }
    }

    resetAnimation() {
        this.isAnimating = false;
        document.getElementById('start-animation').textContent = 'Start Animation';
        if (this.onReset) {
            this.onReset();
        }
    }

    setCallbacks(callbacks) {
        const { onStart, onPause, onReset } = callbacks;
        this.onStart = onStart;
        this.onPause = onPause;
        this.onReset = onReset;
    }

    cleanup() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}