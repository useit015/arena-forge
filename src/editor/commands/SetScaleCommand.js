import { Command } from '../core/Command.js';
import * as THREE from 'three';

export class SetScaleCommand extends Command {
  constructor(editor, object, newScale, oldScale) {
    super(editor);
    this.type = 'SetScaleCommand';
    this.name = 'Set Scale';
    this.updatable = true;

    this.object = object;
    const mesh = object.mesh || object;
    this.newScale = newScale ? newScale.clone() : new THREE.Vector3();
    this.oldScale = oldScale ? oldScale.clone() : mesh ? mesh.scale.clone() : new THREE.Vector3();
  }

  execute() {
    const mesh = this.object.mesh || this.object;
    mesh.scale.copy(this.newScale);
    mesh.updateMatrixWorld(true);
    this.editor.signals.objectChanged.dispatch(mesh);
  }

  undo() {
    const mesh = this.object.mesh || this.object;
    mesh.scale.copy(this.oldScale);
    mesh.updateMatrixWorld(true);
    this.editor.signals.objectChanged.dispatch(mesh);
  }

  update(cmd) {
    this.newScale.copy(cmd.newScale);
  }

  toJSON() {
    const json = super.toJSON();
    json.objectUuid = this.object.id;
    json.oldScale = this.oldScale.toArray();
    json.newScale = this.newScale.toArray();
    return json;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.object = this.editor.objectById(json.objectUuid);
    this.oldScale = new THREE.Vector3().fromArray(json.oldScale);
    this.newScale = new THREE.Vector3().fromArray(json.newScale);
  }
}
