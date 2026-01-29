import * as THREE from 'three';

/**
 * TextureManager - Handles procedural texture generation and loading.
 * Provides high-quality procedural maps for materials without external assets.
 */
export class TextureManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.textures = new Map();
    this.loader = new THREE.TextureLoader();
  }

  /**
   * Get a cached texture or create/load it.
   * @param {string} id - Unique identifier for the texture
   * @param {Function} creatorFn - Function to create the texture if missing
   * @returns {THREE.Texture}
   */
  get(id, creatorFn) {
    if (this.textures.has(id)) {
      return this.textures.get(id);
    }
    if (creatorFn) {
      const texture = creatorFn();
      texture.name = id;
      this.textures.set(id, texture);
      return texture;
    }
    return null;
  }

  /**
   * Create a high-quality grid texture.
   * @param {Object} options
   * @param {number} [options.width=1024]
   * @param {number} [options.height=1024]
   * @param {string} [options.color='#ffffff']
   * @param {string} [options.bgColor='#000000']
   * @param {number} [options.thickness=2]
   * @param {number} [options.divisions=10]
   * @returns {THREE.CanvasTexture}
   */
  createGridTexture({
    width = 1024,
    height = 1024,
    color = '#ffffff',
    bgColor = '#000000',
    thickness = 2,
    divisions = 10,
  } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;

    const stepX = width / divisions;
    const stepY = height / divisions;

    ctx.beginPath();

    // Vertical lines
    for (let i = 0; i <= divisions; i++) {
      const x = i * stepX;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    // Horizontal lines
    for (let i = 0; i <= divisions; i++) {
      const y = i * stepY;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }

    ctx.stroke();

    // Add border for seamless tiling
    ctx.lineWidth = thickness * 2;
    ctx.strokeRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = this.renderer.capabilities
      ? this.renderer.capabilities.getMaxAnisotropy()
      : 1;

    return texture;
  }

  /**
   * Create a Perlin-like noise texture (simple implementation).
   * Good for roughness or bump maps / concrete.
   * @param {Object} options
   * @param {number} [options.width=512]
   * @param {number} [options.scale=4]
   * @returns {THREE.CanvasTexture}
   */
  createNoiseTexture({ width = 512, height = 512, scale = 1, intensity = 255 } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const idata = ctx.createImageData(width, height);
    const buffer32 = new Uint32Array(idata.data.buffer);

    for (let i = 0; i < buffer32.length; i++) {
      const v = Math.random() * intensity;
      buffer32[i] = (255 << 24) | (v << 16) | (v << 8) | v;
    }

    ctx.putImageData(idata, 0, 0);

    // Blur for "cloudy" look if scale > 1 (simulated by drawing scaled up)
    if (scale > 1) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width / scale;
      tempCanvas.height = height / scale;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tempCanvas, 0, 0, width, height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
  }

  /**
   * Create a normal map from a height map texture (source canvas).
   * @param {HTMLCanvasElement} sourceCanvas
   * @param {number} strength
   * @returns {THREE.CanvasTexture}
   */
  createNormalMap(sourceCanvas, strength = 1.0) {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    const ctx = sourceCanvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const outCtx = canvas.getContext('2d');
    const outImgData = outCtx.createImageData(width, height);
    const outData = outImgData.data;

    const getVal = (x, y) => {
      x = (x + width) % width;
      y = (y + height) % height;
      const idx = (y * width + x) * 4;
      return data[idx] / 255.0; // Greyscale value 0-1
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // Sobel filter
        const tl = getVal(x - 1, y - 1);
        const t = getVal(x, y - 1);
        const tr = getVal(x + 1, y - 1);
        const l = getVal(x - 1, y);
        const r = getVal(x + 1, y);
        const bl = getVal(x - 1, y + 1);
        const b = getVal(x, y + 1);
        const br = getVal(x + 1, y + 1);

        const dX = tr + 2 * r + br - (tl + 2 * l + bl);
        const dY = bl + 2 * b + br - (tl + 2 * t + tr);
        const dZ = 1.0 / strength;

        const vec = new THREE.Vector3(dX, dY, dZ).normalize();

        outData[idx] = (vec.x * 0.5 + 0.5) * 255;
        outData[idx + 1] = (vec.y * 0.5 + 0.5) * 255;
        outData[idx + 2] = (vec.z * 0.5 + 0.5) * 255;
        outData[idx + 3] = 255;
      }
    }

    outCtx.putImageData(outImgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
  }

  /**
   * Generate a cautionary hazard stripe texture.
   */
  createHazardTexture() {
    return this.get('hazard_albedo', () => {
      const width = 512;
      const height = 512;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#FFD700'; // Yellow
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#101010'; // Black
      const stripeWidth = 64;

      // Draw diagonal stripes
      for (let i = -height; i < width + height; i += stripeWidth * 2) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + stripeWidth, 0);
        ctx.lineTo(i + stripeWidth - height, height);
        ctx.lineTo(i - height, height);
        ctx.fill();
      }

      // Add grunge
      const noise = this.createNoiseTexture({ width: 512, height: 512, scale: 2, intensity: 50 });
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(noise.image, 0, 0);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = this.renderer.capabilities
        ? this.renderer.capabilities.getMaxAnisotropy()
        : 1;

      return texture;
    });
  }

  dispose() {
    this.textures.forEach((t) => t.dispose());
    this.textures.clear();
  }
}
