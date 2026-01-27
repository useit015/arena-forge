/**
 * Manages the scene tree panel UI showing all objects.
 */
export class SceneTreePanel {
	/**
	 * @param {HTMLElement} container - The scene tree container element
	 */
	constructor (container) {
		this.container = container;
		this.onSelect = null;
		this.onToggle = null;
		this.onDelete = null;
		this.onVisibility = null;
	}

	/**
	 * Set callback for object selection.
	 * @param {Function} callback - (object, shiftKey) => void
	 */
	setOnSelect (callback) {
		this.onSelect = callback;
	}

	/**
	 * Set callback for toggle selection.
	 * @param {Function} callback - (object) => void
	 */
	setOnToggle (callback) {
		this.onToggle = callback;
	}

	/**
	 * Set callback for delete.
	 * @param {Function} callback - (object) => void
	 */
	setOnDelete (callback) {
		this.onDelete = callback;
	}

	/**
	 * Set callback for visibility toggle.
	 * @param {Function} callback - (object) => void
	 */
	setOnVisibility (callback) {
		this.onVisibility = callback;
	}

	/**
	 * Populate the tree with objects.
	 * @param {Object[]} objects - All editor objects
	 * @param {Object[]} selectedObjects - Currently selected objects
	 */
	populate (objects, selectedObjects = []) {
		if (!this.container) return;

		this.container.innerHTML = '';

		if (objects.length === 0) {
			this.container.innerHTML = '<div class="empty-tree-msg">No objects in scene</div>';
			return;
		}

		objects.forEach(obj => {
			const item = document.createElement('div');
			item.className = 'tree-item';

			if (selectedObjects.includes(obj)) {
				item.classList.add('selected');
			}

			// Name
			const name = document.createElement('span');
			name.className = 'item-name';
			name.textContent = `${ obj.data.type } (${ obj.id.substring(obj.id.length - 4) })`;
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
