import { UIPanel, UIButton } from './libs/ui.js';

function Toolbar(editor) {
  const signals = editor.signals;

  const container = new UIPanel();
  container.setId('toolbar');

  // translate / rotate / scale

  const translateIcon = document.createElement('img');
  translateIcon.title = 'Translate (W)';
  translateIcon.src = 'images/translate.svg';

  const translate = new UIButton();
  translate.dom.className = 'Button selected';
  translate.dom.appendChild(translateIcon);
  translate.onClick(function () {
    signals.transformModeChanged.dispatch('translate');
  });
  container.add(translate);

  const rotateIcon = document.createElement('img');
  rotateIcon.title = 'Rotate (E)';
  rotateIcon.src = 'images/rotate.svg';

  const rotate = new UIButton();
  rotate.dom.appendChild(rotateIcon);
  rotate.onClick(function () {
    signals.transformModeChanged.dispatch('rotate');
  });
  container.add(rotate);

  const scaleIcon = document.createElement('img');
  scaleIcon.title = 'Scale (R)';
  scaleIcon.src = 'images/scale.svg';

  const scale = new UIButton();
  scale.dom.appendChild(scaleIcon);
  scale.onClick(function () {
    signals.transformModeChanged.dispatch('scale');
  });
  container.add(scale);

  //

  signals.transformModeChanged.add(function (mode) {
    translate.dom.classList.remove('selected');
    rotate.dom.classList.remove('selected');
    scale.dom.classList.remove('selected');

    switch (mode) {
      case 'translate':
        translate.dom.classList.add('selected');
        break;
      case 'rotate':
        rotate.dom.classList.add('selected');
        break;
      case 'scale':
        scale.dom.classList.add('selected');
        break;
    }
  });

  return container;
}

export { Toolbar };
