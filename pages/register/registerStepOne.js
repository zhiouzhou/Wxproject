// pages/register/registerStepOne.js
const App = getApp()
import { $yjpCountDown, $yjpToast, $yjpDialog } from '../../components/yjp'
import sendCodeJS from '../login/sendCode.js'
Page({
  data: {
    codeNumFakeArr: [0, 1, 2, 3, 4, 5],
    account: ``,
    password: ``,
    passwordRepeat: ``,
    fromQuickRegister: false,//是否来自于开放注册(即非正常注册流程)
    codeValue: ``,//验证码
    codeId: ``,//验证码的ID,
    protocolSelected: true,
    inviterId: ``
  },
  onLoad: function (options) {
    Object.assign(this, sendCodeJS)
    this.setData({
      fromQuickRegister: options.fromQuickRegister == `true`,
      account: options.account || ``,
      inviterId: options.inviterId || ``
    })
    wx.setNavigationBarTitle({
      title: this.data.fromQuickRegister ? `设置密码` : `注册`,
    })
  },
  //切换协议
  switchProto() {
    this.setData({ protocolSelected: !this.data.protocolSelected })
  },
  //查看协议
  previewProto() { },
  //检验密码和确认密码是否一致
  checkPasswordValid(e) {
    const tag = e.currentTarget.dataset.tag
    const content = e.detail.value
    if (tag === `password`) {
      this.setData({ password: content })
    } else {
      this.setData({ passwordRepeat: content })
    }
  },

  onClickConfirm() {
    if (this.data.fromQuickRegister) {
      !this.isAccountValid() ? this.confirmFail(`请填写正确的手机号`) :
        !this.isPswRepeatAndPswSame() ? this.confirmFail(`两次输入密码不一致`) :
          !this.isPswRepeatAndPswValid() ? this.confirmFail(`请填写正确的密码`) : this.confirmSuccess()
    } else {
      !this.isAccountValid() ? this.confirmFail(`请填写正确的手机号`) :
        !this.isPswRepeatAndPswSame() ? this.confirmFail(`两次输入密码不一致`) :
          !this.isPswRepeatAndPswValid() ? this.confirmFail(`请填写正确的密码`) :
            !this.data.protocolSelected ? this.confirmFail(`请同意协议内容`) : this.confirmSuccess()
    }
  },
  confirmFail(msg) {
    $yjpToast.show({ text: msg })
  },
  confirmSuccess() {
    //快速注册不需要验证码
    if (this.data.fromQuickRegister) {
      return App.WxService.navigateTo(App.Constants.Route.registerStepTwo,
        { account: this.data.account, password: this.data.password, fromQuickRegister: this.data.fromQuickRegister, inviterId: this.data.inviterId})
    } else {
      return this.codeValidate()
        .then(data => {
          if (data) {
            return Promise.resolve(``)
          } else {
            return Promise.reject(``)
          }
        })
        .then(data => App.WxService.navigateTo(App.Constants.Route.registerStepTwo,
          { account: this.data.account, password: this.data.password, fromQuickRegister: this.data.fromQuickRegister, inviterId: this.data.inviterId }))
    }
  }
})

