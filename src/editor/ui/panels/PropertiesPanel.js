import * as THREE from 'three';

/**
 * Manages the properties panel UI for selected objects.
 */
export class PropertiesPanel {
  /**
   * @param {Object} editor - The editor instance
   * @param {HTMLElement} panelElement - The properties section element
   */
  constructor(editor, panelElement) {
    this.editor = editor;
    this.panel = panelElement;
    this.inputs = {};
    this.onChange = null;

    this.cacheInputs();
    this.setupInputListeners();
    this.setupEditorListeners();
  }

  setupEditorListeners() {
    this.editor.signals.objectSelected.add((object) => {
      if (object) {
        this.update(object, 1);
      } else {
        this.hide();
      }
    });

    this.editor.signals.objectChanged.add((obj) => {
      if (this.editor.selected === obj) {
        this.update(obj, 1);
      }
    });
  }

  /**
   * Cache references to input elements.
   */
  cacheInputs() {
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
      material: document.getElementById('material-select'),
    };
  }

  /**
   * Setup input change listeners.
   */
  setupInputListeners() {
    const bindInput = (inputKey, propEmitter) => {
      const input = this.inputs[inputKey];
      if (!input) return;

      // Use 'input' for live updates, 'change' for final commit
      const handler = (e) => propEmitter(parseFloat(e.target.value));
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    };

    // Position inputs
    ['posX', 'posY', 'posZ'].forEach((key) => {
      const axis = key.slice(3).toLowerCase();
      bindInput(key, (val) => this.emitChange(axis, val));
    });

    // Rotation inputs
    ['rotX', 'rotY', 'rotZ'].forEach((key) => {
      const axis = 'rot-' + key.slice(3).toLowerCase();
      bindInput(key, (val) => this.emitChange(axis, val));
    });

    // Size inputs
    ['sizeWidth', 'sizeHeight', 'sizeDepth'].forEach((key) => {
      const dim = key.slice(4).toLowerCase();
      bindInput(key, (val) => this.emitChange(dim, val));
    });

    // Material (select uses 'change' only)
    this.inputs.material?.addEventListener('change', (e) => {
      this.emitChange('materialType', e.target.value);
    });
  }

  /**
   * Emit change event.
   * @param {string} property
   * @param {*} value
   */
  emitChange(property, value) {
    if (this.onChange) {
      this.onChange(property, value);
    }
  }

  /**
   * Set change callback.
   * @param {Function} callback - (property, value) => void
   */
  setOnChange(callback) {
    this.onChange = callback;
  }

  /**
   * Update panel with object data.
   * @param {Object} editorObject
   * @param {number} selectedCount
   */
  update(object, selectedCount = 1) {
    this.show();

    if (selectedCount > 1) {
      // Multi-selection
      this.inputs.objectType.textContent = `Multiple (${selectedCount})`;
      this.inputs.objectId.textContent = 'Multi-selection';
      this.disableInputs();
    } else {
      // Single selection
      const data = object.userData;
      this.inputs.objectType.textContent = data.type || 'Object';
      this.inputs.objectId.textContent = object.id;

      // Position
      this.inputs.posX.value = object.position.x.toFixed(2);
      this.inputs.posY.value = object.position.y.toFixed(2);
      this.inputs.posZ.value = object.position.z.toFixed(2);

      // Rotation (convert to degrees)
      this.inputs.rotX.value = THREE.MathUtils.radToDeg(object.rotation.x).toFixed(0);
      this.inputs.rotY.value = THREE.MathUtils.radToDeg(object.rotation.y).toFixed(0);
      this.inputs.rotZ.value = THREE.MathUtils.radToDeg(object.rotation.z).toFixed(0);

      // Size
      if (data.size) {
        const scale = object.scale;
        const size = data.size;
        this.inputs.sizeWidth.value = (size.width * scale.x).toFixed(2);
        this.inputs.sizeHeight.value = (size.height * scale.y).toFixed(2);
        this.inputs.sizeDepth.value = (size.depth * scale.z).toFixed(2);
      }

      // Material
      this.inputs.material.value = data.materialType || 'obstacle';

      this.enableInputs();
    }
  }

  /**
   * Show the panel.
   */
  show() {
    this.panel?.classList.remove('hidden');
  }

  /**
   * Hide the panel.
   */
  hide() {
    this.panel?.classList.add('hidden');
  }

  /**
   * Disable all inputs (for multi-selection).
   */
  disableInputs() {
    Object.entries(this.inputs).forEach(([, input]) => {
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
  enableInputs() {
    Object.entries(this.inputs).forEach(([, input]) => {
      if (input?.tagName === 'INPUT' || input?.tagName === 'SELECT') {
        input.disabled = false;
      }
    });
  }
}
