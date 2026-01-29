import { PropertiesPanel } from './panels/PropertiesPanel.js';
import { SceneTreePanel } from './panels/SceneTreePanel.js';
import { NotificationManager } from './NotificationManager.js';
import * as THREE from 'three';
import { SetPropertyValueCommand } from '../commands/SetPropertyValueCommand.js';

/**
 * UIManager - Central orchestrator for the Editor UI.
 * Handles toolbar, asset panel, and coordinates other panels via signals.
 */
export class UIManager {
  constructor (editor) {
    this.editor = editor;

    // Initialize Panels
    this.propertiesPanel = new PropertiesPanel(
      editor,
      document.getElementById('properties-section')
    );
    this.sceneTree = new SceneTreePanel(editor, document.getElementById('scene-tree'));

    this.setupSceneTree();
    this.init();
  }

  setupSceneTree () {
    this.sceneTree.setOnSelect((obj) => {
      this.editor.deselectAllObjects();
      this.editor.selectObject(obj);
    });

    this.sceneTree.setOnToggle((obj) => {
      this.editor.toggleObjectSelection(obj);
    });

    this.sceneTree.setOnDelete((obj) => {
      this.editor.deleteObject(obj);
    });

    this.sceneTree.setOnVisibility((obj) => {
      this.editor.toggleObjectVisibility(obj);
    });

    this.sceneTree.setOnReorder((draggedId, targetId) => {
      this.editor.reorderObject(draggedId, targetId);
    });
  }

  init () {
    this.setupToolbar();
    this.setupObjectPanel();
    this.setupPropertiesPanel();
    this.setupFileMenu();
    this.setupEditorListeners();

    this.toggleTransformTools(false);
    this.syncToggleButtons();
  }

  setupEditorListeners () {
    this.editor.signals.objectSelected.add((object) => {
      this.toggleTransformTools(object !== null);
    });

    this.editor.signals.toolChanged.add((tool) => {
      this.updateToolButtons(`tool-${ tool }`);
      this.updateAppContainerMode(tool);
    });

    this.editor.signals.historyChanged.add(() => {
      // Could update undo/redo button enabled states here
    });
  }

