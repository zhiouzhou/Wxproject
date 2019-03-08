const App = getApp()
Page({
  data: {
    groupFrameUrl: ''
  },
  onLoad: function (options) {
    const settingValue = App.globalData.settingValue
    const token = wx.getStorageSync(`token`)
    let basetuanUrl = getApp().globalData.settingValue.GroupPurchaseURL
    let groupFrameUrl
    if (options.source) {
      switch (options.source) {
        case '0':		//团购商品详情
          groupFrameUrl = basetuanUrl + '#/productDetail?promotionId=' + options.promotionId + '&isGroupJoin=' + options.isGroupJoin + '&groupPurchaseId=' + options.groupPurchaseId + '&token=';
          break;
        case '1':		//团购活动列表(团购首页)
          groupFrameUrl = basetuanUrl +'#/group?token=';
          break;
        case '2':		//团购拼团列表
          groupFrameUrl = basetuanUrl +'#/groupItemList?token=';
          break;
        default:
      }
    } else {
      groupFrameUrl = basetuanUrl +'#/group?token=';
    }
    groupFrameUrl = groupFrameUrl + token
    this.setData({
      groupFrameUrl: groupFrameUrl
    })
  }
})