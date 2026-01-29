import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Factory for creating editor objects with consistent geometry and materials.
 */
export class ObjectFactory {
  /**
   * @param {import('./MaterialsLibrary').MaterialsLibrary} materialsLibrary
   */
  constructor(materialsLibrary) {
    this.materials = materialsLibrary;
  }

  /**
   * Object type configurations defining geometry, material, and Y offset.
   */
  static OBJECT_TYPES = {
    // ─ BASICS ─────────────────────────────────────────────────────────────
    box: {
      createGeometry: () => new THREE.BoxGeometry(2, 2, 2),
      material: 'obstacle',
      size: { width: 2, height: 2, depth: 2 },
      yOffset: 1,
    },
    cylinder: {
      createGeometry: () => new THREE.CylinderGeometry(1, 1, 3, 32),
      material: 'obstacle',
      size: { radius: 1, height: 3 },
      yOffset: 1.5,
    },
    cone: {
      createGeometry: () => new THREE.CylinderGeometry(0, 1, 2, 32),
      material: 'obstacle',
      size: { radius: 1, height: 2 },
      yOffset: 1,
    },
    ring: {
      createGeometry: () => new THREE.TorusGeometry(1, 0.3, 16, 32),
      material: 'emissiveCyan',
      size: { radius: 1, tube: 0.3 },
      yOffset: 1.3,
      defaultRotation: { x: Math.PI / 2, y: 0, z: 0 },
    },

    // ─ ARCHITECTURE ───────────────────────────────────────────────────────
    platform: {
      createGeometry: () => new THREE.BoxGeometry(5, 0.5, 5),
      material: 'platform',
      size: { width: 5, height: 0.5, depth: 5 },
      yOffset: 0.25,
    },
    wall: {
      createGeometry: () => new THREE.BoxGeometry(0.3, 3, 5),
      material: 'wall',
      size: { width: 0.3, height: 3, depth: 5 },
      yOffset: 1.5,
    },
    corner: {
      createGeometry: () => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(3, 0);
        shape.lineTo(3, 0.3);
        shape.lineTo(0.3, 0.3);
        shape.lineTo(0.3, 3);
        shape.lineTo(0, 3);
        shape.lineTo(0, 0);
        // Extrude vertical
        const geom = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false });
        geom.rotateX(-Math.PI / 2); // Orient correctly
        geom.translate(-1.5, 1.5, 1.5); // Center
        return geom;
      },
      material: 'wall',
      size: { width: 3, height: 3, depth: 3 },
      yOffset: 1.5,
    },
    pillar: {
      createGeometry: () => new THREE.CylinderGeometry(0.6, 0.6, 4, 8),
      material: 'scifiWall',
      size: { radius: 0.6, height: 4 },
      yOffset: 2,
    },
    arch: {
      createGeometry: () => {
        const shape = new THREE.Shape();
        const outerRadius = 2.5;
        const innerRadius = 2.0;

        shape.absarc(0, 0, outerRadius, 0, Math.PI, false);
        shape.lineTo(-innerRadius, 0);
        shape.absarc(0, 0, innerRadius, Math.PI, 0, true);
        shape.lineTo(outerRadius, 0);

        const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false });
        geom.translate(0, 0, -0.25); // Center depth
        return geom;
      },
      material: 'wall',
      size: { width: 5, height: 2.5, depth: 0.5 },
      yOffset: 0, // Base is at 0
    },

    // ─ MOVEMENT ───────────────────────────────────────────────────────────
    ramp: {
      createGeometry: () => new THREE.BoxGeometry(4, 0.3, 6),
      material: 'platform',
      size: { width: 4, height: 0.3, depth: 6 },
      yOffset: 0.9,
      defaultRotation: { x: Math.PI / 12, y: 0, z: 0 },
    },
    wedge: {
      createGeometry: () => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(4, 0);
        shape.lineTo(4, 2);
        shape.lineTo(0, 0);

        const geom = new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false });
        geom.translate(-2, 0, -2);
        return geom;
      },
      material: 'gridOrange',
      size: { width: 4, height: 2, depth: 4 },
      yOffset: 0,
    },
    stairs: {
      createGeometry: () => {
        const steps = 8;
        const width = 4;
        const height = 4;
        const depth = 6;

        const geometries = [];
        const stepHeight = height / steps;
        const stepDepth = depth / steps;

        for (let i = 0; i < steps; i++) {
          const box = new THREE.BoxGeometry(width, stepHeight, stepDepth);
          // Position: Centered X, Stacked Y, Staggered Z
          // BufferGeometry positions are centered.
          // We need to translate each box so they form stairs.

          // Y: Bottom of box needs to be at previous height.
          // Center Y = (i * stepHeight) + (stepHeight / 2)
          // But we want the whole object centered at (0, height/2, 0) eventually or (0,0,0) locally?
          // Let's build it from (0,0,0) as bottom-center-back

          // Let's assume the pivot is center of the bounding box of the whole stairs.
          // Whole stairs: W=4, H=4, D=6. Center is (0, 2, 0) relative to bottom-center.

          const y = i * stepHeight + stepHeight / 2 - height / 2;
          const z = i * stepDepth - depth / 2 + stepDepth / 2;

          box.translate(0, y, z);
          geometries.push(box);
        }

        const merged = BufferGeometryUtils.mergeGeometries(geometries);
        return merged;
      },
      material: 'gridCyan',
      size: { width: 4, height: 4, depth: 6 },
      yOffset: 0,
    },

    // ─ DECORATIVE ─────────────────────────────────────────────────────────
    emissive_strip: {
      createGeometry: () => new THREE.BoxGeometry(0.2, 0.1, 3),
      material: 'emissiveCyan',
      size: { width: 0.2, height: 0.1, depth: 3 },
      yOffset: 0.05,
    },
  };

  /**
   * Get Y offset for an object type (for placement on grid).
   * @param {string} type
   * @returns {number}
   */
  getYOffset(type) {
    return ObjectFactory.OBJECT_TYPES[type]?.yOffset ?? 1;
  }

  /**
   * Create an editor object with mesh and data.
   * @param {string} type - Object type
   * @param {THREE.Vector3} position - World position
   * @param {string} [id] - Optional ID (generated if not provided)
   * @returns {{ id: string, mesh: THREE.Mesh, data: Object }}
   */
  create(type, position, id = null) {
    const config = ObjectFactory.OBJECT_TYPES[type] || ObjectFactory.OBJECT_TYPES.box;

    const geometry = config.createGeometry();
    const material = this.materials.get(config.material);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(position);

    // Apply default rotation if defined
    if (config.defaultRotation) {
      mesh.rotation.set(
        config.defaultRotation.x,
        config.defaultRotation.y,
        config.defaultRotation.z
      );
    }

    const data = {
      type,
      position: { x: position.x, y: position.y, z: position.z },
      rotation: config.defaultRotation ? { ...config.defaultRotation } : { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      materialType: config.material,
      size: { ...config.size },
      customData: {},
    };

    return {
      id: id || this.generateId(),
      mesh,
      data,
    };
  }

  /**
   * Clone an existing editor object.
   * @param {Object} editorObject
   * @param {THREE.Vector3} newPosition
   * @returns {{ id: string, mesh: THREE.Mesh, data: Object }}
   */
  clone(editorObject, newPosition) {
    const newObj = this.create(editorObject.data.type, newPosition);

    // Copy transform
    newObj.mesh.rotation.copy(editorObject.mesh.rotation);
    newObj.mesh.scale.copy(editorObject.mesh.scale);

    // Deep copy data
    newObj.data = JSON.parse(JSON.stringify(editorObject.data));
    newObj.data.position = { x: newPosition.x, y: newPosition.y, z: newPosition.z };

    // Apply material
    if (this.materials.has(editorObject.data.materialType)) {
      newObj.mesh.material = this.materials.get(editorObject.data.materialType);
    }

    return newObj;
  }

  /**
   * Generate unique object ID.
   * @returns {string}
   */
  generateId() {
    return 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get available object types.
   * @returns {string[]}
   */
  getTypes() {
    return Object.keys(ObjectFactory.OBJECT_TYPES);
  }
}
