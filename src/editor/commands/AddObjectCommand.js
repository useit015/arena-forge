import * as THREE from 'three';
import { Command } from '../core/Command.js';

export class AddObjectCommand extends Command {
  constructor(editor, objectOrType, position) {
    super(editor);
    this.type = 'AddObjectCommand';

    if (typeof objectOrType === 'string') {
      this.objectType = objectOrType;
      this.object = null;
      this.name = `Add ${objectOrType}`;
    } else {
      this.objectType = null;
      this.object = objectOrType;
      this.name = `Add Object`;
    }

    this.position = position ? position.clone() : new THREE.Vector3();
  }

  execute() {
    if (this.object === null) {
      const factoryResult = this.editor.objectFactory.create(this.objectType, this.position);
      this.object = factoryResult.mesh;
      this.object.userData = factoryResult.data;
      this.object.name = `Object_${factoryResult.id}`;
    }

    this.editor.addObject(this.object);
    this.editor.select(this.object);
  }

  undo() {
    this.editor.removeObject(this.object);
    this.editor.deselect();
  }

  toJSON() {
    const json = super.toJSON();
    json.objectType = this.objectType;
    json.position = this.position.toArray();
    if (this.object) json.uuid = this.object.id;
    return json;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.objectType = json.objectType;
    this.name = `Add ${this.objectType}`;
    this.position = new THREE.Vector3().fromArray(json.position);
  }
}
