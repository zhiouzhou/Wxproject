// pages/user/orders/orderTrack.js
var App = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderTrackInfo:{}
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    App.HttpService.getOrderTraceList({ orderNO: options.orderNO, types: options.types})
        .then(data => {
          this.setData({
            orderTrackInfo: data.data
          })
        })
  }
})