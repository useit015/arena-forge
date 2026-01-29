import * as THREE from '/Users/oussmustaine/smkr/arena-forge/node_modules/three/build/three.webgpu.js';

// Bridge WebGLRenderer to WebGPURenderer for r170 compatibility
export const WebGLRenderer = THREE.WebGPURenderer;

// Re-export everything from the WebGPU build
export * from '/Users/oussmustaine/smkr/arena-forge/node_modules/three/build/three.webgpu.js';

// Constants Shim (ensure CamelCase versions are available if they aren't already)
export const NeutralToneMapping =
  THREE.NeutralToneMapping !== undefined ? THREE.NeutralToneMapping : 7;
export const ACESFilmicToneMapping =
  THREE.ACESFilmicToneMapping !== undefined ? THREE.ACESFilmicToneMapping : 4;
export const AgXToneMapping = THREE.AgXToneMapping !== undefined ? THREE.AgXToneMapping : 6;
export const CineonToneMapping =
  THREE.CineonToneMapping !== undefined ? THREE.CineonToneMapping : 3;
export const ReinhardToneMapping =
  THREE.ReinhardToneMapping !== undefined ? THREE.ReinhardToneMapping : 2;
export const LinearToneMapping =
  THREE.LinearToneMapping !== undefined ? THREE.LinearToneMapping : 1;
export const NoToneMapping = THREE.NoToneMapping !== undefined ? THREE.NoToneMapping : 0;

export const PCFShadowMap = THREE.PCFShadowMap !== undefined ? THREE.PCFShadowMap : 1;
export const PCFSoftShadowMap = THREE.PCFSoftShadowMap !== undefined ? THREE.PCFSoftShadowMap : 2;
export const VSMShadowMap = THREE.VSMShadowMap !== undefined ? THREE.VSMShadowMap : 3;
export const BasicShadowMap = THREE.BasicShadowMap !== undefined ? THREE.BasicShadowMap : 0;

// Attach to global THREE for legacy code that expects it
if (typeof window !== 'undefined') {
  window.THREE = {
    ...THREE,
    WebGLRenderer,
    NeutralToneMapping,
    ACESFilmicToneMapping,
    AgXToneMapping,
    CineonToneMapping,
    ReinhardToneMapping,
    LinearToneMapping,
    NoToneMapping,
    PCFShadowMap,
    PCFSoftShadowMap,
    VSMShadowMap,
    BasicShadowMap,
  };
}

export default THREE;
