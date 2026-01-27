import * as THREE from 'three';

/**
 * Manages all input events (pointer, keyboard, wheel) for the editor.
 * Emits high-level events for the editor to handle.
 */
export class InputManager extends EventTarget {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {THREE.Camera} camera
	 */
	constructor (canvas, camera) {
		super();
		this.canvas = canvas;
		this.camera = camera;

		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();

		// Drag state
		this.isDragging = false;
		this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
		this.dragOffset = new THREE.Vector3();
		this.dragStartMouse = new THREE.Vector2();
		this.dragStartPositions = [];
		this.dragStartQuaternions = [];

		this.setupEventListeners();
	}

	/**
	 * Setup all event listeners.
	 */
	setupEventListeners () {
		this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
		this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
		this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
		this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false, capture: true });
		window.addEventListener('keydown', this.onKeyDown.bind(this));
	}

	/**
	 * Update mouse coordinates from event.
	 * @param {PointerEvent} event
	 */
	updateMouse (event) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
	}

	/**
	 * Raycast against objects.
	 * @param {THREE.Mesh[]} meshes - Meshes to raycast against
	 * @returns {THREE.Intersection[]}
	 */
	raycast (meshes) {
		this.raycaster.setFromCamera(this.mouse, this.camera);
		return this.raycaster.intersectObjects(meshes);
	}

	/**
	 * Get intersection point with ground plane.
	 * @param {number} height - Plane height (default 0)
	 * @returns {THREE.Vector3|null}
	 */
	getGroundIntersection (height = 0) {
		this.raycaster.setFromCamera(this.mouse, this.camera);
		const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -height);
		const point = new THREE.Vector3();
		const result = this.raycaster.ray.intersectPlane(plane, point);
		return result ? point : null;
	}

	/**
	 * Handle pointer down.
	 * @param {PointerEvent} event
	 */
	onPointerDown (event) {
		this.updateMouse(event);

		this.dispatchEvent(new CustomEvent('pointerDown', {
			detail: {
				mouse: this.mouse.clone(),
				shiftKey: event.shiftKey,
				ctrlKey: event.ctrlKey,
				button: event.button,
				originalEvent: event
			}
		}));
	}

	/**
	 * Handle pointer up.
	 * @param {PointerEvent} event
	 */
	onPointerUp (event) {
		const wasDragging = this.isDragging;
		this.isDragging = false;

		this.dispatchEvent(new CustomEvent('pointerUp', {
			detail: {
				wasDragging,
				originalEvent: event
			}
		}));
	}

	/**
	 * Handle pointer move.
	 * @param {PointerEvent} event
	 */
	onPointerMove (event) {
		this.updateMouse(event);

		if (this.isDragging) {
			this.dispatchEvent(new CustomEvent('drag', {
				detail: {
					mouse: this.mouse.clone(),
					startMouse: this.dragStartMouse.clone(),
					startPositions: this.dragStartPositions,
					startQuaternions: this.dragStartQuaternions,
					originalEvent: event
				}
			}));
		} else {
			this.dispatchEvent(new CustomEvent('pointerMove', {
				detail: {
					mouse: this.mouse.clone(),
					originalEvent: event
				}
			}));
		}
	}

	/**
	 * Handle wheel event.
	 * @param {WheelEvent} event
	 */
	onWheel (event) {
		this.dispatchEvent(new CustomEvent('wheel', {
			detail: {
				deltaY: event.deltaY,
				scaleDirection: event.deltaY > 0 ? -1 : 1,
				originalEvent: event
			}
		}));
	}

	/**
	 * Handle key down.
	 * @param {KeyboardEvent} event
	 */
	onKeyDown (event) {
		// Ignore when typing in inputs
		if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

		this.dispatchEvent(new CustomEvent('keyDown', {
			detail: {
				key: event.key.toLowerCase(),
				shiftKey: event.shiftKey,
				ctrlKey: event.ctrlKey || event.metaKey,
				originalEvent: event
			}
		}));
	}

	/**
	 * Start a drag operation.
	 * @param {THREE.Vector3} intersectionPoint
	 * @param {Object[]} selectedObjects
	 * @param {string} mode - 'move-x', 'move-y', or 'rotate'
	 */
	startDrag (intersectionPoint, selectedObjects, mode) {
		this.isDragging = true;
		this.dragStartMouse.copy(this.mouse);
		this.dragStartPositions = selectedObjects.map(obj => obj.mesh.position.clone());
		this.dragStartQuaternions = selectedObjects.map(obj => obj.mesh.quaternion.clone());

		// Set up drag plane based on mode
		if (mode === 'move-y') {
			// Vertical plane facing camera
			const cameraDir = new THREE.Vector3();
			this.camera.getWorldDirection(cameraDir);
			cameraDir.y = 0;
			cameraDir.normalize();
			this.dragPlane.setFromNormalAndCoplanarPoint(cameraDir.negate(), intersectionPoint);
		} else if (mode === 'move-x' || mode === 'select') {
			// Horizontal plane (XZ)
			this.dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), intersectionPoint);
		} else {
			// Rotate: camera-facing plane
			const cameraDir = new THREE.Vector3();
			this.camera.getWorldDirection(cameraDir);
			this.dragPlane.setFromNormalAndCoplanarPoint(cameraDir.negate(), intersectionPoint);
		}

		this.dragOffset.copy(intersectionPoint);
	}

	/**
	 * Get drag delta from current intersection.
	 * @returns {{ delta: THREE.Vector3, point: THREE.Vector3 }|null}
	 */
	getDragDelta () {
		this.raycaster.setFromCamera(this.mouse, this.camera);
		const point = new THREE.Vector3();
		const result = this.raycaster.ray.intersectPlane(this.dragPlane, point);

		if (result) {
			return {
				delta: new THREE.Vector3().subVectors(point, this.dragOffset),
				point
			};
		}
		return null;
	}

	/**
	 * Stop dragging.
	 */
	stopDrag () {
		this.isDragging = false;
		this.dragStartPositions = [];
		this.dragStartQuaternions = [];
	}

	/**
	 * Check if currently dragging.
	 * @returns {boolean}
	 */
	isDraggingActive () {
		return this.isDragging;
	}

	/**
	 * Dispose event listeners.
	 */
	dispose () {
		this.canvas.removeEventListener('pointerdown', this.onPointerDown);
		this.canvas.removeEventListener('pointermove', this.onPointerMove);
		this.canvas.removeEventListener('pointerup', this.onPointerUp);
		this.canvas.removeEventListener('wheel', this.onWheel);
		window.removeEventListener('keydown', this.onKeyDown);
	}
}
