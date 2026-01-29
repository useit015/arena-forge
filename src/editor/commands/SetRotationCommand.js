import { Command } from '../core/Command.js';
import * as THREE from 'three';

export class SetRotationCommand extends Command {
  constructor(editor, object, newRotation, oldRotation) {
    super(editor);
    this.type = 'SetRotationCommand';
    this.name = 'Set Rotation';
    this.updatable = true;

    this.object = object;
    const mesh = object.mesh || object;
    this.newRotation = newRotation ? newRotation.clone() : new THREE.Euler();
    this.oldRotation = oldRotation
      ? oldRotation.clone()
      : mesh
        ? mesh.rotation.clone()
        : new THREE.Euler();
  }

  execute() {
    const mesh = this.object.mesh || this.object;
    mesh.rotation.copy(this.newRotation);
    mesh.updateMatrixWorld(true);
    this.editor.signals.objectChanged.dispatch(mesh);
  }

  undo() {
    const mesh = this.object.mesh || this.object;
    mesh.rotation.copy(this.oldRotation);
    mesh.updateMatrixWorld(true);
    this.editor.signals.objectChanged.dispatch(mesh);
  }

  update(cmd) {
    this.newRotation.copy(cmd.newRotation);
  }

  toJSON() {
    const json = super.toJSON();
    json.objectUuid = this.object.id;
    json.oldRotation = [
      this.oldRotation.x,
      this.oldRotation.y,
      this.oldRotation.z,
      this.oldRotation.order,
    ];
    json.newRotation = [
      this.newRotation.x,
      this.newRotation.y,
      this.newRotation.z,
      this.newRotation.order,
    ];
    return json;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.object = this.editor.objectById(json.objectUuid);
    this.oldRotation = new THREE.Euler().fromArray(json.oldRotation);
    this.newRotation = new THREE.Euler().fromArray(json.newRotation);
  }
}
