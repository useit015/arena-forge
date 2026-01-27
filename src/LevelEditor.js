import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

import { MaterialsLibrary, ObjectFactory, SceneSerializer } from './core/index.js';
import { GridManager, SelectionManager, InputManager, DragController, PropertyUpdater } from './managers/index.js';
import { SceneTreePanel } from './ui/index.js';

/**
 * LevelEditor - Thin orchestrator that wires modules together.
 */
export class LevelEditor {
	constructor (scene, camera, renderer) {
		this.scene = scene;
		this.camera = camera;
		this.renderer = renderer;
		this.objects = [];
		this.currentTool = 'select';
		this.currentObjectType = 'box';

		// Initialize modules
		this.materials = new MaterialsLibrary();
		this.objectFactory = new ObjectFactory(this.materials);
		this.serializer = new SceneSerializer(50);
		this.serializer.setLoadSceneCallback((state) => this.loadScene(state));

		// Controls
		this.orbitControls = this.createOrbitControls();
		this.transformControl = this.createTransformControls();

		// Managers
		this.grid = new GridManager(scene, 100);
		this.selection = new SelectionManager(scene, this.transformControl, this.orbitControls);
		this.input = new InputManager(renderer.domElement, camera);
		this.drag = new DragController(this.grid, camera);
		this.propertyUpdater = new PropertyUpdater(this.materials);

		// UI
		this.sceneTree = new SceneTreePanel(document.getElementById('scene-tree'));

		// Setup
		this.setupLighting();
		this.wireEvents();
		this.setupSceneTreeCallbacks();

		// Backward compat references
		this.gridHelper = this.grid.gridHelper;
		this.snapToGrid = this.grid.snapToGrid;
		this.gridSize = this.grid.gridSize;
		this.selectedObjects = this.selection.selectedObjects;
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// CONTROLS SETUP
	// ─────────────────────────────────────────────────────────────────────────────

	createOrbitControls () {
		const controls = new OrbitControls(this.camera, this.renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.minDistance = 5;
		controls.maxDistance = 100;
		controls.maxPolarAngle = Math.PI / 2;
		return controls;
	}

	createTransformControls () {
		const tc = new TransformControls(this.camera, this.renderer.domElement);
		tc.setSpace('world');
		tc.addEventListener('dragging-changed', (e) => { this.orbitControls.enabled = !e.value; });
		tc.addEventListener('objectChange', () => {
			if (this.grid.snapToGrid && tc.mode === 'translate' && this.selection.getCount() === 1) {
				this.grid.snapObject(this.selection.getSelected()[ 0 ]);
			}
			this.syncSelectionToUI();
			this.saveState();
		});
		this.scene.add(tc);
		return tc;
	}

	setupLighting () {
		this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
		const dir = new THREE.DirectionalLight(0xffffff, 1.2);
		dir.position.set(10, 20, 10);
		dir.castShadow = true;
		dir.shadow.mapSize.set(2048, 2048);
		this.scene.add(dir);
		this.scene.fog = new THREE.FogExp2(0x0a0a14, 0.01);
		this.scene.background = new THREE.Color(0x0a0a14);
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// EVENT WIRING
	// ─────────────────────────────────────────────────────────────────────────────

	wireEvents () {
		this.input.addEventListener('pointerDown', (e) => this.onPointerDown(e.detail));
		this.input.addEventListener('pointerUp', () => this.onPointerUp());
		this.input.addEventListener('drag', (e) => this.onDrag(e.detail));
		this.input.addEventListener('wheel', (e) => this.onWheel(e.detail));
		this.input.addEventListener('keyDown', (e) => this.onKeyDown(e.detail));

		this.selection.addEventListener('selectionChanged', (e) => {
			window.dispatchEvent(new CustomEvent('objectSelected', {
				detail: { object: e.detail.last, selectedCount: e.detail.count }
			}));
			this.populateSceneTree();
		});

		this.selection.addEventListener('deselected', () => {
			window.dispatchEvent(new CustomEvent('objectDeselected'));
			this.populateSceneTree();
		});
	}

	setupSceneTreeCallbacks () {
		this.sceneTree.setOnSelect((obj) => { this.deselectAllObjects(); this.selectObject(obj); });
		this.sceneTree.setOnToggle((obj) => this.toggleObjectSelection(obj));
		this.sceneTree.setOnDelete((obj) => this.deleteObject(obj));
		this.sceneTree.setOnVisibility((obj) => this.toggleObjectVisibility(obj));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// INPUT HANDLERS
	// ─────────────────────────────────────────────────────────────────────────────

	onPointerDown ({ mouse, shiftKey }) {
		if (this.transformControl.dragging) return;
		this.input.raycaster.setFromCamera(mouse, this.camera);

		if (this.currentTool === 'add') {
			const pt = this.input.getGroundIntersection(0);
			if (pt) {
				if (this.grid.snapToGrid) this.grid.snapPosition(pt);
				this.grid.clampToGrid(pt);
				pt.y = this.objectFactory.getYOffset(this.currentObjectType);
				const obj = this.addObject(this.currentObjectType, pt);
				this.deselectAllObjects();
				this.selectObject(obj);
				this.setTool('move-x');
			}
			return;
		}

		const hits = this.input.raycast(this.objects.map(o => o.mesh));
		if (hits.length > 0) {
			const clicked = this.objects.find(o => o.mesh === hits[ 0 ].object);
			if (shiftKey) {
				this.toggleObjectSelection(clicked);
			} else {
				if (!this.selection.isSelected(clicked)) {
					this.deselectAllObjects();
					this.selectObject(clicked);
				}
				if ([ 'select', 'move-x', 'move-y', 'rotate' ].includes(this.currentTool)) {
					this.input.startDrag(hits[ 0 ].point, this.selection.getSelected(), this.currentTool);
					this.orbitControls.enabled = false;
				}
			}
		} else if (!shiftKey) {
			this.deselectAllObjects();
		}
	}

	onPointerUp () {
		this.input.stopDrag();
		if (this.selection.getCount() === 0) this.orbitControls.enabled = true;
	}

	onDrag (detail) {
		const sel = this.selection.getSelected();
		if (sel.length === 0) return;

		if ([ 'select', 'move-x', 'move-y' ].includes(this.currentTool)) {
			const data = this.input.getDragDelta();
			if (data) {
				this.drag.applyMoveDrag(sel, { delta: data.delta, startPositions: detail.startPositions }, this.currentTool);
				if (sel.length > 1) this.selection.updateGroupCenter();
				this.syncSelectionToUI();
			}
		} else if (this.currentTool === 'rotate') {
			this.drag.applyRotateDrag(sel, detail);
			this.syncSelectionToUI();
		}
	}

	onWheel ({ deltaY, originalEvent }) {
		const sel = this.selection.getSelected();
		if (sel.length === 0) return;
		originalEvent.preventDefault();
		originalEvent.stopPropagation();
		this.drag.applyScale(sel, this.selection.selectionGroup, deltaY);
		this.saveState();
		this.syncSelectionToUI();
	}

	onKeyDown ({ key, shiftKey, ctrlKey, originalEvent }) {
		switch (key) {
			case 'delete': case 'backspace':
				if (this.selection.getCount() > 0) { originalEvent.preventDefault(); this.deleteSelectedObjects(); }
				break;
			case 'g': this.setTool('move-x'); break;
			case 'v': case 'y': this.setTool('move-y'); break;
			case 'r': this.setTool('rotate'); break;
			case 'd':
				if (ctrlKey && this.selection.getCount() > 0) { originalEvent.preventDefault(); this.duplicateSelectedObjects(); }
				break;
			case 'z':
				if (ctrlKey) { originalEvent.preventDefault(); shiftKey ? this.redo() : this.undo(); }
				break;
			case 'a':
				if (ctrlKey) { originalEvent.preventDefault(); this.selectAllObjects(); }
				break;
			case 'escape': this.deselectAllObjects(); this.setTool('select'); break;
		}
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// OBJECT OPERATIONS
	// ─────────────────────────────────────────────────────────────────────────────

	addObject (type, pos = new THREE.Vector3()) {
		const obj = this.objectFactory.create(type, pos);
		this.scene.add(obj.mesh);
		this.objects.push(obj);
		this.saveState();
		window.dispatchEvent(new CustomEvent('objectAdded', { detail: obj }));
		this.populateSceneTree();
		return obj;
	}

	deleteObject (obj) {
		const idx = this.objects.indexOf(obj);
		if (idx > -1) {
			this.scene.remove(obj.mesh);
			this.objects.splice(idx, 1);
			this.selection.remove(obj);
			this.saveState();
			window.dispatchEvent(new CustomEvent('objectDeleted', { detail: obj }));
			this.populateSceneTree();
		}
	}

	deleteSelectedObjects () {
		[ ...this.selection.getSelected() ].forEach(o => this.deleteObject(o));
	}

	duplicateObject (obj) {
		const pos = new THREE.Vector3(obj.mesh.position.x + 2, obj.mesh.position.y, obj.mesh.position.z + 2);
		const dup = this.objectFactory.clone(obj, pos);
		this.scene.add(dup.mesh);
		this.objects.push(dup);
		this.saveState();
		window.dispatchEvent(new CustomEvent('objectAdded', { detail: dup }));
		this.populateSceneTree();
		return dup;
	}

	duplicateSelectedObjects () {
		const dups = this.selection.getSelected().map(o => this.duplicateObject(o));
		this.deselectAllObjects();
		dups.forEach(o => this.selectObject(o));
	}

	toggleObjectVisibility (obj) { obj.mesh.visible = !obj.mesh.visible; this.populateSceneTree(); }

	// ─────────────────────────────────────────────────────────────────────────────
	// SELECTION WRAPPERS
	// ─────────────────────────────────────────────────────────────────────────────

	selectObject (obj) {
		this.selection.select(obj);
		if (this.currentTool === 'select') this.setTool('move-x');
	}

	toggleObjectSelection (obj) { this.selection.toggle(obj); }
	deselectAllObjects () { this.selection.deselectAll(); if (this.currentTool !== 'select') this.setTool('select'); }
	selectAllObjects () { this.selection.selectAll(this.objects); }

	syncSelectionToUI () {
		const last = this.selection.getLast();
		if (last) {
			window.dispatchEvent(new CustomEvent('objectSelected', {
				detail: { object: last, selectedCount: this.selection.getCount() }
			}));
		}
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// PROPERTIES
	// ─────────────────────────────────────────────────────────────────────────────

	updateSelectedObjectProperty (prop, val) {
		if (this.selection.getCount() === 0) return;
		this.propertyUpdater.update(this.selection.getSelected()[ 0 ], prop, val);
		this.saveState();
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// TOOL & SETTINGS
	// ─────────────────────────────────────────────────────────────────────────────

	setTool (tool) {
		this.currentTool = tool;
		if (tool === 'move-x' || tool === 'move-y') this.transformControl.setMode('translate');
		else if (tool === 'rotate') this.transformControl.setMode('rotate');
		else this.transformControl.detach();
		if (tool === 'select' && this.selection.getCount() > 0) this.deselectAllObjects();
		window.dispatchEvent(new CustomEvent('toolChanged', { detail: { tool } }));
	}

	toggleGrid (visible) { this.grid.setVisible(visible); }
	toggleSnapToGrid () { this.snapToGrid = this.grid.toggleSnap(); return this.snapToGrid; }
	updateGridSize (size) { this.grid.updateSize(size, this.objects); this.gridSize = this.grid.gridSize; this.saveState(); }

	toggleSkybox (enabled) {
		const color = enabled ? 0x87ceeb : 0x0a0a14;
		this.scene.background = new THREE.Color(color);
		this.scene.fog.color.set(color);
		this.scene.fog.density = enabled ? 0.005 : 0.01;
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// UNDO/REDO & SERIALIZATION
	// ─────────────────────────────────────────────────────────────────────────────

	saveState () { this.serializer.saveState(this.objects); }
	undo () { this.serializer.undo(); }
	redo () { this.serializer.redo(); }

	loadScene (state) {
		this.objects.forEach(o => this.scene.remove(o.mesh));
		this.objects = [];
		this.deselectAllObjects();
		state.objects.forEach(s => {
			const obj = this.objectFactory.create(s.data.type, new THREE.Vector3().fromArray(s.position), s.id);
			obj.mesh.rotation.fromArray(s.rotation);
			obj.mesh.scale.fromArray(s.scale);
			obj.data = JSON.parse(JSON.stringify(s.data));
			if (this.materials.has(s.data.materialType)) obj.mesh.material = this.materials.get(s.data.materialType);
			this.scene.add(obj.mesh);
			this.objects.push(obj);
		});
		this.populateSceneTree();
	}

	exportScene () { return this.serializer.exportToJSON(this.objects); }
	importScene (json) { const s = this.serializer.parseJSON(json); if (s) { this.loadScene(s); this.saveState(); return true; } return false; }
	clearScene () { if (confirm('Clear all objects? This cannot be undone.')) { this.objects.forEach(o => this.scene.remove(o.mesh)); this.objects = []; this.deselectAllObjects(); this.saveState(); this.populateSceneTree(); } }
	serializeScene () { return this.serializer.serializeObjects(this.objects); }

	// ─────────────────────────────────────────────────────────────────────────────
	// UI & UPDATE
	// ─────────────────────────────────────────────────────────────────────────────

	populateSceneTree () { this.sceneTree.populate(this.objects, this.selection.getSelected()); }

	updateContextControls () {
		const tb = document.getElementById('context-toolbar');
		if (!tb) return;
		if (this.selection.getCount() === 0) { tb.classList.add('hidden'); return; }
		tb.classList.remove('hidden');
		const pos = this.selection.getCount() === 1
			? new THREE.Vector3().setFromMatrixPosition(this.selection.getSelected()[ 0 ].mesh.matrixWorld)
			: this.selection.selectionGroup.position.clone();
		pos.y += 2;
		const sp = pos.project(this.camera);
		const r = this.renderer.domElement.getBoundingClientRect();
		tb.style.left = `${ (sp.x * 0.5 + 0.5) * r.width }px`;
		tb.style.top = `${ (-sp.y * 0.5 + 0.5) * r.height }px`;
		tb.style.transform = 'translate(-50%, -100%)';
	}

	update (delta) {
		this.orbitControls?.update();
		this.updateContextControls();
		this.selectedObjects = this.selection.selectedObjects;
		this.gridHelper = this.grid.gridHelper;
	}
}
