import * as THREE from 'three';
import { LevelEditor } from './src/LevelEditor.js';
import { PropertiesPanel, NotificationManager } from './src/ui/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// SCENE SETUP
// ─────────────────────────────────────────────────────────────────────────────

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(12, 12, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

const editor = new LevelEditor(scene, camera, renderer);

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION LOOP
// ─────────────────────────────────────────────────────────────────────────────

const clock = new THREE.Clock();

function animate () {
  requestAnimationFrame(animate);
  editor.update(clock.getDelta());
  renderer.render(scene, camera);
}
animate();

// ─────────────────────────────────────────────────────────────────────────────
// WINDOW RESIZE
// ─────────────────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// ─────────────────────────────────────────────────────────────────────────────
// UI CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

class EditorUI {
  constructor (editor) {
    this.editor = editor;
    this.propertiesPanel = new PropertiesPanel(document.getElementById('properties-section'));
    this.init();
  }

  init () {
    this.setupToolbar();
    this.setupObjectPanel();
    this.setupPropertiesPanel();
    this.setupFileMenu();
    this.setupEventListeners();
    this.toggleTransformTools(false);
    this.syncToggleButtons();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TOOLBAR
  // ───────────────────────────────────────────────────────────────────────────

  setupToolbar () {
    const toolButtons = {
      'tool-select': () => { this.editor.setTool('select'); this.setContainerMode('select-mode'); },
      'tool-add': () => this.editor.setTool('add'),
      'tool-move-x': () => { this.editor.setTool('move-x'); this.setContainerMode('select-mode'); },
      'tool-move-y': () => { this.editor.setTool('move-y'); this.setContainerMode('select-mode'); },
      'tool-rotate': () => { this.editor.setTool('rotate'); this.setContainerMode('select-mode'); }
    };

    Object.entries(toolButtons).forEach(([ id, handler ]) => {
      document.getElementById(id)?.addEventListener('click', () => {
        handler();
        this.updateToolButtons(id);
        if ([ 'tool-move-x', 'tool-move-y', 'tool-rotate' ].includes(id)) {
          this.clearObjectSelection();
        }
      });
    });

    // Grid toggle
    document.getElementById('toggle-grid')?.addEventListener('click', (e) => {
      const visible = !this.editor.gridHelper.visible;
      this.editor.toggleGrid(visible);
      e.currentTarget.classList.toggle('active', visible);
    });

    // Snap toggle
    document.getElementById('toggle-snap')?.addEventListener('click', (e) => {
      const snap = this.editor.toggleSnapToGrid();
      e.currentTarget.classList.toggle('active', snap);
      NotificationManager.show(`Snap to grid: ${ snap ? 'ON' : 'OFF' }`, 'info');
    });

    // Map size
    document.getElementById('map-size-input')?.addEventListener('change', (e) => {
      this.editor.updateGridSize(e.target.value);
    });

    // Skybox
    document.getElementById('skybox-toggle')?.addEventListener('change', (e) => {
      this.editor.toggleSkybox(e.target.checked);
      NotificationManager.show(`Skybox: ${ e.target.checked ? 'ON' : 'OFF' }`, 'info');
    });

    // Context toolbar
    this.setupContextToolbar();
  }

  setupContextToolbar () {
    const contextButtons = {
      'context-move-x': 'move-x',
      'context-move-y': 'move-y',
      'context-rotate': 'rotate'
    };

    Object.entries(contextButtons).forEach(([ id, tool ]) => {
      document.getElementById(id)?.addEventListener('click', () => {
        this.editor.setTool(tool);
        this.updateToolButtons(`tool-${ tool }`);
        this.updateContextButtons(id);
      });
    });

    document.getElementById('context-delete')?.addEventListener('click', () => {
      this.editor.deleteSelectedObjects();
    });
  }

  syncToggleButtons () {
    document.getElementById('toggle-grid')?.classList.toggle('active', this.editor.gridHelper?.visible);
    document.getElementById('toggle-snap')?.classList.toggle('active', this.editor.snapToGrid);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // OBJECT PANEL
  // ───────────────────────────────────────────────────────────────────────────

  setupObjectPanel () {
    document.querySelectorAll('.object-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.editor.currentObjectType = btn.dataset.type;
        this.updateObjectButtons(btn);
        NotificationManager.show(`Active shape: ${ this.editor.currentObjectType }`, 'info');
      });
    });
  }

  clearObjectSelection () {
    document.querySelectorAll('.object-btn').forEach(btn => btn.classList.remove('active'));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROPERTIES PANEL
  // ───────────────────────────────────────────────────────────────────────────

  setupPropertiesPanel () {
    this.propertiesPanel.setOnChange((property, value) => {
      this.editor.updateSelectedObjectProperty(property, value);
    });

    // Delete button
    document.getElementById('delete-object')?.addEventListener('click', () => {
      if (this.editor.selectedObjects?.length > 0) {
        this.editor.deleteSelectedObjects();
      }
    });

    // Duplicate button
    document.getElementById('duplicate-object')?.addEventListener('click', () => {
      if (this.editor.selectedObjects?.length > 0) {
        this.editor.duplicateSelectedObjects();
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FILE MENU
  // ───────────────────────────────────────────────────────────────────────────

  setupFileMenu () {
    // Export
    document.getElementById('export-scene')?.addEventListener('click', () => {
      const json = this.editor.exportScene();
      const blob = new Blob([ json ], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `level_${ Date.now() }.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import
    document.getElementById('import-scene')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const success = this.editor.importScene(event.target.result);
          NotificationManager.show(
            success ? 'Scene imported successfully!' : 'Failed to import scene',
            success ? 'success' : 'error'
          );
        };
        reader.readAsText(e.target.files[ 0 ]);
      };
      input.click();
    });

    // Clear
    document.getElementById('clear-scene')?.addEventListener('click', () => {
      this.editor.clearScene();
    });

    // Undo/Redo
    document.getElementById('undo')?.addEventListener('click', () => this.editor.undo());
    document.getElementById('redo')?.addEventListener('click', () => this.editor.redo());
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT LISTENERS
  // ───────────────────────────────────────────────────────────────────────────

  setupEventListeners () {
    window.addEventListener('objectSelected', (e) => {
      const detail = e.detail;
      this.propertiesPanel.update(detail.object, detail.selectedCount);
      this.toggleTransformTools(true);
    });

    window.addEventListener('objectDeselected', () => {
      this.propertiesPanel.hide();
      this.toggleTransformTools(false);
    });

    window.addEventListener('toolChanged', (e) => {
      const tool = e.detail.tool;
      this.updateToolButtons(`tool-${ tool }`);

      const appContainer = document.getElementById('app-container');
      const canvasContainer = document.getElementById('canvas-container');

      if (tool === 'add') {
        appContainer?.classList.remove('hide-objects');
        canvasContainer.className = 'add-mode';
      } else {
        appContainer?.classList.add('hide-objects');
        canvasContainer.className = 'select-mode';
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UI HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  setContainerMode (mode) {
    document.getElementById('canvas-container').className = mode;
  }

  updateToolButtons (activeId) {
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeId)?.classList.add('active');
  }

  updateObjectButtons (activeBtn) {
    document.querySelectorAll('.object-btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  updateContextButtons (activeId) {
    document.querySelectorAll('.context-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeId)?.classList.add('active');
  }

  toggleTransformTools (enabled) {
    [ 'tool-move-x', 'tool-move-y', 'tool-rotate' ].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = !enabled;
        btn.classList.toggle('disabled', !enabled);
      }
    });

    if (!enabled && [ 'move-x', 'move-y', 'rotate' ].includes(this.editor.currentTool)) {
      this.editor.setTool('select');
    }
  }
}

// Initialize UI
const ui = new EditorUI(editor);

// Debug access
window.editor = editor;
