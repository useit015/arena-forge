# ARENA FORGE - Level Editor Documentation

A powerful, modern level editor for creating custom arena maps for your action game prototype.

![Arena Forge](https://img.shields.io/badge/Version-1.0.0-00ffff?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production-ff00ff?style=flat-square)

## Overview

Arena Forge is a professional-grade level editor that allows you to:

- **Create custom arena layouts** with an intuitive visual interface
- **Place and manipulate objects** using industry-standard 3D tools
- **Export/import levels** as JSON for use in your game
- **Build levels of any size** - no longer limited to the demo arena
- **Iterate quickly** with undo/redo, duplication, and grid snapping

## Getting Started

### Installation

1. Extract all files to your project directory
2. Install dependencies:

```bash
npm install
```

3. Run the editor:

```bash
npm run dev
```

4. Open the editor at `http://localhost:5173/`

### Development

To run linting and formatting:

```bash
# Lint code
npm run lint

# tailored fix
npm run lint:fix

# Format code
npm run format
```

### First Steps

1. **Place objects**: Click any object button in the left panel, then click in the viewport to place
2. **Select objects**: Click the Select tool (or press ESC), then click objects to select them
3. **Move objects**: Press G or click the Move tool, then drag the selected object
4. **Export your level**: Click "EXPORT" to save your level as JSON

## Interface Layout

### Header Bar

- **UNDO/REDO**: Navigate through your edit history (Ctrl+Z / Ctrl+Shift+Z)
- **EXPORT**: Save your level as a JSON file
- **IMPORT**: Load a previously saved level
- **CLEAR**: Delete all objects (with confirmation)

### Toolbar (Left Side)

- **Select Tool** (⌖): Click to select objects
- **Move Tool** (↔): Translate objects along X/Y/Z axes (Hotkey: G)
- **Rotate Tool** (⟲): Rotate objects (Hotkey: R)
- **Scale Tool** (⇔): Scale objects (Hotkey: S)
- **Toggle Grid** (#): Show/hide the ground grid
- **Snap to Grid** (⊞): Enable/disable grid snapping

### Object Panel

Browse and select objects to place:

**Basic Shapes**

- CUBE: Standard box/cover element
- CYLINDER: Round pillars or obstacles
- PLATFORM: Large flat surface
- WALL: Vertical barriers

**Gameplay**

- RAMP: Angled platforms for elevation changes
- COVER: Medium-sized tactical cover

**Decorative**

- NEON STRIP: Emissive strips for visual flair

### Properties Panel (Right Side)

Appears when an object is selected:

**Transform**

- X, Y, Z position coordinates

**Dimensions**

- Width, Height, Depth (actual size in units)

**Material**

- Choose from 8 different materials
- Includes emissive options for glowing elements

**Actions**

- Duplicate selected object
- Delete selected object

### Footer

- **Object Count**: Total objects in scene
- **Selected Info**: Currently selected object type

## Controls & Shortcuts

### Mouse Controls

| Action        | Control                  |
| ------------- | ------------------------ |
| Rotate Camera | Right Mouse + Drag       |
| Pan Camera    | Middle Mouse + Drag      |
| Zoom          | Scroll Wheel             |
| Select Object | Left Click               |
| Place Object  | Left Click (in Add mode) |

### Keyboard Shortcuts

| Shortcut             | Action                        |
| -------------------- | ----------------------------- |
| **ESC**              | Select tool / Deselect object |
| **G**                | Move tool                     |
| **R**                | Rotate tool                   |
| **S**                | Scale tool                    |
| **DELETE**           | Delete selected object        |
| **CTRL + D**         | Duplicate selected object     |
| **CTRL + Z**         | Undo                          |
| **CTRL + SHIFT + Z** | Redo                          |

## Workflow Guide

### Creating a Basic Arena

1. **Start with the floor**
   - Add multiple PLATFORM objects
   - Position them to create your play area
   - Use grid snap for alignment

2. **Add perimeter walls**
   - Place WALL objects around the edges
   - Rotate as needed for different orientations

3. **Create cover elements**
   - Place CUBE or CYLINDER objects throughout
   - Vary heights and sizes for interesting layouts
   - Use the Move tool to position precisely

4. **Add vertical gameplay**
   - Place elevated PLATFORM objects
   - Connect with RAMP objects
   - Ensure players can reach all areas

5. **Visual polish**
   - Add NEON STRIP objects for atmosphere
   - Use emissive materials for accents
   - Space them strategically for mood

6. **Export your level**
   - Click EXPORT
   - Save the JSON file
   - Load it in your game

### Best Practices

**Layout Design**

- Create clear sight lines for combat
- Provide multiple paths between areas
- Balance open spaces with tight corridors
- Add verticality for tactical depth

**Performance**

- Keep object count reasonable (< 200 for mobile, < 500 for desktop)
- Reuse similar shapes rather than creating unique ones
- Use larger platforms instead of many small pieces

**Gameplay**

- Leave room for sliding mechanics
- Ensure cover has gaps for throwing
- Test movement flow before finalizing
- Consider spawn points and objectives

## File Format

Exported levels use JSON format:

```json
{
  "objects": [
    {
      "id": "obj_1234567890_abc123",
      "data": {
        "type": "box",
        "position": { "x": 0, "y": 1, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 1, "y": 1, "z": 1 },
        "materialType": "obstacle",
        "size": { "width": 2, "height": 2, "depth": 2 }
      },
      "position": [0, 1, 0],
      "rotation": [0, 0, 0, "XYZ"],
      "scale": [1, 1, 1]
    }
  ]
}
```

### Loading Levels in Your Game

```javascript
import { LevelLoader } from './LevelLoader.js';

// Load exported JSON
const response = await fetch('levels/my_arena.json');
const levelData = await response.json();

// Create objects in your scene
const loader = new LevelLoader(scene, materials);
loader.loadLevel(levelData);
```

## Advanced Features

### Grid Snapping

- Toggle with the Snap button or in properties
- Adjustable grid size (default: 1 unit)
- Helps align objects perfectly

### Undo/Redo System

- Unlimited undo/redo (up to 50 actions)
- Preserves all object properties
- Works with all modifications

### Object Duplication

- Select an object
- Press Ctrl+D or click DUPLICATE
- Creates a copy offset from the original
- Preserves all properties including material

### Material System

8 built-in materials:

- **Floor**: Dark base surface
- **Obstacle**: Standard cover
- **Wall**: Vertical barriers
- **Platform**: Elevated surfaces
- **Metal Trim**: Metallic accents
- **Emissive Cyan**: Glowing cyan
- **Emissive Orange**: Glowing orange
- **Emissive Magenta**: Glowing magenta

### Transform Controls

Uses Three.js TransformControls for industry-standard manipulation:

- **Translate**: Drag arrows to move along axes
- **Rotate**: Drag circles to rotate around axes
- **Scale**: Drag boxes to scale along axes

## Troubleshooting

### Objects Not Appearing

- Check if object is below ground (Y position)
- Verify grid is visible
- Try zooming out (scroll wheel)

### Can't Select Objects

- Make sure Select tool is active (press ESC)
- Click directly on the object geometry
- Disable Transform Controls (press ESC)

### Export Not Working

- Check browser console for errors
- Verify you have objects in the scene
- Try a different browser

### Performance Issues

- Reduce object count
- Disable shadows in renderer settings
- Lower shadow map resolution
- Close other applications

## API Reference

### LevelEditor Class

```javascript
const editor = new LevelEditor(scene, camera, renderer);
```

#### Methods

**addObject(type, position)**

- Add a new object to the scene
- Returns: EditorObject

**deleteObject(editorObject)**

- Remove an object from the scene

**selectObject(editorObject)**

- Select an object for editing

**deselectObject()**

- Clear current selection

**duplicateObject(editorObject)**

- Create a copy of an object

**exportScene()**

- Returns: JSON string of entire scene

**importScene(jsonString)**

- Load a scene from JSON
- Returns: boolean (success)

**clearScene()**

- Remove all objects (with confirmation)

**undo()**

- Undo last action

**redo()**

- Redo previously undone action

**toggleGrid(visible)**

- Show/hide ground grid

**toggleSnapToGrid()**

- Enable/disable grid snapping
- Returns: boolean (new state)

#### Properties

**objects**: Array of all EditorObject instances
**selectedObject**: Currently selected EditorObject or null
**currentTool**: Current tool mode ('select', 'move', 'rotate', 'scale')
**snapToGrid**: Boolean for grid snapping
**gridSize**: Grid cell size in units

## Extending the Editor

### Adding New Object Types

Edit `src/core/LevelEditor.js` in the `addObject()` method:

```javascript
case 'my_object':
  geometry = new THREE.SphereGeometry(1, 16, 16);
  material = this.materials.obstacle;
  objectData.size = { radius: 1 };
  break;
```

Then add a button in `index.html`:

```html
<button class="object-btn" data-type="my_object">MY OBJECT</button>
```

### Adding New Materials

In `src/core/LevelEditor.js` `createMaterialsLibrary()`:

```javascript
myMaterial: new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  roughness: 0.5,
  metalness: 0.5,
});
```

### Custom Tools

Extend the Transform Controls or add new interaction modes in the `onPointerDown()` and `onKeyDown()` methods.

## Tips & Tricks

1. **Use layers**: Build your level in layers (floor → walls → obstacles → details)
2. **Symmetric design**: Create one side, then duplicate and mirror
3. **Test early**: Export frequently and test in your game
4. **Save versions**: Keep multiple versions of your level as you iterate
5. **Reference real maps**: Study successful game levels for inspiration
6. **Lighting placement**: Consider where lights will go while building
7. **Player scale**: Keep a reference object (like a 2-unit tall box) for player height

## Support & Feedback

For issues or suggestions:

1. Check the browser console for errors
2. Verify all files are correctly installed
3. Test in latest Chrome/Firefox
4. Report bugs with steps to reproduce

## License

MIT License.

---

**Built with Three.js** | **Designed for Action Games** | **Powered by WebGL**
