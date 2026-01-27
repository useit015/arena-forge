import * as THREE from 'three';

/**
 * Manages grid display, snap-to-grid, and floor plane.
 */
export class GridManager {
	/**
	 * @param {THREE.Scene} scene
	 * @param {number} initialSize - Initial grid size (half-extent)
	 */
	constructor (scene, initialSize = 100) {
		this.scene = scene;
		this.gridSize = initialSize;
		this.snapToGrid = true;
		this.gridHelper = null;
		this.floor = null;

		this.setupGrid();
	}

	/**
	 * Create or recreate the grid and floor.
	 */
	setupGrid () {
		// Remove existing
		if (this.gridHelper) this.scene.remove(this.gridHelper);
		if (this.floor) this.scene.remove(this.floor);

		const fullSize = this.gridSize * 2;
		const divisions = fullSize;

		// Grid lines
		this.gridHelper = new THREE.GridHelper(fullSize, divisions, 0x00ffff, 0x222222);
		this.gridHelper.position.y = 0;
		this.scene.add(this.gridHelper);

		// Solid floor plane
		const geometry = new THREE.PlaneGeometry(fullSize, fullSize);
		const material = new THREE.MeshStandardMaterial({
			color: 0x0a0a14,
			roughness: 0.8,
			metalness: 0.1,
			transparent: true,
			opacity: 0.5
		});
		this.floor = new THREE.Mesh(geometry, material);
		this.floor.rotation.x = -Math.PI / 2;
		this.floor.position.y = -0.01; // Avoid Z-fighting
		this.floor.receiveShadow = true;
		this.scene.add(this.floor);
	}

	/**
	 * Update grid size and clamp existing objects.
	 * @param {number} newSize
	 * @param {Object[]} objects - Editor objects to clamp
	 */
	updateSize (newSize, objects = []) {
		this.gridSize = parseInt(newSize);
		this.setupGrid();

		// Clamp objects to new grid boundaries
		const halfGrid = this.gridSize;
		objects.forEach(obj => {
			let changed = false;
			const pos = obj.mesh.position;

			if (pos.x > halfGrid) { pos.x = halfGrid; changed = true; }
			if (pos.x < -halfGrid) { pos.x = -halfGrid; changed = true; }
			if (pos.z > halfGrid) { pos.z = halfGrid; changed = true; }
			if (pos.z < -halfGrid) { pos.z = -halfGrid; changed = true; }

			if (changed) {
				obj.data.position.x = pos.x;
				obj.data.position.z = pos.z;
			}
		});
	}

	/**
	 * Toggle grid visibility.
	 * @param {boolean} visible
	 */
	setVisible (visible) {
		if (this.gridHelper) {
			this.gridHelper.visible = visible;
		}
	}

	/**
	 * Get grid visibility.
	 * @returns {boolean}
	 */
	isVisible () {
		return this.gridHelper?.visible ?? true;
	}

	/**
	 * Toggle snap-to-grid mode.
	 * @returns {boolean} New snap state
	 */
	toggleSnap () {
		this.snapToGrid = !this.snapToGrid;
		return this.snapToGrid;
	}

	/**
	 * Set snap-to-grid mode.
	 * @param {boolean} enabled
	 */
	setSnap (enabled) {
		this.snapToGrid = enabled;
	}

	/**
	 * Snap a position to grid.
	 * @param {THREE.Vector3} position
	 * @param {boolean} includeY - Also snap Y
	 * @returns {THREE.Vector3} Snapped position (mutates input)
	 */
	snapPosition (position, includeY = false) {
		position.x = Math.round(position.x);
		position.z = Math.round(position.z);
		if (includeY) {
			position.y = Math.round(position.y);
		}
		return position;
	}

	/**
	 * Snap an editor object to grid.
	 * @param {Object} editorObject
	 */
	snapObject (editorObject) {
		if (!editorObject) return;
		this.snapPosition(editorObject.mesh.position);
		editorObject.data.position.x = editorObject.mesh.position.x;
		editorObject.data.position.z = editorObject.mesh.position.z;
	}

	/**
	 * Clamp position to grid boundaries.
	 * @param {THREE.Vector3} position
	 * @returns {THREE.Vector3} Clamped position (mutates input)
	 */
	clampToGrid (position) {
		const half = this.gridSize;
		position.x = Math.max(-half, Math.min(half, position.x));
		position.z = Math.max(-half, Math.min(half, position.z));
		return position;
	}

	/**
	 * Get current grid size.
	 * @returns {number}
	 */
	getSize () {
		return this.gridSize;
	}
}
