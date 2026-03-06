document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('furniture-container');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const saveBtn = document.getElementById('btn-save');
    const appLogicEl = document.getElementById('app-logic');

    // UI elements for multi-model loading
    const modelSelectionPanel = document.getElementById('model-selection-panel');
    const categoryTitle = document.getElementById('category-title');
    const modelList = document.getElementById('model-list');
    const btnUploadModel = document.getElementById('btn-upload-model');
    const modelUpload = document.getElementById('model-upload');

    let currentCategory = null;

    // We no longer rely on specific hardcoded HTML assets. 
    // We store the data URL/Blob (or fallback if empty) for models here.
    const customModels = {
        'sofa': [{ name: 'Default Sofa', url: 'assets/models/sofa/sofa.glb' }],
        'chair': [{ name: 'Default Chair', url: 'assets/models/chair/chair.glb' }],
        'table': [{ name: 'Default Table', url: 'assets/models/table/table.glb' }],
        'bed': [{ name: 'Default Bed', url: 'assets/models/bed/bed.glb' }],
        'lamp': [{ name: 'Default Lamp', url: 'assets/models/lamp/lamp.glb' }],
        'wardrobe': [{ name: 'Default Wardrobe', url: 'assets/models/wardrobe/wardrobe.glb' }]
    };

    // Fallbacks ensure the app works visually even if GLB models are missing
    const fallbacks = {
        'sofa': '<a-box color="#FF6347" width="2" height="0.8" depth="1" position="0 0.4 0" shadow="cast: true; receive: true"></a-box>',
        'chair': '<a-box color="#4682B4" width="0.8" height="1" depth="0.8" position="0 0.5 0" shadow="cast: true; receive: true"></a-box>',
        'table': '<a-cylinder color="#A0522D" radius="1.2" height="0.8" position="0 0.4 0" shadow="cast: true; receive: true"></a-cylinder>',
        'bed': '<a-box color="#8A2BE2" width="1.5" height="0.6" depth="2" position="0 0.3 0" shadow="cast: true; receive: true"></a-box>',
        'lamp': '<a-cylinder color="#FFD700" radius="0.2" height="1.8" position="0 0.9 0" shadow="cast: true; receive: true"></a-cylinder>',
        'wardrobe': '<a-box color="#8B4513" width="1.2" height="2" depth="0.6" position="0 1 0" shadow="cast: true; receive: true"></a-box>'
    };

    // Category Selection Logic
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.getAttribute('data-type');
            categoryTitle.textContent = btn.textContent;
            modelSelectionPanel.style.display = 'flex';
            renderModelList();
        });
    });

    // Handle File Uploads (for letting the user provide local .glb files dynamically)
    btnUploadModel.addEventListener('click', () => {
        modelUpload.click();
    });

    modelUpload.addEventListener('change', (e) => {
        if (!currentCategory) return;

        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const url = URL.createObjectURL(file);
            customModels[currentCategory].push({
                name: file.name,
                url: url
            });
        }

        renderModelList();
        // Reset input
        modelUpload.value = '';
    });

    // Render the list of models for the active category
    function renderModelList() {
        if (!currentCategory) return;

        modelList.innerHTML = '';
        const models = customModels[currentCategory];

        if (models.length === 0) {
            modelList.innerHTML = '<span style="font-size: 0.8rem; color: #aaa;">No models added yet.</span>';
        }

        models.forEach((model, index) => {
            const btn = document.createElement('button');
            btn.textContent = "Add " + model.name;
            btn.style.fontSize = "0.85rem";
            btn.addEventListener('click', () => {
                addFurniture(currentCategory, model.url, { x: 0, y: 0, z: -2 }, { x: 0, y: 0, z: 0 });
            });
            modelList.appendChild(btn);
        });
    }

    // Save Button Listener
    saveBtn.addEventListener('click', () => {
        saveLayout();
        saveBtn.textContent = "Saved!";
        setTimeout(() => { saveBtn.textContent = "Save Layout"; }, 2000);
    });

    // Listen to layout-changed events from components
    if (appLogicEl) {
        appLogicEl.addEventListener('layout-changed', () => {
            // saveLayout();
        });
    }

    /**
     * Add furniture to the scene
     */
    function addFurniture(type, url, position, rotation) {
        const fallbackHTML = fallbacks[type];

        const el = document.createElement('a-entity');

        // Use custom attributes to identify the type later when saving
        el.setAttribute('data-type', type);
        el.setAttribute('data-url', url); // Keep track of the model url

        // Classes for raycaster
        el.setAttribute('class', 'clickable furniture');

        // GLTF Model reference: we inject the URL directly instead of a-assets references
        el.setAttribute('gltf-model', `url(${url})`);

        // Transform
        el.setAttribute('position', position);
        el.setAttribute('rotation', rotation);
        el.setAttribute('scale', '1 1 1');

        // Interactive components
        el.setAttribute('drag-drop', '');
        el.setAttribute('rotate-object', '');

        // Fallback geometry incase the GLB model isn't available
        el.innerHTML = fallbackHTML;

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
            const url = obj.getAttribute('data-url');

            // Note: Uploaded blob URLs won't persist across page reloads.
            // A fully robust app would require an indexedDB/server to save binary blobs.
            const pos = obj.getAttribute('position');
            const rot = obj.getAttribute('rotation');

            items.push({
                type: type,
                url: url,
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
                    // Try to restore. Note that blob urls (blob:http://...) from previous sessions will be dead.
                    addFurniture(item.type, item.url, item.position, item.rotation);
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
