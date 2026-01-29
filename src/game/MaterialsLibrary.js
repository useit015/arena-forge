import * as THREE from 'three';

/**
 * Centralized materials library for the level editor.
 * Provides consistent, reusable materials across all editor objects.
 */
export class MaterialsLibrary {
  /**
   * @param {import('../managers/TextureManager').TextureManager} textureManager
   */
  constructor(textureManager) {
    this.textureManager = textureManager;
    this.materials = this.createMaterials();
  }

  /**
   * Create all predefined materials.
   * @returns {Object.<string, THREE.MeshStandardMaterial>}
   */
  createMaterials() {
    // Common textures
    const gridOrange = this.textureManager.createGridTexture({
      color: '#ff6600',
      thickness: 2,
      divisions: 4,
    });
    const gridCyan = this.textureManager.createGridTexture({
      color: '#00ffff',
      thickness: 2,
      divisions: 4,
    });
    const noiseRoughness = this.textureManager.createNoiseTexture({ scale: 4, intensity: 150 });

    // Hazard texture
    const hazardMap = this.textureManager.createHazardTexture();

    return {
      // Basic Materials
      floor: new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.6,
        metalness: 0.2,
      }),
      obstacle: new THREE.MeshStandardMaterial({
        color: 0x3a3a4e,
        roughnessMap: noiseRoughness,
        roughness: 0.8,
        metalness: 0.3,
      }),
      wall: new THREE.MeshStandardMaterial({
        color: 0x2a2a3e,
        roughness: 0.5,
        metalness: 0.3,
      }),
      platform: new THREE.MeshStandardMaterial({
        color: 0x252540,
        roughness: 0.6,
        metalness: 0.2,
      }),

      // Textured / Special Materials
      gridOrange: new THREE.MeshStandardMaterial({
        map: gridOrange,
        color: 0xffaa00,
        roughness: 0.4,
        metalness: 0.6,
        emissive: 0xff6600,
        emissiveIntensity: 0.2,
      }),
      gridCyan: new THREE.MeshStandardMaterial({
        map: gridCyan,
        color: 0x00aaff,
        roughness: 0.4,
        metalness: 0.6,
        emissive: 0x00ffff,
        emissiveIntensity: 0.2,
      }),
      hazard: new THREE.MeshStandardMaterial({
        map: hazardMap,
        roughness: 0.4,
        metalness: 0.1,
      }),
      scifiWall: new THREE.MeshStandardMaterial({
        color: 0x202025,
        metalness: 0.8,
        roughness: 0.3,
        bumpMap: gridCyan,
        bumpScale: 0.05,
      }),

      // Emissives
      emissiveCyan: new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.0,
        roughness: 0.2,
        metalness: 0.0,
      }),
      emissiveOrange: new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff6600,
        emissiveIntensity: 1.0,
        roughness: 0.2,
        metalness: 0.0,
      }),
      emissiveMagenta: new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 1.0,
        roughness: 0.2,
        metalness: 0.0,
      }),
      metalTrim: new THREE.MeshStandardMaterial({
        color: 0x888899,
        roughness: 0.2,
        metalness: 1.0,
        envMapIntensity: 1.0,
      }),
    };
  }

  /**
   * Get a cloned material by name.
   * @param {string} name - Material name
   * @returns {THREE.MeshStandardMaterial|null}
   */
  get(name) {
    const material = this.materials[name];
    return material ? material.clone() : null;
  }

  /**
   * Get reference to original material (for comparison).
   * @param {string} name - Material name
   * @returns {THREE.MeshStandardMaterial|null}
   */
  getReference(name) {
    return this.materials[name] || null;
  }

  /**
   * Check if a material exists.
   * @param {string} name - Material name
   * @returns {boolean}
   */
  has(name) {
    return name in this.materials;
  }

  /**
   * Get all material names.
   * @returns {string[]}
   */
  getNames() {
    return Object.keys(this.materials);
  }
}
