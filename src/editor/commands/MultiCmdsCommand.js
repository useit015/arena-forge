import * as Commands from './Commands.js';
import { Command } from '../core/Command.js';

/**
 * MultiCmdsCommand - Groups multiple commands into a single undoable step.
 */
export class MultiCmdsCommand extends Command {
  constructor(editor, commands = []) {
    super(editor);
    this.type = 'MultiCmdsCommand';
    this.name = 'Multiple Actions';
    this.commands = commands;
  }

  execute() {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo() {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  toJSON() {
    const json = super.toJSON();
    json.commands = this.commands.map((cmd) => cmd.toJSON());
    return json;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.commands = (json.commands || [])
      .map((cmdJSON) => {
        const CmdClass = Commands[cmdJSON.type];
        if (!CmdClass) return null;
        const cmd = new CmdClass(this.editor);
        cmd.fromJSON(cmdJSON);
        return cmd;
      })
      .filter((c) => c !== null);
  }
}
