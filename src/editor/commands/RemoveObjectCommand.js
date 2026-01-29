import { Command } from '../core/Command.js';

export class RemoveObjectCommand extends Command {
  constructor(editor, object) {
    super(editor);
    this.type = 'RemoveObjectCommand';
    this.name = 'Remove Object';

    this.object = object;
    this.parent = object ? object.parent : null;
    this.index = -1;
  }

  execute() {
    if (this.object && this.parent) {
      this.index = this.parent.children.indexOf(this.object);
      this.editor.removeObject(this.object);
      this.editor.deselect();
    }
  }

  undo() {
    this.editor.addObject(this.object, this.parent, this.index);
    this.editor.select(this.object);
  }

  toJSON() {
    const json = super.toJSON();
    json.objectUuid = this.object.uuid;
    json.index = this.index;
    json.parentUuid = this.parent.uuid;
    return json;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.parent = this.editor.objectByUuid(json.parentUuid);
    this.index = json.index;
    this.object = this.editor.objectByUuid(json.objectUuid);
  }
}
