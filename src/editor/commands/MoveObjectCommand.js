import { Command } from '../core/Command.js';

/**
 * MoveObjectCommand - Handles parenting and reordering of objects in the scene graph.
 */
export class MoveObjectCommand extends Command {
  constructor(editor, object, newParent, newBefore) {
    super(editor);
    this.type = 'MoveObjectCommand';
    this.name = 'Move Object';

    this.object = object;
    const mesh = object.mesh || object;
    this.oldParent = mesh.parent;
    this.oldBefore = this.getPreviousObject(object);

    this.newParent = newParent;
    this.newBefore = newBefore;
  }

  getPreviousObject(object) {
    const mesh = object.mesh || object;
    if (!mesh) return null;
    const parent = mesh.parent;
    if (!parent) return null;
    const index = parent.children.indexOf(object.mesh);
    if (index === 0) return null;

    // Find editor object associated with previous child if any
    for (let i = index - 1; i >= 0; i--) {
      const sibling = parent.children[i];
      const edObj = this.editor.objects.find((o) => o.mesh === sibling); // This relies on wrappers having .mesh
      if (edObj) return edObj; // Return wrapper
    }
    return null;
  }

  execute() {
    this.editor.events.emit('sceneGraphBeforeChanged');

    const mesh = this.object.mesh || this.object;
    const parent = this.newParent ? this.newParent.mesh || this.newParent : this.editor.scene;
    const beforeMesh = this.newBefore ? this.newBefore.mesh || this.newBefore : null;

    if (beforeMesh) {
      const index = parent.children.indexOf(beforeMesh);
      parent.children.splice(index, 0, mesh);
      mesh.parent = parent;
    } else {
      parent.add(mesh);
    }

    this.editor.signals.sceneGraphChanged.dispatch();
  }

  undo() {
    this.editor.events.emit('sceneGraphBeforeChanged');

    const mesh = this.object.mesh || this.object;
    const parent = this.oldParent;
    const beforeMesh = this.oldBefore ? this.oldBefore.mesh || this.oldBefore : null;

    if (beforeMesh) {
      const index = parent.children.indexOf(beforeMesh);
      parent.children.splice(index, 0, mesh);
      mesh.parent = parent;
    } else {
      parent.add(mesh);
    }

    this.editor.signals.sceneGraphChanged.dispatch();
  }

  toJSON() {
    const json = super.toJSON();
    json.objectUuid = this.object.id;
    json.newParentUuid = this.newParent && this.newParent.id ? this.newParent.id : null;
    json.newBeforeUuid = this.newBefore && this.newBefore.id ? this.newBefore.id : null;
    json.oldParentUuid = this.oldParent && this.oldParent.id ? this.oldParent.id : null;
    json.oldBeforeUuid = this.oldBefore && this.oldBefore.id ? this.oldBefore.id : null;
    return json;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.object = this.editor.objectById(json.objectUuid);
    this.newParent = json.newParentUuid
      ? this.editor.objectById(json.newParentUuid)
      : this.editor.scene;
    this.newBefore = json.newBeforeUuid ? this.editor.objectById(json.newBeforeUuid) : null;
    this.oldParent = json.oldParentUuid
      ? this.editor.objectById(json.oldParentUuid)
      : this.editor.scene;
    this.oldBefore = json.oldBeforeUuid ? this.editor.objectById(json.oldBeforeUuid) : null;
  }
}
