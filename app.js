document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('furniture-container');
    const addButtons = document.querySelectorAll('.add-btn');
    const saveBtn = document.getElementById('btn-save');
    const appLogicEl = document.getElementById('app-logic');

    // Furniture Definitions including fallbacks 
    // Fallbacks ensure the app works visually even if GLB models are missing
    const furnitureData = {
        'sofa': {
            model: '#sofa-model',
            scale: '1 1 1',
            fallback: '<a-box color="#FF6347" width="2" height="0.8" depth="1" position="0 0.4 0" shadow="cast: true; receive: true"></a-box>'
        },
        'chair': {
            model: '#chair-model',
            scale: '1 1 1',
            fallback: '<a-box color="#4682B4" width="0.8" height="1" depth="0.8" position="0 0.5 0" shadow="cast: true; receive: true"></a-box>'
        },
        'table': {
            model: '#table-model',
            scale: '1 1 1',
            fallback: '<a-cylinder color="#A0522D" radius="1.2" height="0.8" position="0 0.4 0" shadow="cast: true; receive: true"></a-cylinder>'
        },
        'bed': {
            model: '#bed-model',
            scale: '1 1 1',
            fallback: '<a-box color="#8A2BE2" width="1.5" height="0.6" depth="2" position="0 0.3 0" shadow="cast: true; receive: true"></a-box>'
        },
        'lamp': {
            model: '#lamp-model',
            scale: '1 1 1',
            fallback: '<a-cylinder color="#FFD700" radius="0.2" height="1.8" position="0 0.9 0" shadow="cast: true; receive: true"></a-cylinder>'
        },
        'wardrobe': {
            model: '#wardrobe-model',
            scale: '1 1 1',
            fallback: '<a-box color="#8B4513" width="1.2" height="2" depth="0.6" position="0 1 0" shadow="cast: true; receive: true"></a-box>'
        }
    };

    // Listen to Add Buttons
    addButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            if (furnitureData[type]) {
                // Place it slightly in front of the camera center
                addFurniture(type, { x: 0, y: 0, z: -2 }, { x: 0, y: 0, z: 0 });
            }
        });
    });

    // Save Button Listener
    saveBtn.addEventListener('click', () => {
        saveLayout();
        saveBtn.textContent = "Saved!";
        setTimeout(() => { saveBtn.textContent = "Save Layout"; }, 2000);
    });

    // Listen to layout-changed events from components
    if (appLogicEl) {
        appLogicEl.addEventListener('layout-changed', () => {
            // Optional: Auto-save on change
            // saveLayout();
        });
    }

    /**
     * Add furniture to the scene
     */
    function addFurniture(type, position, rotation) {
        const data = furnitureData[type];
        if (!data) return;

        const el = document.createElement('a-entity');

        // Use custom attributes to identify the type later when saving
        el.setAttribute('data-type', type);

        // Classes for raycaster
        el.setAttribute('class', 'clickable furniture');

        // GLTF Model reference
        el.setAttribute('gltf-model', data.model);

        // Transform
        el.setAttribute('position', position);
        el.setAttribute('rotation', rotation);
        el.setAttribute('scale', data.scale);

        // Interactive components
        el.setAttribute('drag-drop', '');
        el.setAttribute('rotate-object', '');

        // Fallback geometry incase the GLB model isn't available
        el.innerHTML = data.fallback;

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
            const type = obj.getAttribute('data-type');
            const pos = obj.getAttribute('position');
            const rot = obj.getAttribute('rotation');

            items.push({
                type: type,
                position: { x: pos.x, y: pos.y, z: pos.z },
                rotation: { x: rot.x, y: rot.y, z: rot.z }
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
                    addFurniture(item.type, item.position, item.rotation);
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
