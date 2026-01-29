/**
 * Persistent configuration for the Level Editor.
 * Stores settings like grid size, snapping, and shortcuts in LocalStorage.
 */
export class Config {
  constructor() {
    this.name = 'arena-forge-config';

    this.settings = {
      language: 'en',
      'editor/grid/size': 100,
      'editor/grid/snap': true,
      'editor/gizmo/size': 0.8,
      'editor/theme': 'dark',
      'editor/shortcuts/translate': 'g',
      'editor/shortcuts/rotate': 'r',
      'editor/shortcuts/scale': 's',
      'editor/shortcuts/undo': 'z',
      'editor/shortcuts/redo': 'y',
      'editor/shortcuts/duplicate': 'd',
      'editor/shortcuts/delete': 'delete',
    };

    this.load();
  }

  load() {
    if (window.localStorage[this.name] !== undefined) {
      const data = JSON.parse(window.localStorage[this.name]);
      for (const key in data) {
        this.settings[key] = data[key];
      }
    } else {
      this.save();
    }
  }

  save() {
    window.localStorage[this.name] = JSON.stringify(this.settings);
  }

  getKey(key) {
    return this.settings[key];
  }

  setKey(key, value) {
    this.settings[key] = value;
    this.save();
  }

  clear() {
    delete window.localStorage[this.name];
  }
}
