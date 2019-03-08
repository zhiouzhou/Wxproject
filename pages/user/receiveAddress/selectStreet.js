// pages/user/receiveAddress/selectStreet.js
const App = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let { province, city, county } = options;
    this.getStreetList(province, city, county)
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

  },
  //获取街道列表
  getStreetList(province, city, county) {
    App.HttpService.getStreetList(province, city).then(data => {
      if (data.success) {
        if (data.data.length > 0) {
          data.data.forEach(item => {
            if (item.countyName == county) {
              let streetList = Object.values(item.streets);
              this.streetList = streetList;
              this.setData({
                streetList: streetList
              })
            }
          })
        } else {
          this.streetList = [];
          this.setData({
            streetList: []
          })
        }
      }
    })
  },
  //搜索街道
  onInputOver(e) {
    let inputValue = e.detail.value;
    if(!inputValue) {
      this.setData({
        streetList: this.streetList
      })
    } else{
      let arr = [];
      this.streetList.forEach(street => {
        if (street.indexOf(inputValue) >-1) {
          arr.push(street);
        }
      })
      this.setData({
        streetList: arr
      })
    }
  },
  confirmSelect(event) {
    let street = event.currentTarget.dataset.data;
    let pages = getCurrentPages()
    let prePage = pages[pages.length - 2]
    if (prePage.route == "pages/register/registerStepTwo"){
      prePage.updateButtonState()
    } else if (prePage.route == "pages/user/receiveAddress/addUserAddress") {
      prePage.check()
    }
    if (prePage.route == "pages/user/receiveAddress/addNewAddress") {
      prePage.setData({ "address.street":street })
    } else{
      prePage.setData({ street })
    }
    App.WxService.navigateBack()
  }
})