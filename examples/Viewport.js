import * as THREE from "three";

// import { OrbitControls } from "./three.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.140.0/examples/jsm/controls/OrbitControls.js";

export class Viewport {
  constructor() {
    this.THREE = THREE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);
    // scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      10000000
    );
    // camera.position.set(400, 200, 0);
    camera.position.z = 5;
    // controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled

    {
      const ambientLight = new THREE.AmbientLight();
      scene.add(ambientLight);
    }
    //

    window.addEventListener("resize", onWindowResize);

    this.camera = camera;
    this.scene = scene;
    this.controls = controls;
    this.renderer = renderer;

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate.bind(this));

      controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

      render();
    }

    function render() {
      renderer.render(scene, camera);
    }

    //render(); // remove when using next line for animation loop (requestAnimationFrame)
    animate();
  }

  expose() {
    window.viewport = this;
    window.scene = this.scene;
    return this
  }
}
