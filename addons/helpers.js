export const HELPERS = [
  "ArrowHelper",
  "AxesHelper",
  "BoxHelper",
  "Box3Helper",
  "CameraHelper",
  "DirectionalLightHelper",
  "GridHelper",
  "PolarGridHelper",
  "HemisphereLightHelper",
  "PlaneHelper",
  "PointLightHelper",
  "SkeletonHelper",
  "SpotLightHelper",
];

export default function (ctx) {
  const { THREE, scene } = ctx.viewport;

  const box = new THREE.BoxHelper();
  box.visible = false;
  scene.add(box);

  ctx.gui.domElement.addEventListener("open", (e) => {
    const { object } = e.detail.userData;
    if (!object) {
      return;
    }
    box.visible = true;
    box.setFromObject(object);
  });
  ctx.gui.domElement.addEventListener("close", (e) => {
    box.visible = false;
  });
}
