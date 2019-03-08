// pages/exchange/exchangeOne.js
const App = getApp();
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    retureItems: [],
    swapReason: '',
    userRemark: '',
    totalItemEstimatePrice: 0,
    titleShow: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(options && options.order) {
      this.order = JSON.parse(options.order);
      let retureItems = [];
      let totalItemEstimatePrice = 0;
      for (let item of this.order.itemList) {
        if (item.swappableCount && item.swappableCount>0) {
          item.returnCount = item.swappableCount;
          if (item.product.productSaleSpecId == item.product.productSkuId) {
            item.showCount = item.returnCount
          } else {
            item.showCount = item.returnCount * (item.product.saleSpecQuantity || 1)
          }
          totalItemEstimatePrice += item.itemEstimatePrice * item.returnCount;
          retureItems.push(item)
        }
      }
      this.setData({
        retureItems,
        totalItemEstimatePrice
      })
    }
    //获取换货原因
    App.HttpService.getSwapDicectionary(["SwapOrderReason"]).then((data) => {
      if(data.success) {
        this.swapReasonArr = data.data.SwapOrderReason;
        this.swapReasonArr.push("其他")
        this.setData({
          swapReasonArr: this.swapReasonArr
        })
      }
    })
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
  totalPrice(retureItems) {
    let totalItemEstimatePrice = 0;
    for (let item of retureItems) {
      totalItemEstimatePrice += item.itemEstimatePrice * item.returnCount;
    }
    //换货金额估值保留一位小数
    totalItemEstimatePrice = Math.floor(totalItemEstimatePrice * 10)/10;
    return totalItemEstimatePrice;
  },
  //点击商品的减号
  onSubShopCartBuyNum(e) {
    let product = e.currentTarget.dataset.product
    let itemId = e.currentTarget.dataset.itemId
    let { retureItems } = this.data
    let productIndex = retureItems.findIndex(item => item.itemId == itemId)
    let afterSubNum = (product.returnCount - 1) < 0 ? 0 : (product.returnCount - 1)
    let ratio = (product.product.productSkuId == product.product.productSaleSpecId ? 1 : product.product.saleSpecQuantity) || 1;
    //购物车数量大于最大库存，点击加减要更改提示的状态
    product.returnCount = afterSubNum;
    product.showCount = afterSubNum * ratio;
    retureItems[productIndex] = product;
    let totalItemEstimatePrice = this.totalPrice(retureItems);
    this.setData({ [`retureItems[` + productIndex + `]`]: product, totalItemEstimatePrice })
  },

  //点击商品的加号
  onAddShopCartBuyNum(e) {
    let product = e.currentTarget.dataset.product
    let itemId = e.currentTarget.dataset.itemId
    let { retureItems } = this.data
    let productIndex = retureItems.findIndex(item => item.itemId == itemId)
    if ((product.returnCount + 1) > product.swappableCount) {
      $yjpToast.show({text: "已达到最大可申请数量"})
    }
    let afterAddNum = (product.returnCount + 1) > product.swappableCount ? product.returnCount :
      (product.returnCount + 1)
    let ratio = (product.product.productSkuId == product.product.productSaleSpecId ? 1 : product.product.saleSpecQuantity) || 1;
    //购物车数量大于最大库存，点击加减要更改提示的状态
    product.returnCount = afterAddNum;
    product.showCount = afterAddNum * ratio;
    retureItems[productIndex] = product;

    let totalItemEstimatePrice = this.totalPrice(retureItems);
    this.setData({ [`retureItems[` + productIndex + `]`]: product, totalItemEstimatePrice })

  },

  //直接输入商品数量
  onInputShopCartBuyNum(e) {
    let product = e.currentTarget.dataset.product
    let itemId = e.currentTarget.dataset.itemId
    let { retureItems } = this.data
    let productIndex = retureItems.findIndex(item => item.itemId == itemId)
    let inputNum = parseInt(e.detail.value) || 0
    let ratio = (product.product.productSkuId == product.product.productSaleSpecId ? 1 : product.product.saleSpecQuantity) || 1;
    if (product.product.productSkuId == product.product.productSaleSpecId) {
      inputNum = inputNum <= 0 ? 0 : inputNum > product.swappableCount ? product.swappableCount : inputNum;
    } else {
      inputNum = inputNum <= 0 ? 0 : inputNum > product.swappableCount * (product.product.saleSpecQuantity || 0) ? product.swappableCount * (product.product.saleSpecQuantity || 0)  : inputNum;
    }
    
    if (inputNum) {
      let yu = inputNum % ratio;
      inputNum -= yu;
    }
    //购物车数量大于最大库存，点击加减要更改提示的状态
    product.returnCount = inputNum / ratio
    product.showCount = inputNum;
    retureItems[productIndex] = product;

    let totalItemEstimatePrice = this.totalPrice(retureItems);
    this.setData({ [`retureItems[` + productIndex + `]`]: product, totalItemEstimatePrice })
  },
  //选择退货原因
  chooseReturnReason (e) {
    let swapReason = e.target.dataset.swapReason;
    if (this.data.swapReasonArr.indexOf(swapReason) < 0 && swapReason) {
      this.setData({
        chooseRemark: swapReason,
        isSelect: true
      })
    } else {
      this.setData({
        chooseRemark: "",
        isSelect: true
      })
    }
  },
  onSelectReason(e) {
    let reason = e.currentTarget.dataset.reason
    this.setData({
      chooseSwapReason: reason
    })
    
  },
  inputReason(e) {
    let remark = e.detail.value;
    this.setData({
      chooseRemark: remark
    })
  },
  chooseType() {
    this.setData({
      isSelect: false
    })
  },
  confirmReason() {
    if (this.data.chooseSwapReason == '其他' && !this.data.chooseRemark) {
      $yjpToast.show({text: "请填写备注"})
      return;
    }
    if (this.data.chooseSwapReason == "其他") {
      this.setData({
        swapReason: this.data.chooseRemark,
        isSelect: false
      })
    } else {
      this.setData({
        swapReason: this.data.chooseSwapReason,
        isSelect: false
      })
    }
  },
  //备注输入
  inoutUserRemark(e){
    this.data.userRemark = e.detail.value;
    this.setData({
      userRemark: this.data.userRemark
    })
  },
  closeTitle() {
    this.setData({
      titleShow: false
    })
  },
  //下一步
  nextStep() {
    if (!this.data.totalItemEstimatePrice) {
      $yjpToast.show({ text: "请选择换货商品"})
      return;
    }
    if (!this.data.swapReason) {
      $yjpToast.show({text: "请选择换货理由"})
      return;
    }
    let returnItems = this.data.retureItems.filter( item => {
      if(item.returnCount > 0) {
        return true;
      } else {
        return false;
      }
    })
    let params = {
      returnItems,
      swapReason: this.data.swapReason,
      userRemark: this.data.userRemark,
      totalItemEstimatePrice: this.data.totalItemEstimatePrice,
      orderId: this.order.orderId
    }
    App.WxService.navigateTo(App.Constants.Route.exchangeTwo, {
      params
    })
  }
})