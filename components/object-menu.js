/* global AFRAME, THREE */

// Make sure to have a global variable for the selected object as requested
window.selectedObject = null;

/**
 * SELECTABLE Component
 * Makes an object selectable by clicking it.
 */
AFRAME.registerComponent('selectable', {
    init: function () {
        this.onClick = this.onClick.bind(this);
        this.el.addEventListener('click', this.onClick);
    },

    onClick: function (evt) {
        // Only trigger for the primary targeted object
        evt.stopPropagation();

        // Clear previous selection
        if (window.selectedObject && window.selectedObject !== this.el) {
            if (window.selectedObject.components.selectable) {
                window.selectedObject.components.selectable.deselect();
            }
        }

        this.select();
    },

    select: function () {
        window.selectedObject = this.el;

        // Apply visual outline using Three.js BoxHelper
        const mesh = this.el.getObject3D('mesh');
        if (mesh) {
            if (window.boxHelper) {
                this.el.sceneEl.object3D.remove(window.boxHelper);
                window.boxHelper.dispose();
            }
            window.boxHelper = new THREE.BoxHelper(mesh, 0xffff00); // Yellow highlight
            this.el.sceneEl.object3D.add(window.boxHelper);
        }

        // Enable UI buttons
        document.getElementById('btn-rotate').disabled = false;
        document.getElementById('btn-delete').disabled = false;
    },

    deselect: function () {
        if (window.selectedObject === this.el) {
            window.selectedObject = null;
        }

        // Remove highlight outline
        if (window.boxHelper) {
            this.el.sceneEl.object3D.remove(window.boxHelper);
            window.boxHelper.dispose();
            window.boxHelper = null;
        }

        // Disable UI buttons
        if (!window.selectedObject) {
            document.getElementById('btn-rotate').disabled = true;
            document.getElementById('btn-delete').disabled = true;
        }
    },

    tick: function () {
        // Keep outline updated if the object moves
        if (window.selectedObject === this.el && window.boxHelper) {
            window.boxHelper.update();
        }
    },

    remove: function () {
        this.el.removeEventListener('click', this.onClick);
        this.deselect();
    }
});


/**
 * DRAGGABLE Component
 * Allows an object to be dragged and snaps it to the floor.
 */
AFRAME.registerComponent('draggable', {
    init: function () {
        this.dragging = false;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.el.addEventListener('mousedown', this.onMouseDown);
        // Add to scene in case mouse goes off the object
        this.el.sceneEl.addEventListener('mouseup', this.onMouseUp);
    },

    onMouseDown: function (evt) {
        if (evt.detail.cursorEl && evt.detail.cursorEl.components.raycaster) {
            this.activeRaycaster = evt.detail.cursorEl.components.raycaster;
            this.dragging = true;
            // Prevent the raycaster from hitting this object anymore, allowing it to hit the floor behind it
            this.el.classList.remove('clickable');
            evt.stopPropagation();
        }
    },

    onMouseUp: function () {
        if (this.dragging) {
            this.dragging = false;
            this.activeRaycaster = null;
            this.el.classList.add('clickable');
        }
    },

    tick: function () {
        if (!this.dragging || !this.activeRaycaster) return;

        const intersections = this.activeRaycaster.intersections;
        if (intersections && intersections.length > 0) {
            // Find intersection with the floor
            const floorIntersection = intersections.find(
                int => int.object.el && int.object.el.classList.contains('floor')
            );

            if (floorIntersection) {
                // Snap to floor plane
                const point = floorIntersection.point;
                const pos = this.el.object3D.position;

                this.el.setAttribute('position', {
                    x: point.x,
                    y: pos.y, // Keep original Y (so it stays on the floor)
                    z: point.z
                });
            }
        }
    },

    remove: function () {
        this.el.removeEventListener('mousedown', this.onMouseDown);
        this.el.sceneEl.removeEventListener('mouseup', this.onMouseUp);
    }
});


/**
 * ROTATABLE Component
 * Exposes a method to rotate the object by 45 degrees.
 */
AFRAME.registerComponent('rotatable', {
    rotateNow: function () {
        const rot = this.el.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
        this.el.setAttribute('rotation', {
            x: rot.x,
            y: rot.y + 45,
            z: rot.z
        });
    }
});

// Setup click handlers for the global Rotate and Delete buttons in the UI
document.addEventListener('DOMContentLoaded', () => {
    const btnRotate = document.getElementById('btn-rotate');
    const btnDelete = document.getElementById('btn-delete');

    // Initially disable buttons until an object is selected
    btnRotate.disabled = true;
    btnDelete.disabled = true;

    btnRotate.addEventListener('click', () => {
        if (window.selectedObject && window.selectedObject.components.rotatable) {
            window.selectedObject.components.rotatable.rotateNow();
        }
    });

    btnDelete.addEventListener('click', () => {
        if (window.selectedObject) {
            const el = window.selectedObject;

            // Clean up selection outline
            if (el.components.selectable) {
                el.components.selectable.deselect();
            }

            // Remove from scene
            el.parentNode.removeChild(el);
        }
    });

    // Deselect if we click on background (floor/sky)
    const scene = document.querySelector('a-scene');
    if (scene) {
        scene.addEventListener('mousedown', (evt) => {
            const intersected = evt.detail.intersectedEl;
            if (intersected && (intersected.classList.contains('floor') || intersected.tagName.toLowerCase() === 'a-sky')) {
                if (window.selectedObject && window.selectedObject.components.selectable) {
                    window.selectedObject.components.selectable.deselect();
                }
            }
        });
    }
});
