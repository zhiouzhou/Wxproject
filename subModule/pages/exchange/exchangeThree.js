// pages/exchange/exchangeThree.js
const App = getApp();
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'

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
    if(options && options.params) {
      let params = JSON.parse(options.params)
      this.setData({
        swapOrder: params
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
  //提交换货单
  checkoutOrder() {
     let returnItem = [];//退货订单项
     for (let item of this.data.swapOrder.returnItems) {
      let o = {};
      o.returnCount = item.returnCount;
      o.orderItemId = item.itemId;
      returnItem.push(o);
    }
     let swapItem = [];
     for (let item of this.data.swapOrder.swapItems) {
       let o = {};
       o.count= item.buyNum;
       o.productSaleSpecId = item.productSaleSpecId;
       o.productSkuId = item.productSkuId;
       o.sourceId = item.productSkuId;
       o.sourceType = 0//普通产品
       swapItem.push(o);
     }
     let params = {
       orderId: this.data.swapOrder.orderId,
       returnItem,
       swapItem,
       swapReason: this.data.swapOrder.swapReason,
       userRemark: this.data.swapOrder.userRemark || ''
     }
     wx.showLoading({
       title: '加载中',
       mask: true
     })
     App.HttpService.submitSwapOrder({ data: params}).then(data => {
       if(data.success) {
         data.data.isSwap = true;
         wx.hideLoading()
         App.WxService.redirectTo(App.Constants.Route.exchangeSuccess,{
           data: data.data,
           payTypeText: "货到付款",
           placeOrderTime: data.serviceTime
         })
       }
     }).catch(data =>{
       wx.hideLoading()
       let placeOrderTime = wx.getStorageSync(`serviceTime`)
       App.WxService.redirectTo(App.Constants.Route.exchangeFail, { data: data, placeOrderTime, payTypeText: "货到付款"})
     })
  }
})