import * as THREE from 'three';

/**
 * Handles scene serialization and state formatting.
 */
export class SceneSerializer {
  constructor() {
    this.loadSceneCallback = null;
  }

  /**
   * Set callback for restoring scene state.
   * @param {Function} callback - Function that receives state and restores the scene
   */
  setLoadSceneCallback(callback) {
    this.loadSceneCallback = callback;
  }

  /**
   * Deep clone an object to prevent mutation issues.
   * @param {Object} obj
   * @returns {Object}
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Serialize array of editor objects to state.
   * @param {Object[]} objects
   * @returns {Object}
   */
  serializeObjects(objects) {
    return {
      objects: objects.map((obj) => {
        const position = new THREE.Vector3();
        const rotation = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        // Ensure matrix is up to date
        obj.mesh.updateMatrixWorld(true);
        obj.mesh.matrixWorld.decompose(position, rotation, scale);
        const eulerRotation = new THREE.Euler().setFromQuaternion(rotation);

        return {
          id: obj.id,
          data: JSON.parse(JSON.stringify(obj.data)),
          position: position.toArray(),
          rotation: [eulerRotation.x, eulerRotation.y, eulerRotation.z],
          scale: scale.toArray(),
        };
      }),
    };
  }

  /**
   * Export scene to JSON string.
   * @param {Object[]} objects
   * @returns {string}
   */
  exportToJSON(objects) {
    const state = this.serializeObjects(objects);
    return JSON.stringify(state, null, 2);
  }

  /**
   * Parse JSON string to state.
   * @param {string} jsonString
   * @returns {Object|null} Parsed state or null on error
   */
  parseJSON(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse scene JSON:', error);
      return null;
    }
  }
}
