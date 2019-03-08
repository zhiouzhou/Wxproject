// pages/shopCart/orderResultFail.js
import { FunctionUtils } from '../../../utils/CommonUtils.js'

const App = getApp()
Page({
  data: {
    //失败的时候传过来的只有失败原因
    result: ``,
    payTypeText: ``,
    placeOrderTime: ``,
    submitParams: null,//提交订单的参数，用作重新提交订单
    isGoToShopcart: false,
    shopcartType: 0
  },
  onLoad: function (options) {
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '购买分析-订单提交失败', eventType: 507 })
    const result = options.data
    const totalPayableAmount = parseFloat(options.totalPayableAmount)
    const currentDeliveryMode = parseInt(options.currentDeliveryMode)
    const currentPayType = parseInt(options.currentPayType)
    const submitParams = JSON.parse(options.submitParams)
    const placeOrderTime = options.placeOrderTime
    const istemporary = options.istemporary == `true`
    const isLargeCargo = options.isLargeCargo == `true`
    const canBackShopCart = options.canBackShopCart == `true`
    let payTypeText =
      currentPayType == 0 && currentDeliveryMode == 4 ? `现款现结` :
        currentPayType == 0 ? `货到付款` : currentPayType == 1 ? `微信支付` :
          currentPayType == 2 ? `支付宝支付` : currentPayType == 3 ? `银联支付` :
            currentPayType == 5 ? `连连支付` : currentPayType == 6 ? `易酒贷` :
              currentPayType == 10 ? `已在线支付` : currentPayType == 11 ? `线下转账` :
                currentPayType == 12 ? `经销商收款` : `货到付款`
    this.setData({ result, totalPayableAmount, payTypeText, placeOrderTime, currentDeliveryMode, currentPayType, submitParams, istemporary, isLargeCargo, canBackShopCart })

    let isGoToShopcart = false
    let shopcartType = 0 //0:满减购物车    1：大宗购物车 2：临期购物车
    if (istemporary || isLargeCargo) {
      // 临期或者大宗购物车
      let arr = istemporary ? wx.getStorageSync(`adventProductData`) : isLargeCargo ? wx.getStorageSync(`bulkProductData`) : []
      if (arr && arr.length) {
        isGoToShopcart = true
        shopcartType = istemporary ? 2 : 1
      } else {
        isGoToShopcart = false
      }
      this.setData({ isGoToShopcart, shopcartType })
    } else {
      this.setData({ isGoToShopcart: canBackShopCart })
    }
  },
  goToHomePage() {
    App.WxService.switchTab(App.Constants.Route.homePage)
  },
  goToShopCart(e) {
    const shopcartType = e.currentTarget.dataset.shopcartType
    if (shopcartType == 0) {
      App.WxService.switchTab(App.Constants.Route.shopCart)
    } else if (shopcartType == 1) {
      App.WxService.redirectTo(App.Constants.Route.adventProductCart, { bulk: 1 })
    } else if (shopcartType == 2) {
      App.WxService.redirectTo(App.Constants.Route.adventProductCart, { bulk: 2 })
    }
  },
  //重试提交订单
  retrySubmitOrder() {
    let { submitParams, totalPayableAmount, currentDeliveryMode, currentPayType, placeOrderTime, istemporary, isLargeCargo, canBackShopCart } = this.data
    App.HttpService.orderSubmit({ datas: submitParams })
      .then(data => {
        App.WxService.redirectTo(App.Constants.Route.orderResultSuccess, { data, totalPayableAmount, currentDeliveryMode, currentPayType, placeOrderTime, istemporary, isLargeCargo, canBackShopCart })
      })
      .catch(e => {
        App.WxService.redirectTo(App.Constants.Route.orderResultFail, { data: e, totalPayableAmount, currentDeliveryMode, currentPayType, submitParams: JSON.stringify(submitParams), placeOrderTime, istemporary, isLargeCargo, canBackShopCart })
      })
  }
})