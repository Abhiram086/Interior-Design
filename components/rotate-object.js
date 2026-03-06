/* global AFRAME */

/**
 * Component to handle rotation of the object.
 * While we can rotate via UI, this component wraps that functionality
 * and can optionally allow rotating via VR controllers or mouse scroll.
 */
AFRAME.registerComponent('rotate-object', {
    schema: {
        step: { type: 'number', default: 45 } // Rotate by 45 degrees
    },

    init: function () {
        // Keep track of current rotation Y
        const currentRot = this.el.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
        this.currentAngle = currentRot.y;
    },

    // Method called directly by the UI or other scripts
    rotateNow: function () {
        this.currentAngle += this.data.step;

        // Apply rotation
        const currentRot = this.el.getAttribute('rotation');
        this.el.setAttribute('rotation', {
            x: currentRot.x,
            y: this.currentAngle,
            z: currentRot.z
        });

        // Notify layout changed
        this.el.sceneEl.emit('layout-changed');
    }
});
