import * as THREE from "three";

const hasChildren = (object) =>
  (object.children && object.children.length) ||
  object.type === "Object3D" ||
  object.type === "Group";

export class ObjectGui {
  /**
   *
   * @param {*} object ThreeJs Object
   */
  constructor(object = {}) {
    this.node = object;
    this.children = [];
  }

  addTo(folder = {}) {
    const { node } = this;

    // Create A folder
    const nodeFolder = folder
      .addFolder(node.name || node.type || node.id)
      .open(false);

    // Add some userData for easy Three Object lookup
    nodeFolder.userData = {
      object: node,
      // id: node.id,
    };
    // nodeFolder._object = node

    const methods = {
      remove() {
        node.parent.remove(node);
        nodeFolder.destroy();
      },
    };

    // Add methods
    {
      nodeFolder.add(methods, "remove");
    }

    // Add node specific inputs
    const NODE_UI_RESOLVER = {
      AmbientLight: commonGui,
      Mesh: meshGui,
      Group: meshGui,
    };
    const hasUIFn = NODE_UI_RESOLVER[node.type];
    if (hasUIFn) {
      hasUIFn(nodeFolder, node);
    }
    if (!hasUIFn) {
      commonGui(nodeFolder, node);
    }

    // List children
    if (hasChildren(node)) {
      const childFolder = nodeFolder;
      // const childFolder = nodeFolder
      //   .addFolder(`children`)
      //   // .addFolder(`children (${node.children.length})`)
      //   .open(false);

      // Scan on open
      const trigger = childFolder.domElement.querySelector(".title");
      trigger.addEventListener("click", () => {
        if (childFolder._closed === false) {
          const newControllers = this.sync(childFolder);
          // Save
          this.children = newControllers;
          // refreshFolder(childFolder, node);
        }
      });
    }

    return nodeFolder;
  }

  sync(folder) {
    // Remove old
    this.children.map((e) => e.destroy());

    return this.node.children.map((child) => {
      const controller = new ObjectGui(child).addTo(folder);
      return controller;
    });
  }
}

/**
 *
 * @param {*} folder
 * @param {*} object
 * @returns lil gui folder https://lil-gui.georgealways.com/#GUI#addFolder
 */
export const objectGui = (folder, object) => {
  return new ObjectGui(object).addTo(folder);
};

export function meshGui(folder = {}, object = {}) {
  {
    folder.add(object, "type");
    folder.add(object, "visible");
    folder.add(object, "castShadow");
    folder.add(object, "receiveShadow");

    {
      const parentFolder = folder.addFolder("Matrix").open(false);
      const OPEN = true;
      {
        const folder = parentFolder.addFolder("Position").open(OPEN);
        folder.add(object.position, "x").step(0.1);
        folder.add(object.position, "y").step(0.1);
        folder.add(object.position, "z").step(0.1);
      }
      {
        const folder = parentFolder.addFolder("Scale").open(OPEN);
        folder.add(object.scale, "x");
        folder.add(object.scale, "y");
        folder.add(object.scale, "z");
      }
      {
        const folder = parentFolder.addFolder("Rotation").open(OPEN);
        folder.add(object.rotation, "_x");
        folder.add(object.rotation, "_y");
        folder.add(object.rotation, "_z");
      }
    }
  }

  // MESH
  if (object.material) {
    const matFolder = folder.addFolder("Material").open(false);
    commonGui(matFolder, object.material);
  }
}

export function simpleMaterialGui(folder = {}, object = {}) {
  folder.add(object.material, "name");
  folder.add(object.material, "type");
  folder.addColor(object.material, "color");
  if (object.material.hasOwnProperty("wireframe")) {
    folder.add(object.material, "wireframe");
  }
}

export const isColor = (value) => value && typeof value === "object" && value.r;

export function commonGui(folder = {}, object = {}) {
  const keys = Object.entries(object);
  return keys.map(([key, value]) => {
    if (isColor(value)) {
      return folder.addColor(object, key);
    }
    if (typeof value === "object") {
      return;
    }
    if (value === undefined) {
      return;
    }
    // console.warn([key, value])
    return folder.add(object, key);
  });
}

export function sceneGui(folder = {}, scene = {}) {
  if (scene.fog) {
    folder.add(scene.fog, "density").min(0).step(0.00025);
  }
}

