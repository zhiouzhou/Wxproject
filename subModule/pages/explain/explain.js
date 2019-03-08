// pages/user/prizeApply/Explain.js
Page({
  data: {
    ruleUrl: ``
  },
  onLoad: function (options) {
    let ruleUrl = this.getRuleUrl(options)
    this.setData({ ruleUrl })
    wx.setNavigationBarTitle({ title: options.keyWord })
  },
  getRuleUrl(options) {
    if (options.keyWord == `兑奖说明`) {
      const settingValue = getApp().globalData.settingValue
      let awardExplainUrl = settingValue.AwardExplain
      awardExplainUrl = awardExplainUrl.replace(/cashPriceExplain.html/, "cashPriceExplain1.html")
      return awardExplainUrl
    } else if (options.keyWord == `拼团规则`) {
      return settingValue.GroupPurchaseRuleURL
    } else if (options.keyWord == `进货指南`){
      const videoGuideUrl = getApp().globalData.videoGuideUrl
      return videoGuideUrl
    } else if (options.keyWord == `异常配送订单确认`) {
      const token = wx.getStorageSync(`token`) 
      const url = options.skipUrl + `?token=${token}`
      return url
    }
  },
  onReady() {

  }
})