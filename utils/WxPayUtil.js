const App = getApp()
//订单轮询次数
let retryTimes = 0
let payResultRetryTimes = 0
let orderIds = []
let clientDesc=``
/**
 * 发起支付
 * params:orderNOs 订单号
 */
function onRequestPayment(orderNOs) {
  let systemInfo = App.globalData.systemInfo
  //手机品牌;手机型号;微信版本号;操作系统版本;客户端平台;客户端基础库版本;
  clientDesc = `${systemInfo.brand};${systemInfo.model};${systemInfo.version};${systemInfo.system};${systemInfo.platform};${systemInfo.SDKVersion}`
  // let wxLoginCode = ``
  let paymentId = ``
  orderIds = []
  retryTimes = 0
  payResultRetryTimes = 0
  //订单轮询3次
  return this.onOrderPolling(orderNOs)
    //微信小程序支付
    .then(data => {
      return App.HttpService.weChatAppPay({
        data: {
          appId: App.Constants.AppId,
          clientDesc,
          code: data.code,
          payOrderIds: orderIds,
        }
      })
    })
    .then(data => {
      paymentId = data.data.paymentId
      return App.WxService.requestPayment({
        timeStamp: data.data.signParam.timeStamp,
        nonceStr: data.data.signParam.nonceStr,
        package: data.data.signParam.package,
        signType: data.data.signParam.signType,
        paySign: data.data.signParam.paySign,
      })
    })
    .then(data => {
      return this.onlinePaySuccessPolling(paymentId)
    })
}

/**
 * 订单轮询
 */
function onOrderPolling(orderNOs) {
  if (retryTimes >= 15) {
    wx.hideLoading()
    return Promise.reject(`订单轮询失败`)
  }
  return App.HttpService.orderPolling({
    datas: orderNOs
  }).then(data => {
    if (data.data.every(item => item.hasSuccess == true)) {
      data.data.forEach(item => orderIds.push(item.orderId))
      return App.WxService.login()
    } else {
      retryTimes++
      return this.onOrderPolling(orderNOs)
    }
  }).catch(e => {
    wx.hideLoading()
    return Promise.reject(`订单轮询失败`)
  })
}
/**
 * 货到付款订单轮询
 */
function outOrderPolling(orderNOs) {
  if (retryTimes >= 15) {
    wx.hideLoading()
    return Promise.reject(`订单轮询失败`)
  }
  return App.HttpService.orderPolling({
    datas: orderNOs
  }).then(data => {
    if (data.data.every(item => item.hasSuccess == true)) {
      return data
    } else {
      retryTimes++
      return this.outOrderPolling(orderNOs)
    }
  }).catch(e => {
    wx.hideLoading()
    return Promise.reject(`订单轮询失败`)
  })
}
/**
 * 在线支付成功轮询
 */
function onlinePaySuccessPolling(paymentId) {
  if (payResultRetryTimes >= 15) {
    wx.hideLoading()
    return Promise.reject(`支付轮询失败`)
  }
  return App.HttpService.onlinePayPolling({
    data: { clientDesc, paymentId }
  })
    .then(data => {
      if (data.data.paymentState == 10) {
        return Promise.resolve({ result: `支付轮询成功` })
      } else {
        payResultRetryTimes++
        return this.onlinePaySuccessPolling(paymentId)
      }
    }).catch(e => {
      wx.hideLoading()
      return Promise.reject(`支付轮询失败`)
    })
}

module.exports = {
  onRequestPayment, onOrderPolling, outOrderPolling, onlinePaySuccessPolling
}