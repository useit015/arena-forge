import * as THREE from 'three';
import UndoManager from 'undo-manager';

/**
 * Handles scene serialization and undo/redo using command pattern.
 * Uses undo-manager library for reliable history management.
 */
export class SceneSerializer extends EventTarget {
	/**
	 * @param {number} maxHistorySize - Maximum undo stack size
	 */
	constructor (maxHistorySize = 50) {
		super();
		this.undoManager = new UndoManager();
		this.undoManager.setLimit(maxHistorySize);
		this.lastState = null;
		this.loadSceneCallback = null;
	}

	/**
	 * Set callback for restoring scene state.
	 * @param {Function} callback - Function that receives state and restores the scene
	 */
	setLoadSceneCallback (callback) {
		this.loadSceneCallback = callback;
	}

	/**
	 * Save current scene state. Creates an undo/redo command if there was a previous state.
	 * @param {Object[]} objects - Array of editor objects
	 */
	saveState (objects) {
		// Force matrix update for accurate world positions
		objects.forEach(o => o.mesh.updateMatrixWorld(true));

		const newState = this.deepClone(this.serializeObjects(objects));

		if (this.lastState !== null) {
			const prevState = this.lastState;
			const currState = newState;

			this.undoManager.add({
				undo: () => {
					if (this.loadSceneCallback) {
						this.loadSceneCallback(prevState);
					}
					this.lastState = prevState;
					this.dispatchStateChanged();
					return prevState;
				},
				redo: () => {
					if (this.loadSceneCallback) {
						this.loadSceneCallback(currState);
					}
					this.lastState = currState;
					this.dispatchStateChanged();
					return currState;
				}
			});
		}

		this.lastState = newState;
		this.dispatchStateChanged();
	}

	/**
	 * Deep clone an object to prevent mutation issues.
	 * @param {Object} obj
	 * @returns {Object}
	 */
	deepClone (obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	/**
	 * Dispatch state changed event with current undo/redo availability.
	 */
	dispatchStateChanged () {
		this.dispatchEvent(new CustomEvent('stateChanged', {
			detail: { canUndo: this.canUndo(), canRedo: this.canRedo() }
		}));
	}

	/**
	 * Check if undo is available.
	 * @returns {boolean}
	 */
	canUndo () {
		return this.undoManager.hasUndo();
	}

	/**
	 * Check if redo is available.
	 * @returns {boolean}
	 */
	canRedo () {
		return this.undoManager.hasRedo();
	}

	/**
	 * Undo last action.
	 * @returns {Object|null} Previous state, or null if nothing to undo
	 */
	undo () {
		if (!this.canUndo()) return null;
		this.undoManager.undo();
		return this.lastState;
	}

	/**
	 * Redo previously undone action.
	 * @returns {Object|null} Next state, or null if nothing to redo
	 */
	redo () {
		if (!this.canRedo()) return null;
		this.undoManager.redo();
		return this.lastState;
	}

	/**
	 * Serialize array of editor objects to state.
	 * @param {Object[]} objects
	 * @returns {Object}
	 */
	serializeObjects (objects) {
		return {
			objects: objects.map(obj => {
				const position = new THREE.Vector3();
				const rotation = new THREE.Quaternion();
				const scale = new THREE.Vector3();
				obj.mesh.matrixWorld.decompose(position, rotation, scale);
				const eulerRotation = new THREE.Euler().setFromQuaternion(rotation);

				return {
					id: obj.id,
					data: JSON.parse(JSON.stringify(obj.data)),
					position: position.toArray(),
					rotation: [ eulerRotation.x, eulerRotation.y, eulerRotation.z ],
					scale: scale.toArray()
				};
			})
		};
	}

	/**
	 * Export scene to JSON string.
	 * @param {Object[]} objects
	 * @returns {string}
	 */
	exportToJSON (objects) {
		objects.forEach(o => o.mesh.updateMatrixWorld(true));
		const state = this.serializeObjects(objects);
		return JSON.stringify(state, null, 2);
	}

	/**
	 * Parse JSON string to state.
	 * @param {string} jsonString
	 * @returns {Object|null} Parsed state or null on error
	 */
	parseJSON (jsonString) {
		try {
			return JSON.parse(jsonString);
		} catch (error) {
			console.error('Failed to parse scene JSON:', error);
			return null;
		}
	}

	/**
	 * Clear history (e.g., when loading a new scene).
	 */
	clearHistory () {
		this.undoManager.clear();
		this.lastState = null;
		this.dispatchEvent(new CustomEvent('stateChanged', {
			detail: { canUndo: false, canRedo: false }
		}));
	}

	/**
	 * Get current history status.
	 * @returns {{ canUndo: boolean, canRedo: boolean }}
	 */
	getHistoryStatus () {
		return {
			canUndo: this.canUndo(),
			canRedo: this.canRedo()
		};
	}
}
