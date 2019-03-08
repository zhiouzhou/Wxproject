// pages/shopCart/orderResultSuccess.js
const App = getApp()
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'
import { ProductUtil,FunctionUtils } from '../../../utils/CommonUtils.js'
import { onlyRecommendInit, ListProductRecommend, loadMoreRecommendList } from '../../../components/recommendListFn.js'
Page({
  data: {
    result: {},
    payTypeText: ``,
    placeOrderTime: ``,
    isGoToShopcart: false,
    shopcartType: 0,
    lastOddBalanceAmount: 0,
    showOrderCouponDialog: true,
    recommendType: 9
  },
  onLoad: function (options) {
    onlyRecommendInit(this)
    ListProductRecommend(this);
    const systemInfo = App.globalData.systemInfo
    const result = JSON.parse(options.data)
    let totalPayableAmount = parseFloat(options.totalPayableAmount)
    const currentDeliveryMode = parseInt(options.currentDeliveryMode)
    const lastOddBalanceAmount = parseInt(options.lastOddBalanceAmount)
    const currentPayType = parseInt(options.currentPayType)
    const placeOrderTime = options.placeOrderTime
    const istemporary = options.istemporary == `true`
    const isLargeCargo = options.isLargeCargo == `true`
    const canBackShopCart = options.canBackShopCart == `true`
    const isChangePayType = options.isChangePayType == `true`
    const isDealer = options.isDealer == `true`
    const isYjpOrder = options.isYjpOrder == `true`
    let payTypeText =
      currentPayType == 0 && currentDeliveryMode == 4 ? `现款现结` :
        currentPayType == 0 ? `货到付款` : currentPayType == 1 ? `微信支付` :
          currentPayType == 2 ? `支付宝支付` : currentPayType == 3 ? `银联支付` :
            currentPayType == 5 ? `连连支付` : currentPayType == 6 ? `易酒贷` :
              currentPayType == 10 ? `已在线支付` : currentPayType == 11 ? `线下转账` :
                currentPayType == 12 ? `经销商收款` : `货到付款`

    //转货到付款成功了要考虑零头的变化
    if (isChangePayType && App.globalData.appSetting.oddBalanceMode == 0 && !isDealer) {
      totalPayableAmount = totalPayableAmount - (totalPayableAmount + lastOddBalanceAmount) % 1
    }
    //如果是易酒批订单，查询订单优惠券领取活动列表
    if (isYjpOrder){
      this.getOrderCoupons(result.data)
    }
    this.setData({ result, totalPayableAmount, payTypeText, placeOrderTime, currentDeliveryMode, currentPayType, istemporary, isLargeCargo, canBackShopCart, lastOddBalanceAmount, isDealer, isChangePayType, windowHeight: systemInfo.windowHeight,isYjpOrder })

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
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '购买分析-订单提交成功', eventType: 506, actionId: result.data[0] })
    setTimeout(() => {
      FunctionUtils.submitTalkingData()
    }, 1000)
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
  //获取订单优惠券列表
  getOrderCoupons(param){
    App.HttpService.getorderCoupons({
      datas: param
    }).then(data => {
        if(data.data && data.data.length > 0){
          for (let item of data.data) {
            item.receiveCoupon = false
          }
          this.setData({
            orderCouponsArr: data.data,
            hasOrderCoupons: true
          })
        }
      })
      .catch(e => $yjpToast.show({ text: e }))
  },
  //领取优惠券
  receiveOrderCoupon(e){
    let idx = e.currentTarget.dataset.idx
    let promotionId = e.currentTarget.dataset.promotionId
    const orderCouponsArr = this.data.orderCouponsArr
    App.HttpService.receiveOrderCoupon({
      data: promotionId
    }).then(data => {
      this.setData({
        [`orderCouponsArr[${idx}].receiveCoupon`]: true
      })
    }).catch(e => $yjpToast.show({ text: e }))
  },
  //跳转优惠券定向品类列表
  useOrderCoupon(e){
    let templateId = e.currentTarget.dataset.couponid
    App.WxService.navigateTo(App.Constants.Route.couponProduct, { templateId })
  },
  //关闭订单优惠券弹窗
  closeOrderCouponDialog(){
    this.setData({
      showOrderCouponDialog: false
    })
  },
  // 返回顶部
  backToTop() {
    this.setData({ scrollPosition: 'top' })
  },
  loadMoreRecommendList() {
    loadMoreRecommendList(this)
  }
})