  updateAppContainerMode (tool) {
    const appContainer = document.getElementById('app-container');
    const canvasContainer = document.getElementById('canvas-container');

    if (tool === 'add') {
      appContainer?.classList.remove('hide-objects');
      canvasContainer.className = 'add-mode';
    } else {
      appContainer?.classList.add('hide-objects');
      canvasContainer.className = 'select-mode';
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TOOLBAR
  // ───────────────────────────────────────────────────────────────────────────

  // ───────────────────────────────────────────────────────────────────────────
  // TOOLBAR
  // ───────────────────────────────────────────────────────────────────────────

  setupToolbar () {
    // Toolbar is handled by standard Toolbar.js

    // Grid/Snap
    document.getElementById('toggle-grid')?.addEventListener('click', (e) => {
      // Editor.js doesn't have grid visibility toggle built-in efficiently exposed
      // We can toggle the signal
      const visible = !e.currentTarget.classList.contains('active');
      this.editor.signals.showHelpersChanged.dispatch({ gridHelper: visible });
      e.currentTarget.classList.toggle('active', visible);
    });

    document.getElementById('toggle-snap')?.addEventListener('click', (e) => {
      // Snap is handled by TransformControls
      // We store state in editor logic or just toggle UI?
      // Viewport.js logic needs to know snap state for Add Object?
      // We can set a property on editor
      this.editor.grid = this.editor.grid || {};
      this.editor.grid.snapToGrid = !this.editor.grid.snapToGrid;
      const snap = this.editor.grid.snapToGrid;

      // Dispatch signal for TransformControls
      this.editor.signals.snapChanged.dispatch(snap ? 1 : null); // Simple toggle 1 unit

      e.currentTarget.classList.toggle('active', snap);
      NotificationManager.show(`Snap to grid: ${ snap ? 'ON' : 'OFF' }`, 'info');
    });

    document.getElementById('map-size-input')?.addEventListener('change', () => {
      // Update Grid Helper?
      // Standard Editor GridHelper is fixed size?
      // We skip this for now or recreate grid helper in Viewport
    });

    document.getElementById('skybox-toggle')?.addEventListener('change', (e) => {
      // editor.toggleSkybox(e.target.checked);
      // Standard Editor uses sceneBackgroundChanged
      const enabled = e.target.checked;
      const color = enabled ? 0x87ceeb : 0x0a0a14;
      this.editor.signals.sceneBackgroundChanged.dispatch('Color', color);
      // Fog?
      this.editor.signals.sceneFogChanged.dispatch(
        'FogExp2',
        color,
        0.002,
        100,
        enabled ? 0.002 : 0.01
      );
    });

    // Context toolbar
    this.setupContextToolbar();
  }

  setupContextToolbar () {
    document.getElementById('context-delete')?.addEventListener('click', () => {
      const object = this.editor.selected;
      if (object) {
        this.editor.removeObject(object);
        this.editor.deselect();
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // OBJECT PANEL
  // ───────────────────────────────────────────────────────────────────────────

  setupObjectPanel () {
    document.querySelectorAll('.object-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.editor.currentObjectType = btn.dataset.type;
        this.updateObjectButtons(btn);
        NotificationManager.show(`Active shape: ${ this.editor.currentObjectType }`, 'info');

        // If we click an object type, maybe we want to switch to 'add' tool?
        // But typically user selects tool separately.
        // For better UX, let's switch to 'add' tool if not already?
        // editor.signals.toolChanged.dispatch('add');
      });
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROPERTIES PANEL
  // ───────────────────────────────────────────────────────────────────────────

  setupPropertiesPanel () {
    // Import SetPropertyValueCommand dynamically or rely on global?
    // UIManager doesn't import it. We validly need it.
    // NOTE: We rely on SetPropertyValueCommand being available or imported.
    // Since we can't easily add import to top of this file without messing up,
    // We'll trust the packager or add import in next step.
    // For now assuming we need to add import.

    this.propertiesPanel.setOnChange((property, value) => {
      const object = this.editor.selected;
      if (!object) return;

      // We need SetPropertyValueCommand.
      // We will assume it is imported.

      // Old Value Calculation
      let oldValue = null;
      const data = object.userData;

      switch (property) {
        case 'x':
          oldValue = object.position.x;
          break;
        case 'y':
          oldValue = object.position.y;
          break;
        case 'z':
          oldValue = object.position.z;
          break;
        case 'rot-x':
          oldValue = THREE.MathUtils.radToDeg(object.rotation.x);
          break;
        case 'rot-y':
          oldValue = THREE.MathUtils.radToDeg(object.rotation.y);
          break;
        case 'rot-z':
          oldValue = THREE.MathUtils.radToDeg(object.rotation.z);
          break;
        case 'width':
          oldValue = data.size.width * object.scale.x;
          break;
        // ... (simplified for brevity, PropertyUpdater handles logic mostly)
        default:
          oldValue = data[ property ];
          break;
      }

      // Ideally we query PropertyUpdater or object for old value more robustly
      // For now, simpler: we execute command.

      // Since we can't import class here easily in replace block without top-level,
      // We will use a wrapper function or modifying the file header.
      if (oldValue !== value) {
        const cmd = new SetPropertyValueCommand(this.editor, object, property, value, oldValue);
        this.editor.execute(cmd);
      }
    });

    document.getElementById('delete-object')?.addEventListener('click', () => {
      const object = this.editor.selected;
      if (object) {
        this.editor.removeObject(object);
        this.editor.deselect();
      }
    });

    document.getElementById('duplicate-object')?.addEventListener('click', () => {
      const object = this.editor.selected;
      if (object) {
        // Clone Mesh
        const newMesh = object.clone();
        // Ensure pure userData clone
        newMesh.userData = JSON.parse(JSON.stringify(object.userData));

        // Offset position
        newMesh.position.addScalar(2);
        newMesh.userData.position = {
          x: newMesh.position.x,
          y: newMesh.position.y,
          z: newMesh.position.z,
        };

        import('../commands/AddObjectCommand.js').then(({ AddObjectCommand }) => {
          this.editor.execute(new AddObjectCommand(this.editor, newMesh));
        });
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FILE MENU
  // ───────────────────────────────────────────────────────────────────────────

  setupFileMenu () {
    document.getElementById('export-scene')?.addEventListener('click', () => {
      const json = JSON.stringify(this.editor.toJSON());
      const blob = new Blob([ json ], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `level_${ Date.now() }.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('import-scene')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const json = JSON.parse(event.target.result);
          this.editor.fromJSON(json);
          NotificationManager.show('Scene imported successfully!', 'success');
        };
        reader.readAsText(e.target.files[ 0 ]);
      };
      input.click();
    });

    document.getElementById('clear-scene')?.addEventListener('click', () => {
      if (confirm('Clear Scene?')) {
        this.editor.clear();
      }
    });

    document.getElementById('undo')?.addEventListener('click', () => this.editor.undo());
    document.getElementById('redo')?.addEventListener('click', () => this.editor.redo());
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UI HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  updateToolButtons (activeId) {
    document.querySelectorAll('.tool-btn').forEach((btn) => btn.classList.remove('active'));
    document.getElementById(activeId)?.classList.add('active');
  }

  updateObjectButtons (activeBtn) {
    document.querySelectorAll('.object-btn').forEach((btn) => btn.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  toggleTransformTools (enabled) {
    [ 'tool-move-x', 'tool-move-y', 'tool-rotate' ].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = !enabled;
        btn.classList.toggle('disabled', !enabled);
      }
    });
  }

  syncToggleButtons () {
    // Sync based on editor state?
  }
}
