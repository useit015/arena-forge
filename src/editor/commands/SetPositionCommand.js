import { Command } from '../core/Command.js';
import * as THREE from 'three';

export class SetPositionCommand extends Command {
  constructor(editor, object, newPosition, oldPosition) {
    super(editor);
    this.type = 'SetPositionCommand';
    this.name = 'Set Position';
    this.updatable = true;

    this.object = object;
    const mesh = object.mesh || object;
    this.newPosition = newPosition ? newPosition.clone() : new THREE.Vector3();
    this.oldPosition = oldPosition
      ? oldPosition.clone()
      : mesh
        ? mesh.position.clone()
        : new THREE.Vector3();
  }

  execute() {
    const mesh = this.object.mesh || this.object;
    mesh.position.copy(this.newPosition);
    mesh.updateMatrixWorld(true);
    this.editor.signals.objectChanged.dispatch(mesh);
  }

  undo() {
    const mesh = this.object.mesh || this.object;
    mesh.position.copy(this.oldPosition);
    mesh.updateMatrixWorld(true);
    this.editor.signals.objectChanged.dispatch(mesh);
  }

  update(cmd) {
    this.newPosition.copy(cmd.newPosition);
  }

  toJSON() {
    const json = super.toJSON();
    json.objectUuid = this.object.id;
    json.oldPosition = this.oldPosition.toArray();
    json.newPosition = this.newPosition.toArray();
    return json;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.object = this.editor.objectById(json.objectUuid);
    this.oldPosition = new THREE.Vector3().fromArray(json.oldPosition);
    this.newPosition = new THREE.Vector3().fromArray(json.newPosition);
  }
}
