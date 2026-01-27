import * as THREE from 'three';

/**
 * Handles drag operations for transform (move, rotate).
 * Processes raw input events into object transformations.
 */
export class DragController {
	/**
	 * @param {import('./GridManager').GridManager} gridManager
	 * @param {THREE.Camera} camera
	 */
	constructor (gridManager, camera) {
		this.grid = gridManager;
		this.camera = camera;
	}

	/**
	 * Apply horizontal/vertical move drag to objects.
	 * @param {Object[]} objects - Selected editor objects
	 * @param {Object} dragData - { delta, startPositions }
	 * @param {string} tool - 'select', 'move-x', or 'move-y'
	 */
	applyMoveDrag (objects, dragData, tool) {
		const { delta, startPositions } = dragData;

		objects.forEach((obj, i) => {
			const start = startPositions[ i ];
			let newX = start.x, newY = start.y, newZ = start.z;

			if (tool === 'select' || tool === 'move-x') {
				newX += delta.x;
				newZ += delta.z;
			}
			if (tool === 'move-y') {
				newY += delta.y;
			}

			if (this.grid.snapToGrid) {
				newX = Math.round(newX);
				newZ = Math.round(newZ);
				if (tool === 'move-y') newY = Math.round(newY);
			}

			// Clamp to grid
			const half = this.grid.gridSize;
			newX = Math.max(-half, Math.min(half, newX));
			newZ = Math.max(-half, Math.min(half, newZ));

			obj.mesh.position.set(newX, newY, newZ);
			obj.data.position = { x: newX, y: newY, z: newZ };
		});
	}

	/**
	 * Apply rotation drag to objects.
	 * @param {Object[]} objects
	 * @param {Object} dragData - { mouse, startMouse, startQuaternions }
	 */
	applyRotateDrag (objects, dragData) {
		const { mouse, startMouse, startQuaternions } = dragData;

		const deltaX = mouse.x - startMouse.x;
		const deltaY = mouse.y - startMouse.y;

		const rotY = new THREE.Quaternion().setFromAxisAngle(
			new THREE.Vector3(0, 1, 0), deltaX * Math.PI * 2
		);
		const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
		const rotX = new THREE.Quaternion().setFromAxisAngle(cameraRight, -deltaY * Math.PI * 2);
		const combined = new THREE.Quaternion().multiplyQuaternions(rotX, rotY);

		objects.forEach((obj, i) => {
			const startQuat = startQuaternions[ i ];
			const newQuat = combined.clone().multiply(startQuat);

			if (this.grid.snapToGrid) {
				const euler = new THREE.Euler().setFromQuaternion(newQuat);
				const step = Math.PI / 8; // 22.5 degrees
				euler.x = Math.round(euler.x / step) * step;
				euler.y = Math.round(euler.y / step) * step;
				euler.z = Math.round(euler.z / step) * step;
				obj.mesh.quaternion.setFromEuler(euler);
			} else {
				obj.mesh.quaternion.copy(newQuat);
			}

			const finalEuler = new THREE.Euler().setFromQuaternion(obj.mesh.quaternion);
			obj.data.rotation = { x: finalEuler.x, y: finalEuler.y, z: finalEuler.z };
		});
	}

	/**
	 * Apply scale via scroll wheel.
	 * @param {Object[]} objects
	 * @param {THREE.Group|null} selectionGroup
	 * @param {number} deltaY
	 */
	applyScale (objects, selectionGroup, deltaY) {
		const scaleAmount = deltaY > 0 ? 0.95 : 1.05;

		if (objects.length > 1 && selectionGroup) {
			selectionGroup.scale.multiplyScalar(scaleAmount);
			selectionGroup.updateMatrixWorld(true);
		} else if (objects.length === 1) {
			const obj = objects[ 0 ];
			obj.mesh.scale.multiplyScalar(scaleAmount);
			obj.data.scale = {
				x: obj.mesh.scale.x,
				y: obj.mesh.scale.y,
				z: obj.mesh.scale.z
			};
		}
	}
}
