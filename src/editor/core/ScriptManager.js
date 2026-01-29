/**
 * ScriptManager - Manages JavaScript behaviors attached to scene objects.
 * Similar to the Three.js Editor's scripting system.
 */
export class ScriptManager {
  constructor(editor) {
    this.editor = editor;
    this.scripts = new Map(); // Map<objectUuid, Array<Script>>
    this.running = false;
  }

  /**
   * Attach a script to an object.
   */
  add(object, script) {
    if (!this.scripts.has(object.id)) {
      this.scripts.set(object.id, []);
    }
    this.scripts.get(object.id).push(script);
    this.editor.events.emit('scriptAdded', { object, script });
  }

  /**
   * Remove a script from an object.
   */
  remove(object, script) {
    if (this.scripts.has(object.id)) {
      const arr = this.scripts.get(object.id);
      const idx = arr.indexOf(script);
      if (idx > -1) {
        arr.splice(idx, 1);
        this.editor.events.emit('scriptRemoved', { object, script });
      }
    }
  }

  /**
   * Run all scripts (Game Mode).
   */
  start() {
    this.running = true;
    // Compile and initialize scripts here
  }

  stop() {
    this.running = false;
  }

  update() {
    if (!this.running) return;
    // Logic to execute script update functions
  }

  toJSON() {
    const json = {};
    this.scripts.forEach((scripts, uuid) => {
      json[uuid] = scripts;
    });
    return json;
  }

  fromJSON(json) {
    this.scripts = new Map(Object.entries(json));
  }
}
