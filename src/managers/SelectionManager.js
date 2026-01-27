import * as THREE from 'three';

/**
 * Manages object selection, multi-selection, and selection group transforms.
 */
export class SelectionManager extends EventTarget {
	/**
	 * @param {THREE.Scene} scene
	 * @param {import('three/examples/jsm/controls/TransformControls').TransformControls} transformControl
	 * @param {import('three/examples/jsm/controls/OrbitControls').OrbitControls} orbitControls
	 */
	constructor (scene, transformControl, orbitControls) {
		super();
		this.scene = scene;
		this.transformControl = transformControl;
		this.orbitControls = orbitControls;

		this.selectedObjects = [];
		this.selectionGroup = new THREE.Group();
		this.scene.add(this.selectionGroup);
	}

	/**
	 * Select an object (add to selection).
	 * @param {Object} editorObject
	 */
	select (editorObject) {
		if (this.selectedObjects.includes(editorObject)) return;

		this.selectedObjects.push(editorObject);
		editorObject.mesh.material.emissive?.set(0x444444);
		this.updateSelectionGroup();
		this.emitSelectionChanged();
	}

	/**
	 * Toggle object selection.
	 * @param {Object} editorObject
	 */
	toggle (editorObject) {
		const index = this.selectedObjects.indexOf(editorObject);

		if (index > -1) {
			// Deselect
			this.selectedObjects.splice(index, 1);
			editorObject.mesh.material.emissive?.set(0x000000);
			this.scene.attach(editorObject.mesh);
		} else {
			// Select
			this.selectedObjects.push(editorObject);
			editorObject.mesh.material.emissive?.set(0x444444);
		}

		this.updateSelectionGroup();

		if (this.selectedObjects.length === 0) {
			this.emitDeselected();
		} else {
			this.emitSelectionChanged();
		}
	}

	/**
	 * Deselect all objects.
	 */
	deselectAll () {
		this.selectedObjects.forEach(obj => {
			obj.mesh.material.emissive?.set(0x000000);
			if (obj.mesh.parent === this.selectionGroup) {
				this.scene.attach(obj.mesh);
			}
		});

		this.selectedObjects = [];
		this.transformControl.detach();
		this.scene.remove(this.selectionGroup);
		this.orbitControls.enabled = true;
		this.orbitControls.enableZoom = true;

		this.emitDeselected();
	}

	/**
	 * Select all objects.
	 * @param {Object[]} objects - All editor objects
	 */
	selectAll (objects) {
		this.deselectAll();

		objects.forEach(obj => {
			this.selectedObjects.push(obj);
			obj.mesh.material.emissive?.set(0x444444);
		});

		this.updateSelectionGroup();

		if (this.selectedObjects.length > 0) {
			this.emitSelectionChanged();
		}
	}

	/**
	 * Remove an object from selection (e.g., when deleted).
	 * @param {Object} editorObject
	 */
	remove (editorObject) {
		const index = this.selectedObjects.indexOf(editorObject);
		if (index > -1) {
			this.selectedObjects.splice(index, 1);
		}

		if (this.selectedObjects.length === 0) {
			this.transformControl.detach();
			this.emitDeselected();
		} else {
			this.emitSelectionChanged();
		}
	}

	/**
	 * Update the selection group for multi-selection transforms.
	 */
	updateSelectionGroup () {
		this.transformControl.detach();

		// Disable orbit when objects are selected
		this.orbitControls.enabled = this.selectedObjects.length === 0;
		this.orbitControls.enableZoom = this.selectedObjects.length === 0;

		// Re-parent all to scene first
		this.selectedObjects.forEach(obj => {
			if (obj.mesh.parent === this.selectionGroup) {
				this.scene.attach(obj.mesh);
			}
		});

		if (this.selectedObjects.length > 1) {
			// Multi-selection: use group
			this.scene.remove(this.selectionGroup);
			this.selectionGroup.position.set(0, 0, 0);
			this.selectionGroup.rotation.set(0, 0, 0);
			this.selectionGroup.scale.set(1, 1, 1);
			this.selectionGroup.updateMatrixWorld(true);

			this.updateGroupCenter();
			this.scene.add(this.selectionGroup);

			this.selectedObjects.forEach(obj => {
				this.selectionGroup.attach(obj.mesh);
			});

			this.transformControl.attach(this.selectionGroup);
		} else if (this.selectedObjects.length === 1) {
			// Single selection: attach directly
			this.scene.remove(this.selectionGroup);
			this.transformControl.attach(this.selectedObjects[ 0 ].mesh);
		} else {
			this.scene.remove(this.selectionGroup);
		}
	}

	/**
	 * Update selection group center position.
	 * @returns {THREE.Vector3}
	 */
	updateGroupCenter () {
		const center = new THREE.Vector3();
		this.selectedObjects.forEach(obj => center.add(obj.mesh.position));
		center.divideScalar(this.selectedObjects.length);
		this.selectionGroup.position.copy(center);
		return center;
	}

	/**
	 * Check if object is selected.
	 * @param {Object} editorObject
	 * @returns {boolean}
	 */
	isSelected (editorObject) {
		return this.selectedObjects.includes(editorObject);
	}

	/**
	 * Get selected objects.
	 * @returns {Object[]}
	 */
	getSelected () {
		return this.selectedObjects;
	}

	/**
	 * Get selection count.
	 * @returns {number}
	 */
	getCount () {
		return this.selectedObjects.length;
	}

	/**
	 * Get last selected object.
	 * @returns {Object|null}
	 */
	getLast () {
		return this.selectedObjects.length > 0
			? this.selectedObjects[ this.selectedObjects.length - 1 ]
			: null;
	}

	/**
	 * Emit selection changed event.
	 * @private
	 */
	emitSelectionChanged () {
		this.dispatchEvent(new CustomEvent('selectionChanged', {
			detail: {
				objects: this.selectedObjects,
				count: this.selectedObjects.length,
				last: this.getLast()
			}
		}));
	}

	/**
	 * Emit deselected event.
	 * @private
	 */
	emitDeselected () {
		this.dispatchEvent(new CustomEvent('deselected'));
	}
}
