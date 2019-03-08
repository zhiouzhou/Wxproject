
import Component from '../component'

export default {

  setDefaults() {
    return {
      title: ``,
      onCancel() { },
      cancelText: `取消`,
      cancelType: `ft-28 color-666`,
      onConfirm() { },
      confirmText: `确定`,
      confirmType: `ft-28 color-D91F2F`,
      canDismiss: true
    }
  },
  open(opts = {}) {
    const options = Object.assign({
      animateCss: undefined,
      visible: !1,
    }, this.setDefaults(), opts)
    const component = new Component({
      scope: `$yjp.dialog`,
      data: options,
      methods: {
        hide(cb) {
          if (this.removed) return !1
          this.removed = !0
          this.setHidden()
          setTimeout(() => typeof cb === `function` && cb(), 300)
        },
        show() {
         
          if (this.removed) return !1
          this.setVisible()
        },
        onDismiss() {
          if (options.canDismiss) {
            this.hide()
          }
        },
        onReset(e) {
          typeof options.onReset === `function` ? options.onReset(e) : {}
        },
        buttonTapped(e) {
          const buttonType = e.currentTarget.dataset.buttonType
          if (buttonType === `cancel`) {
            this.hide(() => typeof options.onCancel === `function` ? options.onCancel(e) :
              typeof options.onCancel === `string` ? this.page[options.onCancel](e) : {})
          } else if (buttonType === `confirm`) {
            this.hide(() => typeof options.onConfirm === `function` ? options.onConfirm(e) :
              typeof options.onConfirm === `string` ? this.page[options.onConfirm](e) : {})
          }
        },
      },
    })
    component.show()
    return component.hide
  },

}