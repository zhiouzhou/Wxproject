// pages/login/findPassword.js
const App = getApp()
import { $yjpCountDown, $yjpToast, $yjpDialog } from '../../components/yjp'
import sendCodeJS from 'sendCode.js'
Page({
  data: {
    codeNumFakeArr: [0, 1, 2, 3, 4, 5],
    account: ``,
    password: ``,
    passwordRepeat: ``,
    codeValue: ``,//验证码
    codeId: ``,//验证码的ID
    codeValid: false,
  },
  onLoad: function (options) {
    Object.assign(this, sendCodeJS)
  },
  onPasswordBlur(e) {
    const tag = e.currentTarget.dataset.tag
    const content = e.detail.value
    if (tag === `password`) {
      this.setData({ password: content })
    } else {
      this.setData({ passwordRepeat: content })
    }
  },
  confirm() {
    return this.codeValidate()
      .then(data => {
        if (data) {
          return Promise.resolve(``)
        } else {
          return Promise.reject(``)
        }
      })
      .then(data => {
        if (!this.isAccountValid()) {
          $yjpToast.show({ text: `请正确填写手机号` })
          return
        } else if (!this.isPswRepeatAndPswValid()) {
          $yjpToast.show({ text: `请填写正确的密码` })
          return
        } else {
          return App.HttpService.forgetPassword({
            data: {
              mobileNo: this.data.account,
              password: this.data.password,
              validateCode: this.data.codeValue,
              validateCodeId: this.data.codeId,
            }
          })
            .then(data => {
              $yjpToast.show({ text: `密码修改成功` })
              setTimeout(() => App.WxService.navigateBack(), 1500)
            })
            .catch(e => $yjpToast.show({ text: e }))
        }
      })
  }
})