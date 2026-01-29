/**
 * Manages the scene tree panel UI showing all objects.
 */
export class SceneTreePanel {
  /**
   * @param {Object} editor - The editor instance
   * @param {HTMLElement} container - The scene tree container element
   */
  constructor(editor, container) {
    this.editor = editor;
    this.container = container;
    this.onSelect = null;
    this.onToggle = null;
    this.onDelete = null;
    this.onVisibility = null;
    this.onReorder = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const refresh = () => this.populate(this.editor.objects, this.editor.selection.getSelected());

    this.editor.signals.objectAdded.add(refresh);
    this.editor.signals.objectRemoved.add(refresh);
    this.editor.signals.objectSelected.add(refresh);
    this.editor.signals.sceneGraphChanged.add(refresh);
  }

  /**
   * Set callback for object reordering.
   * @param {Function} callback - (draggedId, targetId) => void
   */
  setOnReorder(callback) {
    this.onReorder = callback;
  }

  /**
   * Set callback for object selection.
   * @param {Function} callback - (object, shiftKey) => void
   */
  setOnSelect(callback) {
    this.onSelect = callback;
  }

  /**
   * Set callback for toggle selection.
   * @param {Function} callback - (object) => void
   */
  setOnToggle(callback) {
    this.onToggle = callback;
  }

  /**
   * Set callback for delete.
   * @param {Function} callback - (object) => void
   */
  setOnDelete(callback) {
    this.onDelete = callback;
  }

  /**
   * Set callback for visibility toggle.
   * @param {Function} callback - (object) => void
   */
  setOnVisibility(callback) {
    this.onVisibility = callback;
  }

  /**
   * Populate the tree with objects.
   * @param {Object[]} objects - All editor objects
   * @param {Object[]} selectedObjects - Currently selected objects
   */
  populate(objects, selectedObjects = []) {
    if (!this.container) return;

    this.container.innerHTML = '';

    if (objects.length === 0) {
      this.container.innerHTML = '<div class="empty-tree-msg">No objects in scene</div>';
      return;
    }

    objects.forEach((obj) => {
      const item = document.createElement('div');
      item.className = 'tree-item';
      item.draggable = true;

      if (selectedObjects.includes(obj)) {
        item.classList.add('selected');
      }

      // Name
      const name = document.createElement('span');
      name.className = 'item-name';
      name.textContent = `${obj.data.type} (${obj.id.substring(obj.id.length - 4)})`;
      item.appendChild(name);

      // Actions container
      const actions = document.createElement('div');
      actions.className = 'item-actions';

      // Visibility button
      const visBtn = document.createElement('button');
      visBtn.className = 'tree-action-btn';
      visBtn.innerHTML = obj.mesh.visible ? '👁' : '👁‍🗨';
      visBtn.title = obj.mesh.visible ? 'Hide' : 'Show';
      visBtn.onclick = (e) => {
        e.stopPropagation();
        this.onVisibility?.(obj);
      };
      actions.appendChild(visBtn);

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className = 'tree-action-btn danger';
      delBtn.innerHTML = '✕';
      delBtn.title = 'Delete';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        this.onDelete?.(obj);
      };
      actions.appendChild(delBtn);

      item.appendChild(actions);

      // Drag & Drop handlers
      item.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', obj.id);
        e.dataTransfer.effectAllowed = 'move';
        item.classList.add('dragging');
      };

      item.ondragend = () => {
        item.classList.remove('dragging');
      };

      item.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        item.classList.add('drag-over');
      };

      item.ondragleave = () => {
        item.classList.remove('drag-over');
      };

      item.ondrop = (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId !== obj.id) {
          this.onReorder?.(draggedId, obj.id);
        }
      };

      // Click handler
      item.onclick = (e) => {
        if (e.shiftKey) {
          this.onToggle?.(obj);
        } else {
          this.onSelect?.(obj);
        }
      };

      this.container.appendChild(item);
    });
  }
}
