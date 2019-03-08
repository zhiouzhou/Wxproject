// pages/mallAnswer/mallAnswer.js
const App = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    answerUrl: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let userId, mobileNo, userName
    if (options.share == "1") {
      userId = options.recommenderId
      mobileNo = options.recommenderPhone
      userName = options.userName
    }
    let baseAnswerUrl = getApp().globalData.settingValue && getApp().globalData.settingValue.AnswerUrl || 'https://resource.yijiupi.com/answerDrainage/index.html'
    if (options.share == "1") {
      let account = wx.getStorageSync(`account`)
      if (account){
        App.WxService.reLaunch(App.Constants.Route.login)
      }
      let answerUrl = baseAnswerUrl+`#/receiveRed?recommenderId=${userId}&recommenderPhone=${mobileNo}&userName=` + encodeURIComponent(userName);
      this.setData({
        answerUrl
      })
    } else {
      let token = wx.getStorageSync('token')
      let answerUrl
      if (options.share == "2"){
        answerUrl = baseAnswerUrl + `#/share?token=${token}`;
        wx.setNavigationBarTitle({ title:`邀请好友` })
        //TODO:如果此时
      }else{
        answerUrl = baseAnswerUrl + `#/home?token=${token}`;
      }
      this.setData({
        answerUrl
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    let userDetail = wx.getStorageSync('userDetail')
    return {
      title: '领取红包',
      imageUrl: '/assets/images/invite_share.png',
      path: App.Constants.Route.mallAnswer + `?share=1&recommenderId=${userDetail.userId}&recommenderPhone=${userDetail.mobileNo}&userName=${userDetail.userName}`
    }
  }
})