// pages/login/bindPhone.js
const App = getApp()
import { $yjpCountDown, $yjpToast, $yjpDialog } from '../../components/yjp'
import sendCodeJS from 'sendCode.js'
Page({
  data: {
    loginInfo: {},
    codeNumFakeArr: [0, 1, 2, 3, 4, 5],
    account: ``,
    codeValue: ``,//验证码
    codeId: ``,//验证码的ID
  },
  onLoad: function (options) {
    Object.assign(this, sendCodeJS)
    let loginInfo = JSON.parse(options.loginInfo)
    this.setData({ loginInfo })
  },
  confirm() {
    if (!(this.isAccountValid() && this.data.codeValue.length == 6)) return
    wx.showLoading({ title: '绑定中' })
    return this.codeValidate()
      .then(data => {
        if (data) {
          return Promise.resolve(``)
        } else {
          return Promise.reject(`验证码不正确`)
        }
      })
      .then(data => {
        return App.HttpService.weChatBind({
          noToken: true,
          data: {
            businessId: this.data.loginInfo.data.token,
            mobileNo: this.data.account,
            validateCode: this.data.codeValue,
            validateCodeId: this.data.codeId,
          }
        })
      })
      .then(data => {
        $yjpToast.show({ text: `绑定成功` })
        return App.HttpService.saveLoginInfo(this.data.loginInfo)
      })
      .then(data => {
        if (App.globalData.isRegisterAndGroupBuy) {
          //来自分享团购新注册
          App.WxService.reLaunch(App.Constants.Route.groupBuyDetail, { isFromRegister: true })
          return Promise.resolve()
        } else {
          return App.HttpService.validateLogin()
            .then(data => {
              wx.hideLoading()
              setTimeout(() => App.WxService.switchTab(App.Constants.Route.homePage), 1500)
            })
            .catch(e => {
              wx.hideLoading()
              setTimeout(() => App.WxService.reLaunch(App.Constants.Route.login, { loginFail: true }), 1500)
            })
        }
      })
      .catch(e => {
        wx.hideLoading()
        $yjpToast.show({ text: e })
      })
  },
})