// pages/login/multiDevice.js
const App = getApp()
import { $yjpCountDown, $yjpToast } from '../../components/yjp'
import sendCodeJS from 'sendCode.js'
Page({
  data: {
    codeNumFakeArr: [0, 1, 2, 3, 4, 5],
    codeValue: ``,//验证码
    codeValid: false,
    codeId: ``,//验证码的ID
  },
  onLoad: function (options) {
    Object.assign(this, sendCodeJS)
    this.setData({
      account: wx.getStorageSync(`account`),
    })
  },
  onShow() {
    //没有获取到本地缓存的账号时则直接进首页
    this.data.account ? this.vcode() : App.WxService.switchTab(App.Constants.Route.homePage)
  },
  confirm() {
    return this.codeValidate()
      .then(data => {
        if (data) {
          //登录后需要验证码，关掉再进去，可以不用输入验证码的bug
          wx.removeStorage({
            key: 'needmultiDeviceUser',
            success: function(res) {},
          })
          return App.HttpService.multiDeviceValidate({
            data: {
              deviceId: wx.getStorageSync(`deviceId`),
              mobileNo: this.data.account,
              validateCode: this.data.codeValue,
              validateCodeId: this.data.codeId,
            }
          })
        } else {
          return Promise.reject(``)
        }
      })
      .then(data => {
        if (App.globalData.isRegisterAndGroupBuy) {
          //来自分享团购新注册
          App.WxService.reLaunch(App.Constants.Route.groupBuyDetail, { isFromRegister: true })
        } else {
          App.WxService.switchTab(App.Constants.Route.homePage)
        }
      })
  }
})