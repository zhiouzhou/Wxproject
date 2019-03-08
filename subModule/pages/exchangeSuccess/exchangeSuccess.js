// pages/exchangeSuccess/exchangeSuccess.js
const App = getApp()
Page({
  data: {
    result: {},
    payTypeText: ``,
    placeOrderTime: ``,
  },
  onLoad: function (options) {
    const result = JSON.parse(options.data)
    const totalPayableAmount = parseFloat(options.totalPayableAmount)
    const currentDeliveryMode = parseInt(options.currentDeliveryMode)
    const currentPayType = parseInt(options.currentPayType)
    const placeOrderTime = options.placeOrderTime
    let payTypeText =
      currentPayType == 0 && currentDeliveryMode == 4 ? `现款现结` :
        currentPayType == 0 ? `货到付款` : currentPayType == 1 ? `微信支付` :
          currentPayType == 2 ? `支付宝支付` : currentPayType == 3 ? `银联支付` :
            currentPayType == 5 ? `连连支付` : currentPayType == 6 ? `易酒贷` :
              currentPayType == 10 ? `已在线支付` : currentPayType == 11 ? `线下转账` :
                currentPayType == 12 ? `经销商收款` : `货到付款`
    this.setData({ result, totalPayableAmount, payTypeText, placeOrderTime, currentDeliveryMode, currentPayType })
  },
  goToHomePage() {
    App.WxService.switchTab(App.Constants.Route.homePage)
  },
  onlinePay() {

  }
})