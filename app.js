//app.js
import WxValidate from './assets/plugins/wx-validate/WxValidate'
import WxService from './assets/plugins/wx-service/WxService'
import HttpService from './utils/NetworkUtil.js'
import versionConfig from './version.config.js'
import StringUtil from './utils/StringUtil.js'
import Constants from './utils/Constants.js'
var tdweapp = require('./utils/tdweapp.js');

App({
  onLaunch: function (data) {
    //新版本进入的时候清除掉老版本的用户名
    if (wx.getStorageSync(`mobileNo`)) {
      const account = wx.getStorageSync(`mobileNo`)
      wx.setStorageSync(`account`, account)
      wx.removeStorageSync(`mobileNo`)
    }
    this.HttpService.onAppLaunch()
  },
  onHide: function () {
    console.log(`App onHide触发`)
    //拼团新注册用户，流程中断则清除数据
    if (this.globalData.isRegisterAndGroupBuy && !this.globalData.isOnSelectMap) {
      this.globalData.registerAndGroupBuy = {}
      this.globalData.isRegisterAndGroupBuy = false
    }
  },
  onShow: function (options) { },
  onError: function (msg) { },
  WxValidate: (rules, messages) => new WxValidate(rules, messages),
  HttpService: new HttpService,
  WxService: new WxService,
  versionConfig: versionConfig,
  Constants: Constants,
  StringUtil,
  globalData: {
    addressId: '',
    appSetting: {},
    userDetail: { state: 1, auditRejectionReason: '' },
    settingValue: {},
    systemInfo: {},
    //用于talkingData统计
    talkingdataEventId: StringUtil.UUID()
  }
})

