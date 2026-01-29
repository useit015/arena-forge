import { Command } from '../core/Command.js';

/**
 * AddAssetCommand - Handles adding new assets to the AssetRegistry.
 */
export class AddAssetCommand extends Command {
  constructor(editor, assetId, assetData) {
    super(editor);
    this.type = 'AddAssetCommand';
    this.name = assetId ? `Add Asset: ${assetId}` : 'Add Asset';

    this.assetId = assetId;
    this.assetData = assetData;
  }

  execute() {
    this.editor.assets.register(this.assetId, this.assetData);
  }

  undo() {
    this.editor.assets.unregister(this.assetId);
  }

  toJSON() {
    const json = super.toJSON();
    json.assetId = this.assetId;
    json.assetData = this.assetData;
    return json;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.assetId = json.assetId;
    this.assetData = json.assetData;
  }
}
