/**
 * EditorEvents - A simple pub-sub event bus for the Arena-Forge Editor.
 * Decouples the editor core from UI and other systems.
 */
export class EditorEvents {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Dispatch an event.
   * @param {string} event
   * @param {any} data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach((callback) => callback(data));
  }
}

export const editorEvents = new EditorEvents();
