const App = getApp()
Page({
  data: {
    linkAdUrl: ''
  },
  onLoad: function (options) {
    let linkAdtitle = options.linkTitle
    let linkAdUrl = options.linkUrl
    let token = wx.getStorageSync(`token`) 
    token = '?token=' + token
    wx.setNavigationBarTitle({
      title: linkAdtitle,
    })   
    linkAdUrl = linkAdUrl + token
    this.setData({
      linkAdUrl: linkAdUrl
    })
  }
})