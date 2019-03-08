// pages/user/signIn/signIn.js
const App = getApp()
Page({
  data: {
    signInUrl: ''
  },
  onLoad: function (options) {
    const signInUrl = wx.getStorageSync(`signInUrl`)
    this.setData({
      signInUrl: signInUrl
    })
  },
  onUnload(){
    let pages = getCurrentPages(); // 当前页面  
    let beforePage = pages[pages.length - 2]; // 前一个页面      
    beforePage.getSignInDetail()
  }
})