// pages/message/message.js
const App = getApp()
Page({
  data: {
    messageUrl: ''
  },
  onLoad: function (options) {
    const token = wx.getStorageSync(`token`) 
    const specialAreaId = options.specialAreaId
    const addressId = getApp().globalData.addressId
    const userState = getApp().globalData.userDetail && getApp().globalData.userDetail.state
    const url = getApp().globalData.settingValue.SecondPageUrl
    let messageUrl = url + '#/navi/home' + '?token=' + token + '&specialAreaId=' + specialAreaId + '&addressId='
     + addressId + '&userState=' + userState
   this.setData({ 
     messageUrl: messageUrl
    })
  }
})
