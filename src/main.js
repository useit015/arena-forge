import { WebGLRenderer } from 'three';
import { Editor } from './editor/core/Editor.js';
import { Menubar } from './editor/ui/Menubar.js';
import { Sidebar } from './editor/ui/Sidebar.js';
import { Toolbar } from './editor/ui/Toolbar.js';
import { Viewport } from './editor/ui/Viewport.js';
// import { LevelEditor } from './core/LevelEditor.js'; // REMOVED

window.URL = window.URL || window.webkitURL;
window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;

const editor = new Editor();

const viewport = new Viewport(editor);
document.body.appendChild(viewport.dom);

const toolbar = new Toolbar(editor);
document.body.appendChild(toolbar.dom);

const menubar = new Menubar(editor);
document.body.appendChild(menubar.dom);

const sidebar = new Sidebar(editor);
document.body.appendChild(sidebar.dom);

// Renderer initialization
(async function () {
  const renderer = new WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
  if (renderer.init) await renderer.init();

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  editor.signals.rendererCreated.dispatch(renderer);

  // Editor State
  editor.currentObjectType = 'box';
  editor.currentTool = 'select'; // select, translate, rotate, scale, add

  // Initialize Game Systems
  // We attach these to the editor instance so Commands can access them
  const { MaterialsLibrary, ObjectFactory, PropertyUpdater, TextureManager } =
    await import('./game/index.js');

  const textureManager = new TextureManager(renderer);
  const materialsLib = new MaterialsLibrary(textureManager);
  const objFactory = new ObjectFactory(materialsLib); // eslint-disable-line no-unused-vars
  const propertyUpdater = new PropertyUpdater(materialsLib); // eslint-disable-line no-unused-vars
  // editor.propertyUpdater = new PropertyUpdater(editor.materials); // LevelEditor.js used this
  // However, SetPropertyValueCommand uses editor.propertyUpdater.
  editor.propertyUpdater = new PropertyUpdater(editor.materials);

  // Initial Scene Setup (if needed) or Just let the editor handle it.
  // LevelEditor.js had a specialized loadSceneCallback, but standard Editor uses editor.fromJSON
  // For now, we start empty or we can add a default object.

  // Animation Loop - only start once renderer is ready
  function animate() {
    requestAnimationFrame(animate);
    editor.signals.rendererUpdated.dispatch();
  }

  // Storage & Autosave
  editor.storage.init(function () {
    editor.storage.get(function (state) {
      if (state !== undefined) {
        editor.fromJSON(state);
      }

      const selected = editor.config.getKey('project/selected');

      if (selected !== undefined) {
        editor.selectByUuid(selected);
      }
    });

    // Autosave
    setTimeout(function () {
      editor.storage.set(editor.toJSON());
    }, 1000);

    let saveTimeout;

    function saveState() {
      clearTimeout(saveTimeout);

      saveTimeout = setTimeout(function () {
        editor.storage.set(editor.toJSON());
      }, 1000);
    }

    const signals = editor.signals;

    signals.geometryChanged.add(saveState);
    signals.objectAdded.add(saveState);
    signals.objectChanged.add(saveState);
    signals.objectRemoved.add(saveState);
    signals.materialChanged.add(saveState);
    signals.sceneBackgroundChanged.add(saveState);
    signals.sceneEnvironmentChanged.add(saveState);
    signals.sceneFogChanged.add(saveState);
    signals.sceneGraphChanged.add(saveState);
    signals.scriptChanged.add(saveState);
    signals.historyChanged.add(saveState);
  });

  animate();
})();
