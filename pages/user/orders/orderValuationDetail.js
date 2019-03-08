// pages/user/orders/orderValuationDetail.js
const App = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    valuationDetail:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    App.HttpService.valuationDetail({ data: options.orderNO })
    .then(data=>{
      this.setData({
        valuationDetail: data.data
      })
    })
  },
})