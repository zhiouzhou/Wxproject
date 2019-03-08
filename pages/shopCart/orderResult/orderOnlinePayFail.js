const App = getApp()
import { WxPayUtil, FunctionUtils } from '../../../utils/CommonUtils.js'
import { $yjpToast } from '../../../components/yjp.js'
Page({
  data: {
    //失败的时候传过来的只有失败原因
    result: ``,
    payTypeText: `微信支付`,
    placeOrderTime: ``,
    orderNOs: null,//提交订单的参数，用作重新提交订单
    isGoToShopcart: false,
    shopcartType: 0,
    lastOddBalanceAmount: 0
  },
  onLoad: function (options) {
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '购买分析-订单提交失败', eventType: 507 })
    const result = options.data
    const canChangePayType = options.canChangePayType == `true`
    const totalPayableAmount = parseFloat(options.totalPayableAmount)
    const currentDeliveryMode = parseFloat(options.currentDeliveryMode)
    const orderNOs = JSON.parse(options.orderNOs)
    const placeOrderTime = options.placeOrderTime
    const istemporary = options.istemporary == `true`
    const isLargeCargo = options.isLargeCargo == `true`
    const isDealer = options.isDealer == `true`
    const canBackShopCart = options.canBackShopCart == `true`
    const lastOddBalanceAmount = parseFloat(options.lastOddBalanceAmount)
    this.setData({ result, totalPayableAmount, placeOrderTime, orderNOs, currentDeliveryMode, canChangePayType, istemporary, isLargeCargo, canBackShopCart, lastOddBalanceAmount, isDealer })

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
  //重试支付订单
  retryPay() {
    wx.showLoading({
      title: '提交中',
      mask: true
    })
    let { orderNOs, totalPayableAmount, placeOrderTime, payTypeText, canChangePayType, currentDeliveryMode, istemporary, isLargeCargo, canBackShopCart, lastOddBalanceAmount, isDealer } = this.data
    WxPayUtil.onRequestPayment(orderNOs)
      .then(data => {
        wx.hideLoading()
        App.WxService.redirectTo(App.Constants.Route.orderOnlinePaySuccess, { data, totalPayableAmount, payTypeText, placeOrderTime, istemporary, isLargeCargo, canBackShopCart })
      })
      .catch(e => {
        wx.hideLoading()
        App.WxService.redirectTo(App.Constants.Route.orderOnlinePayFail, { data: `微信支付失败`, totalPayableAmount, payTypeText, orderNOs: JSON.stringify(orderNOs), placeOrderTime, canChangePayType, currentDeliveryMode, istemporary, isLargeCargo, canBackShopCart, lastOddBalanceAmount, isDealer })
      })
  },
  //转货到付款
  changePayType() {
    wx.showLoading({
      title: '提交中',
      mask: true
    })
    let { orderNOs, placeOrderTime, totalPayableAmount, currentDeliveryMode, istemporary, isLargeCargo, canBackShopCart, lastOddBalanceAmount, isDealer } = this.data
    let params = []
    orderNOs.forEach(item => params.push({ orderNo: item, payMode: 0, payType: 0 }))
    App.HttpService.changeOrderPayType({ data: params })
      .then(data => {
        wx.hideLoading()
        App.WxService.redirectTo(App.Constants.Route.orderResultSuccess, { data: {}, totalPayableAmount, currentDeliveryMode, currentPayType: 0, placeOrderTime, istemporary, isLargeCargo, canBackShopCart, lastOddBalanceAmount, isDealer,isChangePayType:true })
      })
      .catch(e => {
        wx.hideLoading()
        $yjpToast.show({ text: e })
      })
  }
})