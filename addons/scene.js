// import * as THREE from "three";

/**
 *
 * @param {*} folder
 * @param {*} node
 * @returns lil gui folder https://lil-gui.georgealways.com/#GUI#addFolder
 */
export const objectGui = (folder, node) => {
  // Create A folder
  const nodeFolder = folder
    .addFolder(node.name || node.type || node.id)
    .open(false);

  // Add some userData for easy Three Object lookup
  nodeFolder.userData = {
    object: node
    // id: node.id,
  };
  // nodeFolder._object = node

  // TODO make flexible
  const methods = {
    children() {
      refreshFolder(nodeFolder, node);
    },
    remove() {
      node.parent.remove(node);
      nodeFolder.destroy();
    },
  };

  // Add node specific inputs
  const NODE_UI_RESOLVER = {
    AmbientLight: commonGui,
    Mesh: meshGui,
  };
  const hasUIFn = NODE_UI_RESOLVER[node.type];
  if (hasUIFn) {
    hasUIFn(nodeFolder, node);
  }
  if (!hasUIFn) {
    commonGui(nodeFolder, node);
  }

  // Add methods
  {
    nodeFolder.add(methods, "remove");
  }

  // List children
  const hasChildren = node.children.length || node.type === "Object3D";
  if (hasChildren) {
    const childFolder = nodeFolder
      .addFolder(`Children (${node.children.length})`)
      .open(false);

    // Scan on open
    const trigger = childFolder.domElement.querySelector(".title");
    trigger.addEventListener("click", () => {
      if (childFolder._closed === false) {
        refreshFolder(childFolder, node);
      }
    });
  }

  return nodeFolder;
};

function meshGui(folder = {}, object = {}) {
  const parentFolder = folder;
  {
    folder.add(object, "type");
    folder.add(object, "visible");
    folder.add(object, "castShadow");
    folder.add(object, "receiveShadow");

    {
      const folder = parentFolder.addFolder("Position").open(false);
      folder.add(object.position, "x").step(0.1);
      folder.add(object.position, "y").step(0.1);
      folder.add(object.position, "z").step(0.1);
    }
    {
      const folder = parentFolder.addFolder("Scale").open(false);
      folder.add(object.scale, "x");
      folder.add(object.scale, "y");
      folder.add(object.scale, "z");
    }
    {
      const folder = parentFolder.addFolder("Rotation").open(false);
      folder.add(object.rotation, "_x");
      folder.add(object.rotation, "_y");
      folder.add(object.rotation, "_z");
    }
  }

  // MESH
  if (object.material) {
    const folder = parentFolder.addFolder("Material").open(false);
    commonGui(folder, object.material);
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
 * Refresh all children of a lil gui folder
 * @param {*} folder
 * @param {*} object
 * @returns
 */
export function refreshFolder(folder = {}, object = {}) {
  // Clear
  folder.children.map((child) => child.destroy());
  folder.folders.map((child) => child.destroy());

  // Add
  return object.children.map((child) => {
    const _folder = objectGui(folder, child);
    addFolderListeners(_folder);
    return _folder;
  });
}

function addFolderListeners(folder) {
  // console.log(folder.domElement);
  const trigger = folder.domElement.querySelector(".title");
  trigger.addEventListener("click", (e) => {
    const isOpen = !folder._closed;
    if (isOpen) {
      // console.log("folder open", folder);
      folder.domElement.dispatchEvent(
        new CustomEvent("open", {
          bubbles: true,
          detail: folder,
        })
      );
    }
    if (!isOpen) {
      // console.log("folder closed", folder);
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

    this.sceneProxy = new GroupProxy();
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
   * Convert THREEJs graph to lil-gui elements
   * @param {*} object THREEjs object
   * @param {*} folder Lil-gui folder
   * @returns
   */
  scan(object = {}, folder) {
    return refreshFolder(folder, object);
  }

  /**
   * Install a plugin
   * @param {*} promise 
   * @returns 
   */
  async plugin(promise) {
    const resp = await promise
    // should be a default function
    return resp.default(this)
  }

  create(folder = null) {
    let { gui, viewport, state } = this;
    const { scene } = viewport;

    folder = folder || gui.addFolder(`Scene`).open(false);

    // Watch changes
    this.sceneProxy.addEventListener("add", (e) => {
      console.log('New data nice', e.detail)
      // Add item to gui
      const objectFolder = objectGui(folder, e.detail);
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
    const options = {
      refresh: () => {
        refreshFolder(folder, scene);
        // folder.add(options, "refresh");
      },
    };
    options.refresh();
  }
}

// Autoinstall ?
if (window.gui) {
  new SceneGui(window.gui);
}
