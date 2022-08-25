/**
 * https://discourse.threejs.org/t/camera-zoom-to-fit-object/936
 * @param {*} object
 */
function fit(ctx = {}, object = {}, { offset = 1.25 } = {}) {
  const { camera, controls, THREE } = ctx;
  const { Box3, Vector3 } = THREE;

  // get bounding box of object - this will be used to setup controls and camera
  const boundingBox = new Box3();
  boundingBox.setFromObject(object);

  const center = boundingBox.getCenter(new Vector3());
  const size = boundingBox.getSize(new Vector3());

  // get the max side of the bounding box (fits to width OR height as needed )
  const maxDim = Math.max(size.x, size.y, size.z);
  //   const fov = camera.fov * (Math.PI / 180)
  let cameraZ = maxDim; // Math.abs(maxDim / 4 * Math.tan(fov * 2))

  cameraZ *= offset; // zoom out a little so that objects don't fill the screen

  // Iso
  // camera.position.x = cameraZ;
  // camera.position.y = cameraZ;
  camera.position.z = cameraZ;

  if (controls) {
    // set camera to rotate around center of loaded object
    controls.target = center;

    // prevent camera from zooming out far enough to create far plane cutoff
    // controls.maxDistance = cameraToFarEdge * 2

    // controls.saveState()
  } else {
    camera.lookAt(center);
  }
}

export default function (ctx) {
  const { THREE, scene } = ctx.viewport;

  ctx.gui.domElement.addEventListener("open", (e) => {
    const { object } = e.detail.userData;
    console.log(object)
    if(!object.position) {
      return
    }
    
    fit(ctx.viewport, object)
  });
  ctx.gui.domElement.addEventListener("close", (e) => {
    // box.visible = false;
  });
}