export const guiFactory = {
  objectGui,
  meshGui,
  simpleMaterialGui,
  commonGui,
  sceneGui,
};

/**
 * Trigger events on scene changes
 */
export class GroupProxy extends THREE.Group {
  constructor() {
    super();
    this.stack = [];
    this.callbacks = {};
  }

  addEventListener(event = "", cb) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(cb);
  }

  dispatchEvent(event) {
    let cbs = this.callbacks[event.type];
    if (cbs) {
      cbs.forEach((cb) => cb(event));
    }
  }

  add(what) {
    this.dispatchEvent(new CustomEvent("add", { detail: what }));
    return super.add(what);
  }

  remove(what) {
    this.dispatchEvent(new CustomEvent("remove", { detail: what }));
    return super.remove(what);
  }
}

/**
 * Refresh all children of a lil gui folder
 * @param {*} folder
 * @param {*} object
 * @returns
 */
export function refreshFolder(folder = {}, object = {}) {
  // Clear
  // folder.children.map((child) => child.destroy());
  // folder.folders.map((child) => child.destroy());

  // Add
  return object.children.map((child) => {
    const _folder = new ObjectGui(child).addTo(folder);
    addFolderListeners(_folder);
    return _folder;
  });
}

function addFolderListeners(folder) {
  const trigger = folder.domElement.querySelector(".title");
  trigger.addEventListener("click", (e) => {
    const isOpen = !folder._closed;
    if (isOpen) {
      folder.domElement.dispatchEvent(
        new CustomEvent("open", {
          bubbles: true,
          detail: folder,
        })
      );
    }
    if (!isOpen) {
      folder.domElement.dispatchEvent(
        new CustomEvent("close", {
          bubbles: true,
          detail: folder,
        })
      );
    }
  });
}

export class SceneGui {
  constructor(gui = {}, viewport = {}) {
    this.state = {
      autoRefreshValues: true,
    };
    this.gui = gui;
    this.viewport = viewport;

    // this.sceneProxy = new GroupProxy();

    // Highjack scene
    const { scene } = viewport;
    scene._add = scene.add;
    scene.add = function (what) {
      document.body.dispatchEvent(
        new CustomEvent("add", {
          detail: what,
        })
      );
      scene._add(what);
    };
    this.sceneProxy = document.body;

    // this.sceneProxy.name = 'UserScene'
    // // viewport.scene.add(this.sceneProxy)
    // viewport.scene = this.sceneProxy

    this.config = {
      autoRefreshInterval: 500,
    };

    // Auto start if gui is provided
    if (gui) {
      this.create();
    }
  }

  expose() {
    // @ts-ignore
    window.sceneGui = this;
    console.log("Feel free to play around with `sceneGui`");
    return this;
  }

  /**
   * Dynamicly load lil gui
   * @returns
   */
  async loadAssets() {
    const { GUI } = await import(
      "https://cdn.jsdelivr.net/npm/lil-gui@0.17/+esm"
    );
    return GUI;
  }

  async mount() {
    if (!this.gui) {
      const GUI = await this.loadAssets();
      const gui = new GUI({ width: 300 });
      this.gui = gui;
    }
    this.create();
  }

  /**
   * Install a plugin
   * @param {*} promise
   * @returns
   */
  async plugin(promise) {
    const resp = await promise;
    // should be a default function
    return resp.default(this);
  }

  create(folder = null) {
    let { gui, viewport, state } = this;
    const { scene } = viewport;

    folder = folder || gui.addFolder(`Scene`).open(false);

    // Watch changes
    this.sceneProxy.addEventListener("add", (e) => {
      // Add item to gui
      const objectFolder = new ObjectGui(e.detail).addTo(folder);
      addFolderListeners(objectFolder);
    });
    // this.sceneProxy.addEventListener("remove", (e) => {
    //   console.log("todo remove gui", e);
    // });

    // Sync values
    setInterval(() => {
      if (state.autoRefreshValues) {
        // Update values of all controllers each X ms
        const allControllers = gui.controllersRecursive();
        allControllers.forEach((controller) => controller.updateDisplay());
      }
    }, this.config.autoRefreshInterval);

    // Init
    refreshFolder(folder, scene);
  }
}
