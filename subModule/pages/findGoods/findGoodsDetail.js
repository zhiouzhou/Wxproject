// pages/findGoods/findGoodsDetail.js
const App = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    findGoodsDetail: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let findGoodsId = options.findGoodsId
    this.initData(findGoodsId);
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
  //获取投诉详情
  initData(findGoodsId) {
    App.HttpService.queryFindGoodsDetail(findGoodsId).then(data => {
      if(data.success) {
        this.setData({
          findGoodsDetail: data.data
        })
      }
    })
  },
  //查看大图
  lookBigImg(event) {
    var src = event.currentTarget.dataset.tag;//获取data-src
    var imgList = this.data.findGoodsDetail.imgList;//获取data-list
    //图片预览
    wx.previewImage({
      current: src, // 当前显示图片的http链接
      urls: imgList // 需要预览的图片http链接列表
    })
  }
})