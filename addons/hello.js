export default function (ctx) {
    ctx.gui.domElement.addEventListener("open", (e) => {
      const {object} = e.detail.userData
      object.visible = false
    });
    ctx.gui.domElement.addEventListener("close", (e) => {
      const {object} = e.detail.userData
      object.visible = true
    });
}
