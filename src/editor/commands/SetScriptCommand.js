import { Command } from '../core/Command.js';

/**
 * SetScriptCommand - Handles adding or updating a script on an object.
 */
export class SetScriptCommand extends Command {
  constructor(editor, object, script, oldScript = null) {
    super(editor);
    this.type = 'SetScriptCommand';
    this.name = 'Set Script';

    this.object = object;
    this.script = script;
    this.oldScript = oldScript;
    this.name = script ? `Set Script: ${script.name || 'Script'}` : 'Set Script';
  }

  execute() {
    if (this.oldScript) {
      this.editor.scripts.remove(this.object, this.oldScript);
    }
    this.editor.scripts.add(this.object, this.script);
  }

  undo() {
    this.editor.scripts.remove(this.object, this.script);
    if (this.oldScript) {
      this.editor.scripts.add(this.object, this.oldScript);
    }
  }

  toJSON() {
    const json = super.toJSON();
    json.objectUuid = this.object.id;
    json.script = this.script;
    json.oldScript = this.oldScript;
    return json;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.object = this.editor.objectById(json.objectUuid);
    this.script = json.script;
    this.oldScript = json.oldScript;
  }
}
