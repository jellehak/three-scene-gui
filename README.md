Fast and lightweight tool for debugging your THREE scene

# Usage

```js
import { SceneGui } from "three-scene-gui"; // Or CDN

// ThreeJs Boilerplate
import { Viewport } from "./Viewport.js";
const viewport = new Viewport().expose();
const { scene, THREE } = viewport;

const gui = null; // null will autoload lil-gui from cdn
const sceneGui = new SceneGui(gui, { scene, THREE });
sceneGui.mount();

{
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
}

{
  const mesh = new THREE.AxesHelper(100);
  scene.add(mesh);
}
```
