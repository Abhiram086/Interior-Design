/* global AFRAME, THREE */

/**
 * Object Selection & Menu Component
 * Applied to the scene to listen for object selection events
 * Updates the floating UI panel state and applies outline to selected object.
 */
AFRAME.registerComponent('object-menu', {
    init: function () {
        this.selectedEl = null;
        this.boxHelper = null;

        // UI Buttons
        this.btnRotate = document.getElementById('btn-rotate');
        this.btnDelete = document.getElementById('btn-delete');

        // Bind events
        this.onObjectSelected = this.onObjectSelected.bind(this);
        this.onRotateClick = this.onRotateClick.bind(this);
        this.onDeleteClick = this.onDeleteClick.bind(this);
        this.onSceneClick = this.onSceneClick.bind(this);

        // Listen for events globally
        this.el.addEventListener('object-selected', this.onObjectSelected);
        this.el.addEventListener('mousedown', this.onSceneClick);

        if (this.btnRotate) this.btnRotate.addEventListener('click', this.onRotateClick);
        if (this.btnDelete) this.btnDelete.addEventListener('click', this.onDeleteClick);

        this.updateButtons(false);
    },

    onObjectSelected: function (evt) {
        if (this.selectedEl === evt.detail.el) return;

        this.clearSelection();

        this.selectedEl = evt.detail.el;
        if (!this.selectedEl) return;

        // Apply visual outline using Three.js BoxHelper
        const mesh = this.selectedEl.getObject3D('mesh');
        if (mesh) {
            this.boxHelper = new THREE.BoxHelper(mesh, 0xffff00); // Yellow outline
            this.el.sceneEl.object3D.add(this.boxHelper);
        }

        // Enable buttons
        this.updateButtons(true);
    },

    clearSelection: function () {
        this.selectedEl = null;

        // Remove outline
        if (this.boxHelper) {
            this.el.sceneEl.object3D.remove(this.boxHelper);
            this.boxHelper.dispose();
            this.boxHelper = null;
        }

        // Disable buttons
        this.updateButtons(false);
    },

    onSceneClick: function (evt) {
        // If we click on the floor or sky, clear selection
        const intersected = evt.detail.intersectedEl;
        if (intersected && (intersected.classList.contains('floor') || intersected.tagName.toLowerCase() === 'a-sky')) {
            this.clearSelection();
        }
    },

    updateButtons: function (enabled) {
        if (this.btnRotate) this.btnRotate.disabled = !enabled;
        if (this.btnDelete) this.btnDelete.disabled = !enabled;
    },

    onRotateClick: function () {
        if (this.selectedEl && this.selectedEl.components['rotate-object']) {
            this.selectedEl.components['rotate-object'].rotateNow();
        }
    },

    onDeleteClick: function () {
        if (this.selectedEl) {
            const el = this.selectedEl;
            this.clearSelection(); // Clear before removal
            el.parentNode.removeChild(el);
            this.el.emit('layout-changed'); // Update saved layout
        }
    },

    tick: function () {
        // Update box helper to follow the object if it moves/rotates
        if (this.selectedEl && this.boxHelper) {
            this.boxHelper.update();
        }
    }
});
