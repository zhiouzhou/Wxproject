// pages/service/service.js
import { $yjpToast, $yjpDialog, OrderOperationJs } from '../../components/yjp.js'
const App = getApp()

Page({
  data: {
    showPurchaseGuide: false,
    showMallAnswer: false
  },

  onLoad: function (options) { 
  },

  onShow: function () {
    if (getApp().globalData.settingValue && getApp().globalData.settingValue.AnswerUrl) {
      this.setData({ showMallAnswer: true })
    }
    App.HttpService.getUserInfoCount()
      .then(data => {
        getApp().globalData.videoGuideUrl = data.data.purchaseGuideUrl
        if (data.data.purchaseGuideUrl){
          this.setData({ showPurchaseGuide:true})
        }
      }
      )
      .catch(e => { })
  },
  //跳转投诉建议
  goComplaints() {
    App.WxService.navigateTo(App.Constants.Route.complaints)
  },
  //跳转帮我找货
  goFindGoods() {
    App.WxService.navigateTo(App.Constants.Route.findGoods)
  },
  //跳转兑奖申请
  goPrizeApply() {
    //判断城市是否开始兑奖申请
    if (!wx.getStorageSync("token")) {
      WxService.reLaunch(App.Constants.Route.prizeApply.login) 
      return;
    }
    //城市信息中字段openAward，决定该城市是否有开通兑奖申请
    var appSetting = wx.getStorageSync("appSetting")
    if (appSetting && appSetting.openAward) {
      App.WxService.navigateTo(App.Constants.Route.prizeApply)
    } else {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        dialogData: { text: `当前城市尚未开通线上兑奖,如需兑奖，请联系业务员` },
        hiddenCancel: true, confirmText: `确定`
      })
    }
  },
  //跳转易酒批答题
  goMallAnswer() {
    App.WxService.navigateTo(App.Constants.Route.mallAnswer) 
  },
  //跳转到进货指南
  goVideoGuide(){
    App.WxService.navigateTo(App.Constants.Route.explain, { keyWord: `进货指南` })
  }
})