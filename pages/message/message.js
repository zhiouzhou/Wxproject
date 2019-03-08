// pages/message/message.js
const App = getApp()
Page({
  data: {
    messageUrl: ''
  },
  onLoad: function (options) {
    const settingValue = App.globalData.settingValue
    const token = wx.getStorageSync(`token`) 
    let setMessageUrl = settingValue.MessageCenterUrl
    setMessageUrl = setMessageUrl.replace(/list.html/, "list1.html")
    let messageUrl = setMessageUrl + token
    this.setData({ 
      messageUrl: messageUrl
     })
  }
})