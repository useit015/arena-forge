import * as THREE from 'three';

/**
 * Factory for creating editor objects with consistent geometry and materials.
 */
export class ObjectFactory {
	/**
	 * @param {import('./MaterialsLibrary').MaterialsLibrary} materialsLibrary
	 */
	constructor (materialsLibrary) {
		this.materials = materialsLibrary;
	}

	/**
	 * Object type configurations defining geometry, material, and Y offset.
	 */
	static OBJECT_TYPES = {
		box: {
			createGeometry: () => new THREE.BoxGeometry(2, 2, 2),
			material: 'obstacle',
			size: { width: 2, height: 2, depth: 2 },
			yOffset: 1
		},
		platform: {
			createGeometry: () => new THREE.BoxGeometry(5, 0.5, 5),
			material: 'platform',
			size: { width: 5, height: 0.5, depth: 5 },
			yOffset: 0.25
		},
		wall: {
			createGeometry: () => new THREE.BoxGeometry(0.3, 3, 5),
			material: 'wall',
			size: { width: 0.3, height: 3, depth: 5 },
			yOffset: 1.5
		},
		cylinder: {
			createGeometry: () => new THREE.CylinderGeometry(1, 1, 3, 16),
			material: 'obstacle',
			size: { radius: 1, height: 3 },
			yOffset: 1.5
		},
		ramp: {
			createGeometry: () => new THREE.BoxGeometry(4, 0.3, 6),
			material: 'platform',
			size: { width: 4, height: 0.3, depth: 6 },
			yOffset: 0.9,
			defaultRotation: { x: Math.PI / 12, y: 0, z: 0 }
		},
		emissive_strip: {
			createGeometry: () => new THREE.BoxGeometry(0.2, 0.1, 3),
			material: 'emissiveCyan',
			size: { width: 0.2, height: 0.1, depth: 3 },
			yOffset: 0.05
		}
	};

	/**
	 * Get Y offset for an object type (for placement on grid).
	 * @param {string} type
	 * @returns {number}
	 */
	getYOffset (type) {
		return ObjectFactory.OBJECT_TYPES[ type ]?.yOffset ?? 1;
	}

	/**
	 * Create an editor object with mesh and data.
	 * @param {string} type - Object type
	 * @param {THREE.Vector3} position - World position
	 * @param {string} [id] - Optional ID (generated if not provided)
	 * @returns {{ id: string, mesh: THREE.Mesh, data: Object }}
	 */
	create (type, position, id = null) {
		const config = ObjectFactory.OBJECT_TYPES[ type ] || ObjectFactory.OBJECT_TYPES.box;

		const geometry = config.createGeometry();
		const material = this.materials.get(config.material);

		const mesh = new THREE.Mesh(geometry, material);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.position.copy(position);

		// Apply default rotation if defined
		if (config.defaultRotation) {
			mesh.rotation.set(
				config.defaultRotation.x,
				config.defaultRotation.y,
				config.defaultRotation.z
			);
		}

		const data = {
			type,
			position: { x: position.x, y: position.y, z: position.z },
			rotation: config.defaultRotation
				? { ...config.defaultRotation }
				: { x: 0, y: 0, z: 0 },
			scale: { x: 1, y: 1, z: 1 },
			materialType: config.material,
			size: { ...config.size },
			customData: {}
		};

		return {
			id: id || this.generateId(),
			mesh,
			data
		};
	}

	/**
	 * Clone an existing editor object.
	 * @param {Object} editorObject
	 * @param {THREE.Vector3} newPosition
	 * @returns {{ id: string, mesh: THREE.Mesh, data: Object }}
	 */
	clone (editorObject, newPosition) {
		const newObj = this.create(editorObject.data.type, newPosition);

		// Copy transform
		newObj.mesh.rotation.copy(editorObject.mesh.rotation);
		newObj.mesh.scale.copy(editorObject.mesh.scale);

		// Deep copy data
		newObj.data = JSON.parse(JSON.stringify(editorObject.data));
		newObj.data.position = { x: newPosition.x, y: newPosition.y, z: newPosition.z };

		// Apply material
		if (this.materials.has(editorObject.data.materialType)) {
			newObj.mesh.material = this.materials.get(editorObject.data.materialType);
		}

		return newObj;
	}

	/**
	 * Generate unique object ID.
	 * @returns {string}
	 */
	generateId () {
		return 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	/**
	 * Get available object types.
	 * @returns {string[]}
	 */
	getTypes () {
		return Object.keys(ObjectFactory.OBJECT_TYPES);
	}
}
