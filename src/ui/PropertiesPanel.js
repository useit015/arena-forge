import * as THREE from 'three';

/**
 * Manages the properties panel UI for selected objects.
 */
export class PropertiesPanel {
	/**
	 * @param {HTMLElement} panelElement - The properties section element
	 */
	constructor (panelElement) {
		this.panel = panelElement;
		this.inputs = {};
		this.onChange = null;

		this.cacheInputs();
		this.setupListeners();
	}

	/**
	 * Cache references to input elements.
	 */
	cacheInputs () {
		this.inputs = {
			objectType: document.getElementById('object-type'),
			objectId: document.getElementById('object-id'),
			posX: document.getElementById('pos-x'),
			posY: document.getElementById('pos-y'),
			posZ: document.getElementById('pos-z'),
			rotX: document.getElementById('rot-x'),
			rotY: document.getElementById('rot-y'),
			rotZ: document.getElementById('rot-z'),
			sizeWidth: document.getElementById('size-width'),
			sizeHeight: document.getElementById('size-height'),
			sizeDepth: document.getElementById('size-depth'),
			material: document.getElementById('material-select')
		};
	}

	/**
	 * Setup input change listeners.
	 */
	setupListeners () {
		// Position inputs
		[ 'posX', 'posY', 'posZ' ].forEach(key => {
			const axis = key.slice(3).toLowerCase();
			this.inputs[ key ]?.addEventListener('change', (e) => {
				this.emitChange(axis, parseFloat(e.target.value));
			});
		});

		// Rotation inputs
		[ 'rotX', 'rotY', 'rotZ' ].forEach(key => {
			const axis = 'rot-' + key.slice(3).toLowerCase();
			this.inputs[ key ]?.addEventListener('change', (e) => {
				this.emitChange(axis, parseFloat(e.target.value));
			});
		});

		// Size inputs
		[ 'sizeWidth', 'sizeHeight', 'sizeDepth' ].forEach(key => {
			const dim = key.slice(4).toLowerCase();
			this.inputs[ key ]?.addEventListener('change', (e) => {
				this.emitChange(dim, parseFloat(e.target.value));
			});
		});

		// Material
		this.inputs.material?.addEventListener('change', (e) => {
			this.emitChange('materialType', e.target.value);
		});
	}

	/**
	 * Emit change event.
	 * @param {string} property
	 * @param {*} value
	 */
	emitChange (property, value) {
		if (this.onChange) {
			this.onChange(property, value);
		}
	}

	/**
	 * Set change callback.
	 * @param {Function} callback - (property, value) => void
	 */
	setOnChange (callback) {
		this.onChange = callback;
	}

	/**
	 * Update panel with object data.
	 * @param {Object} editorObject
	 * @param {number} selectedCount
	 */
	update (editorObject, selectedCount = 1) {
		this.show();

		if (selectedCount > 1) {
			// Multi-selection
			this.inputs.objectType.textContent = `Multiple (${ selectedCount })`;
			this.inputs.objectId.textContent = 'Multi-selection';
			this.disableInputs();
		} else {
			// Single selection
			this.inputs.objectType.textContent = editorObject.data.type;
			this.inputs.objectId.textContent = editorObject.id;

			// Position
			this.inputs.posX.value = editorObject.mesh.position.x.toFixed(2);
			this.inputs.posY.value = editorObject.mesh.position.y.toFixed(2);
			this.inputs.posZ.value = editorObject.mesh.position.z.toFixed(2);

			// Rotation (convert to degrees)
			this.inputs.rotX.value = THREE.MathUtils.radToDeg(editorObject.mesh.rotation.x).toFixed(0);
			this.inputs.rotY.value = THREE.MathUtils.radToDeg(editorObject.mesh.rotation.y).toFixed(0);
			this.inputs.rotZ.value = THREE.MathUtils.radToDeg(editorObject.mesh.rotation.z).toFixed(0);

			// Size
			if (editorObject.data.size) {
				const scale = editorObject.mesh.scale;
				const size = editorObject.data.size;
				this.inputs.sizeWidth.value = (size.width * scale.x).toFixed(2);
				this.inputs.sizeHeight.value = (size.height * scale.y).toFixed(2);
				this.inputs.sizeDepth.value = (size.depth * scale.z).toFixed(2);
			}

			// Material
			this.inputs.material.value = editorObject.data.materialType || 'obstacle';

			this.enableInputs();
		}
	}

	/**
	 * Show the panel.
	 */
	show () {
		this.panel?.classList.remove('hidden');
	}

	/**
	 * Hide the panel.
	 */
	hide () {
		this.panel?.classList.add('hidden');
	}

	/**
	 * Disable all inputs (for multi-selection).
	 */
	disableInputs () {
		Object.entries(this.inputs).forEach(([ key, input ]) => {
			if (input?.tagName === 'INPUT') {
				input.value = '—';
				input.disabled = true;
			} else if (input?.tagName === 'SELECT') {
				input.disabled = true;
			}
		});
	}

	/**
	 * Enable all inputs.
	 */
	enableInputs () {
		Object.entries(this.inputs).forEach(([ key, input ]) => {
			if (input?.tagName === 'INPUT' || input?.tagName === 'SELECT') {
				input.disabled = false;
			}
		});
	}
}
