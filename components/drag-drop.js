/* global AFRAME */

AFRAME.registerComponent('drag-drop', {
    init: function () {
        this.dragging = false;

        // Bind methods
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.el.addEventListener('mousedown', this.onMouseDown);
        // Add to scene too in case we release mouse off the object
        this.el.sceneEl.addEventListener('mouseup', this.onMouseUp);

        // Let the object be clickable by the raycaster
        this.el.classList.add('clickable');
    },

    onMouseDown: function (evt) {
        // Only start dragging if it was the primary intersection
        this.dragging = true;

        // Temporarily disable the raycaster hitting this object while dragging so we can hit the floor instead
        this.el.classList.remove('clickable');

        // Notify the app that this object was selected (for UI panel)
        this.el.sceneEl.emit('object-selected', { el: this.el });

        // Prevent default event bubbling
        evt.stopPropagation();
    },

    onMouseUp: function (evt) {
        if (this.dragging) {
            this.dragging = false;
            // Re-enable clickability
            this.el.classList.add('clickable');
        }
    },

    tick: function () {
        if (!this.dragging) return;

        const sceneEl = this.el.sceneEl;

        // Find existing raycasters (mouse cursor or VR laser controllers)
        const raycasters = [];

        // The mouse raycaster is attached to the scene itself
        if (sceneEl.components.raycaster) {
            raycasters.push(sceneEl);
        }

        // VR controllers are entities within the scene
        const els = sceneEl.querySelectorAll('[raycaster]');
        for (let i = 0; i < els.length; i++) {
            raycasters.push(els[i]);
        }

        for (let i = 0; i < raycasters.length; i++) {
            const raycaster = raycasters[i].components.raycaster;
            if (raycaster && raycaster.intersections && raycaster.intersections.length > 0) {
                // Find intersection with the floor
                const floorIntersection = raycaster.intersections.find(
                    int => int.object.el && int.object.el.classList.contains('floor')
                );

                if (floorIntersection) {
                    const point = floorIntersection.point;
                    // Update position, keeping original Y (assuming flat floor)
                    const pos = this.el.object3D.position;
                    // Smoothly update position
                    this.el.setAttribute('position', {
                        x: point.x,
                        y: pos.y,
                        z: point.z
                    });

                    // Fire an event to notify about layout change
                    this.el.sceneEl.emit('layout-changed');

                    break; // Only use the first valid raycaster intersection
                }
            }
        }
    },

    remove: function () {
        this.el.removeEventListener('mousedown', this.onMouseDown);
        this.el.sceneEl.removeEventListener('mouseup', this.onMouseUp);
    }
});
