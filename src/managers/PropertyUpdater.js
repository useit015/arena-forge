import * as THREE from 'three';

/**
 * Updates object properties from UI changes.
 */
export class PropertyUpdater {
	/**
	 * @param {import('../core/MaterialsLibrary').MaterialsLibrary} materials
	 */
	constructor (materials) {
		this.materials = materials;
	}

	/**
	 * Update an object property.
	 * @param {Object} editorObject
	 * @param {string} property
	 * @param {*} value
	 */
	update (editorObject, property, value) {
		const mesh = editorObject.mesh;
		const data = editorObject.data;

		switch (property) {
			case 'materialType':
				if (this.materials.has(value)) {
					mesh.material = this.materials.get(value);
					data.materialType = value;
				}
				break;
			case 'width':
				mesh.scale.x = value / data.size.width;
				data.scale.x = mesh.scale.x;
				break;
			case 'height':
				mesh.scale.y = value / data.size.height;
				data.scale.y = mesh.scale.y;
				break;
			case 'depth':
				mesh.scale.z = value / data.size.depth;
				data.scale.z = mesh.scale.z;
				break;
			case 'x':
				mesh.position.x = parseFloat(value);
				data.position.x = mesh.position.x;
				break;
			case 'y':
				mesh.position.y = parseFloat(value);
				data.position.y = mesh.position.y;
				break;
			case 'z':
				mesh.position.z = parseFloat(value);
				data.position.z = mesh.position.z;
				break;
			case 'rot-x':
				mesh.rotation.x = THREE.MathUtils.degToRad(parseFloat(value));
				data.rotation.x = mesh.rotation.x;
				break;
			case 'rot-y':
				mesh.rotation.y = THREE.MathUtils.degToRad(parseFloat(value));
				data.rotation.y = mesh.rotation.y;
				break;
			case 'rot-z':
				mesh.rotation.z = THREE.MathUtils.degToRad(parseFloat(value));
				data.rotation.z = mesh.rotation.z;
				break;
		}
	}
}
