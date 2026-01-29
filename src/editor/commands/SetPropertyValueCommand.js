import { Command } from '../core/Command.js';

export class SetPropertyValueCommand extends Command {
  constructor(editor, object, property, newValue, oldValue) {
    super(editor);
    this.type = 'SetPropertyValueCommand';
    this.name = property ? `Set ${property}` : 'Set Property';
    this.updatable = true;

    this.object = object;
    this.property = property;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  execute() {
    this.editor.propertyUpdater.update(this.object, this.property, this.newValue);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  undo() {
    this.editor.propertyUpdater.update(this.object, this.property, this.oldValue);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  update(cmd) {
    this.newValue = cmd.newValue;
  }

  toJSON() {
    const json = super.toJSON();
    json.objectUuid = this.object.id;
    json.property = this.property;
    json.oldValue = this.oldValue;
    json.newValue = this.newValue;
    return json;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.object = this.editor.objectById(json.objectUuid);
    this.property = json.property;
    this.oldValue = json.oldValue;
    this.newValue = json.newValue;
  }
}
