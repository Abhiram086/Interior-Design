document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('furniture-container');
    const addButtons = document.querySelectorAll('.add-btn');
    const saveBtn = document.getElementById('btn-save');

    // Add buttons listener
    addButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            addFurniture(type, { x: 0, y: 0, z: -2 }, { x: 0, y: 0, z: 0 });
        });
    });

    // Save Button Listener
    saveBtn.addEventListener('click', () => {
        saveLayout();
        saveBtn.textContent = "Saved!";
        setTimeout(() => { saveBtn.textContent = "Save Layout"; }, 2000);
    });

    /**
     * Add furniture to the scene
     */
    /**
     * Add furniture to the scene
     */
    function addFurniture(type, position, rotation) {
        const el = document.createElement('a-entity');

        // Use custom attributes to identify the type later when saving
        el.setAttribute('data-model', type);

        // Classes for interaction
        el.setAttribute('class', 'furniture clickable');

        // Note: the requested format uses camelCase for the ID like: `#sofaModel`
        el.setAttribute('gltf-model', `#${type}Model`);

        // Transform
        el.setAttribute('position', position);
        el.setAttribute('rotation', rotation);
        el.setAttribute('scale', '1 1 1');

        // Interactive components
        el.setAttribute('selectable', '');
        el.setAttribute('draggable', '');
        el.setAttribute('rotatable', '');

        // Add a red placeholder box to display while loading
        el.innerHTML = '<a-box color="red" class="placeholder-box" width="1" height="1" depth="1" position="0 0.5 0"></a-box>';

        // Remove placeholder once the GLB model is fully loaded
        el.addEventListener('model-loaded', () => {
            const placeholder = el.querySelector('.placeholder-box');
            if (placeholder) {
                el.removeChild(placeholder);
            }
        });

        // Append to container
        container.appendChild(el);
    }

    /**
     * Save the current layout to localStorage
     */
    function saveLayout() {
        const items = [];
        const objects = container.querySelectorAll('.furniture');

        objects.forEach(obj => {
            const modelType = obj.getAttribute('data-model');

            // Parse to numbers to format exactly like the JSON request
            const pos = obj.getAttribute('position');
            const rot = obj.getAttribute('rotation');

            items.push({
                "model": modelType,
                "position": { "x": pos.x, "y": pos.y, "z": pos.z },
                "rotation": { "x": rot.x, "y": rot.y, "z": rot.z }
            });
        });

        localStorage.setItem('arvr-layout', JSON.stringify(items));
    }

    /**
     * Load layout from localStorage
     */
    function loadLayout() {
        const saved = localStorage.getItem('arvr-layout');
        if (saved) {
            try {
                const items = JSON.parse(saved);
                items.forEach(item => {
                    addFurniture(item.model, item.position, item.rotation);
                });
            } catch (e) {
                console.error("Error loading layout", e);
            }
        }
    }

    // Wait slightly for A-Frame entities to be ready before loading
    setTimeout(() => {
        loadLayout();
    }, 500);
});
