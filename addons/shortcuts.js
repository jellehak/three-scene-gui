function handleKeyboardInput() {
  // Handle keyboard input
  const keydown = (event) => {
    const key = event.key.toLowerCase();
    // console.log(key, event.key);
    if (key === "backspace") {
      // TODO delete selected item
    }
  };
  document.addEventListener("keydown", keydown, false);
}

export default function (ctx) {
  ctx.gui.domElement.addEventListener("open", (e) => {
    const { object } = e.detail.userData;
    object.visible = false;
  });
  ctx.gui.domElement.addEventListener("close", (e) => {
    const { object } = e.detail.userData;
    object.visible = true;
  });
}
