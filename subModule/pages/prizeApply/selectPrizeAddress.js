// pages/user/prizeApply/selectPrizeAddress.js
const App = getApp()
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
    let userAddress = wx.getStorageSync(`userAddress`);
    let selectAddressId = App.globalData.addressId
    console.log(userAddress)
    userAddress.forEach(item => {
      if (item.addressId == selectAddressId) {
        item.select = true
      } else {
        item.select = false
      }
      return item
    })
    this.setData({
      addressArr: userAddress,
    })
  },
  selectAddress(e) {
    //先把选中项取到
    let address = e.currentTarget.dataset.address
    //把页面上的地址数组拿下来
    let { addressArr } = this.data
    // 遍历地址数组，通过addressId去匹配是否是选中的那个地址，如果是的话就把select设置为true，否则为false
    addressArr.forEach(item => {
      if (item.addressId == address.addressId) {
        item.select = true
      } else {
        item.select = false
      }
      return item
    })
    this.setData({ addressArr })
    var pages = getCurrentPages();
    var currPage = pages[pages.length - 1];  //当前页面
    var prevPage = pages[pages.length - 2]; //上一个页面
    //直接调用上一个页面的setData()方法，把数据存到上一个页面中去
    prevPage.setData({
      address: address
    })
    setTimeout(()=>{
      wx.navigateBack({
        delta:1
      });
    },1000)
  }

})