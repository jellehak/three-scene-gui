import * as THREE from "three";

export default function (ctx = {}) {
  const { gui } = ctx;
  const { scene } = ctx.viewport

  // Makers
  addMakersTo(gui, scene);

  {
    const methods = {
      allGeo() {
        const container = new THREE.Group()
        container.name = "group"
        scene.add(container)
        GEOMETRIES.forEach((key, index) => {
          createMaker(container)[key]().position.set(index * 2, 0, 0);
        });
      },
    };
    gui.add(methods, "allGeo");
  }
}

export function addMakersTo(gui, scene) {
  if (!scene) {
    throw new Error("Please provide a scene.");
  }
  const creators = createMaker(scene);

  const parent = gui.addFolder(`Creators`).open(false);
  {
    const folder = parent.addFolder(`Common`).open(false);
    COMMON.forEach((name) => {
      folder.add(creators, name);
    });
  }
  {
    const folder = parent.addFolder(`Geometry`).open(false);
    GEOMETRIES.forEach((name) => {
      folder.add(creators, name);
    });
  }
  {
    const folder = parent.addFolder(`Lights`).open(false);
    LIGHTS.forEach((name) => {
      folder.add(creators, name);
    });
  }
}

// Creators
export const COMMON = ["Object3D"];

export const GEOMETRIES = [
  "Box",
  "Capsule",
  "Circle",
  "Cone",
  "Cylinder",
  "Dodecahedron",
  "Edges",
  "Extrude",
  "Icosahedron",
  "Lathe",
  "Octahedron",
  "Plane",
  "Polyhedron",
  "Ring",
  "Shape",
  "Sphere",
  "Tetrahedron",
  "Torus",
  "TorusKnot",
  "Tube",
  "Wireframe",
];

export const LIGHTS = [
  "AmbientLight",
  "AmbientLightProbe",
  "DirectionalLight",
  "HemisphereLight",
  "HemisphereLightProbe",
  "Light",
  "LightProbe",
  "PointLight",
  "RectAreaLight",
  "SpotLight",
];

export const createGeometryMaker = (name) => {
  return () => {
    const geometry = new THREE[`${name}Geometry`]();
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // scene.add(mesh);
    return mesh;
  };
};

export function createMaker(scene = {}) {
  const methods = {};
  COMMON.forEach((name) => {
    methods[name] = () => {
      const object = new THREE[`${name}`]();
      object.name = name;
      scene.add(object);
      return object;
    };
  });
  GEOMETRIES.forEach((name) => {
    methods[name] = () => {
      const geometry = new THREE[`${name}Geometry`]();
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };
  });
  LIGHTS.forEach((name) => {
    methods[name] = () => {
      const object = new THREE[`${name}`]();
      object.name = name;
      scene.add(object);
      return object;
    };
  });
  return methods;
}

const HELPER_MAPPING = {
  DirectionalLight: "DirectionalLightHelper",
  HemisphereLight: "HemisphereLightHelper",
  PointLight: "PointLightHelper",
  SpotLight: "SpotLightHelper",
};

export function createHelpers(scene) {
  const container = new THREE.Object3D();
  container.name = "helpers";
  scene.traverse((object) => {
    const hasHelper = HELPER_MAPPING[object.type];
    if (hasHelper) {
      const pointLightHelper = new THREE[hasHelper](object);
      container.add(pointLightHelper);
      return;
    }
    // console.info(`No helper found for type ${object.type}`, object)
  });
  return container;
}
