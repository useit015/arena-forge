import { UIPanel } from './libs/ui.js';
import { MenubarAdd } from './menubar/Menubar.Add.js';
import { MenubarEdit } from './menubar/Menubar.Edit.js';
import { MenubarFile } from './menubar/Menubar.File.js';
import { MenubarStatus } from './menubar/Menubar.Status.js';
import { MenubarView } from './menubar/Menubar.View.js';

function Menubar(editor) {
  const container = new UIPanel();
  container.setId('menubar');

  container.add(new MenubarFile(editor));
  container.add(new MenubarEdit(editor));
  container.add(new MenubarAdd(editor));
  container.add(new MenubarView(editor));

  container.add(new MenubarStatus(editor));

  return container;
}

export { Menubar };
