import * as THREE from 'three';

/**
 * AssetRegistry - Manages all editor assets (textures, models, sounds, etc).
 * Acts as a single source of truth for resources.
 */
export class AssetRegistry {
  constructor(editor) {
    this.editor = editor;
    this.assets = new Map();
    this.loaders = {
      texture: new THREE.TextureLoader(),
      // model: new GLTFLoader(), // Add when needed
    };
  }

  /**
   * Register an asset.
   * @param {string} id
   * @param {Object} asset
   */
  register(id, asset) {
    this.assets.set(id, asset);
    this.editor.events.emit('assetRegistered', { id, asset });
  }

  /**
   * Get an asset.
   * @param {string} id
   */
  get(id) {
    return this.assets.get(id);
  }

  /**
   * Remove an asset.
   * @param {string} id
   */
  unregister(id) {
    if (this.assets.has(id)) {
      const asset = this.assets.get(id);
      this.assets.delete(id);
      this.editor.events.emit('assetUnregistered', { id, asset });
    }
  }

  /**
   * List all assets of a certain type.
   * @param {string} type
   */
  listByType(type) {
    return Array.from(this.assets.entries())
      .filter(([, asset]) => asset.type === type)
      .map(([id, asset]) => ({ id, ...asset }));
  }

  toJSON() {
    const assets = {};
    this.assets.forEach((value, key) => {
      assets[key] = {
        type: value.type,
        path: value.path,
        data: value.data, // Optional base64 or custom data
      };
    });
    return assets;
  }

  fromJSON(/* json */) {
    // Logic to reload assets from JSON
  }
}
