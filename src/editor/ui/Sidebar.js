import { UITabbedPanel, UISpan } from './libs/ui.js';

import { SidebarScene } from './sidebar/Sidebar.Scene.js';
import { SidebarProperties } from './sidebar/Sidebar.Properties.js';
import { SidebarProject } from './sidebar/Sidebar.Project.js';
import { SidebarSettings } from './sidebar/Sidebar.Settings.js';

function Sidebar(editor) {
  const container = new UITabbedPanel();
  container.setId('sidebar');

  const sidebarProperties = new SidebarProperties(editor);

  const scene = new UISpan().add(new SidebarScene(editor), sidebarProperties);
  const project = new SidebarProject(editor);
  const settings = new SidebarSettings(editor);

  container.addTab('scene', 'SCENE', scene);
  container.addTab('project', 'PROJECT', project);
  container.addTab('settings', 'SETTINGS', settings);
  container.select('scene');

  const sidebarPropertiesResizeObserver = new ResizeObserver(function () {
    sidebarProperties.tabsDiv.setWidth(getComputedStyle(container.dom).width);
  });

  sidebarPropertiesResizeObserver.observe(container.tabsDiv.dom);

  return container;
}

export { Sidebar };
