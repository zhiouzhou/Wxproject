// pages/exchangeSuccess/exchangeFail.js
const App = getApp()
Page({
  data: {
    //失败的时候传过来的只有失败原因
    result: ``,
    payTypeText: ``,
    placeOrderTime: ``,
    submitParams: null//提交订单的参数，用作重新提交订单
  },
  onLoad: function (options) {
    const result = options.data
    const totalPayableAmount = parseFloat(options.totalPayableAmount)
    const currentDeliveryMode = parseInt(options.currentDeliveryMode)
    const currentPayType = parseInt(options.currentPayType)
    const placeOrderTime = options.placeOrderTime
    let payTypeText = options.payTypeText
    this.setData({ result, totalPayableAmount, payTypeText, placeOrderTime, currentDeliveryMode, currentPayType })
  },
  goToHomePage() {
    App.WxService.switchTab(App.Constants.Route.homePage)
  }
})