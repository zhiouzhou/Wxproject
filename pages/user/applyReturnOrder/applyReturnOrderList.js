// pages/user/applyReturnOrder/applyReturnOrder.js
const App = getApp()
import { $yjpToast,$yjpDialog } from '../../../components/yjp.js'
import applyReturnOrderCommon from './applyReturnOrderCommon.js'

Page({
  /**
   * 页面的初始数据
   */
  data: {
      windowHeight: 0,
      productList : [],
      allSelected : false,
      selectedCount : 0
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
	  
     Object.assign(this,applyReturnOrderCommon)
    const systemInfo = App.globalData.systemInfo;
    let orderDetail = JSON.parse(options.orderDetail);
    for(let i = 0; i < orderDetail.itemList.length;i++) {

      let item = orderDetail.itemList[i];
      //默认可退最大数量 
      item.returnCount = item.canReturnNum;
      item.selected = false;
      if (item.canReturnNum) {
        item.canSelected = true
      }
      if (item.product.productSkuId == item.product.productSaleSpecId) {
        item.product.XS = 1;
      } else {
        item.product.XS = item.product.saleSpecQuantity || 1;
      }
      item.showCount = item.product.XS * item.canReturnNum;
      this.data.productList.push(item);
    }
    this.data.productList.sort(function(a,b){
       return b.canReturnNum - a.canReturnNum
    })
    this.setData({
      windowHeight: systemInfo.windowHeight * systemInfo.pixelRatio,
      orderDetail: orderDetail,
      productList: this.data.productList
    })

  },
  //确定
  confirm(){
    if (!this.data.selectedCount){
       $yjpToast.show({text:"请选择商品"})
        return ;
     }
    let orderDetail = this.data.orderDetail;
    orderDetail.itemList = this.data.productList.filter(item=>{
      return item.selected === true
    });
    App.WxService.navigateTo(App.Constants.Route.applyReturnOrder, { orderDetail,fromList:true})
  }

})