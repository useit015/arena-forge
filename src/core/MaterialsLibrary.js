import * as THREE from 'three';

/**
 * Centralized materials library for the level editor.
 * Provides consistent, reusable materials across all editor objects.
 */
export class MaterialsLibrary {
	constructor () {
		this.materials = this.createMaterials();
	}

	/**
	 * Create all predefined materials.
	 * @returns {Object.<string, THREE.MeshStandardMaterial>}
	 */
	createMaterials () {
		return {
			floor: new THREE.MeshStandardMaterial({
				color: 0x1a1a2e,
				roughness: 0.6,
				metalness: 0.2
			}),
			obstacle: new THREE.MeshStandardMaterial({
				color: 0x3a3a4e,
				roughness: 0.4,
				metalness: 0.4
			}),
			wall: new THREE.MeshStandardMaterial({
				color: 0x2a2a3e,
				roughness: 0.5,
				metalness: 0.3
			}),
			emissiveCyan: new THREE.MeshStandardMaterial({
				color: 0x00ffff,
				emissive: 0x00ffff,
				emissiveIntensity: 0.5,
				roughness: 0.3,
				metalness: 0.5
			}),
			emissiveOrange: new THREE.MeshStandardMaterial({
				color: 0xff6600,
				emissive: 0xff6600,
				emissiveIntensity: 0.5,
				roughness: 0.3,
				metalness: 0.5
			}),
			emissiveMagenta: new THREE.MeshStandardMaterial({
				color: 0xff00ff,
				emissive: 0xff00ff,
				emissiveIntensity: 0.5,
				roughness: 0.3,
				metalness: 0.5
			}),
			platform: new THREE.MeshStandardMaterial({
				color: 0x252540,
				roughness: 0.6,
				metalness: 0.2
			}),
			metalTrim: new THREE.MeshStandardMaterial({
				color: 0x4a4a5e,
				roughness: 0.2,
				metalness: 0.8
			})
		};
	}

	/**
	 * Get a cloned material by name.
	 * @param {string} name - Material name
	 * @returns {THREE.MeshStandardMaterial|null}
	 */
	get (name) {
		const material = this.materials[ name ];
		return material ? material.clone() : null;
	}

	/**
	 * Get reference to original material (for comparison).
	 * @param {string} name - Material name
	 * @returns {THREE.MeshStandardMaterial|null}
	 */
	getReference (name) {
		return this.materials[ name ] || null;
	}

	/**
	 * Check if a material exists.
	 * @param {string} name - Material name
	 * @returns {boolean}
	 */
	has (name) {
		return name in this.materials;
	}

	/**
	 * Get all material names.
	 * @returns {string[]}
	 */
	getNames () {
		return Object.keys(this.materials);
	}
}
