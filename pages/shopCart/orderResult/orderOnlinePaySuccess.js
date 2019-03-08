// pages/shopCart/orderResultSuccess.js
const App = getApp()
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'
import { ProductUtil, FunctionUtils} from '../../../utils/CommonUtils.js'
import { onlyRecommendInit, ListProductRecommend, loadMoreRecommendList } from '../../../components/recommendListFn.js'

Page({
  data: {
    result: {},
    payTypeText: `微信支付`,
    placeOrderTime: ``,
    isGoToShopcart: false,
    shopcartType: 0,
    showOrderCouponDialog: true,
    recommendType: 9
  },
  onLoad: function (options) {
    onlyRecommendInit(this)
    ListProductRecommend(this);
    const systemInfo = App.globalData.systemInfo
    const result = JSON.parse(options.data)
    const totalPayableAmount = parseFloat(options.totalPayableAmount)
    const placeOrderTime = options.placeOrderTime
    const istemporary = options.istemporary == `true`
    const isLargeCargo = options.isLargeCargo == `true`
    const isGroupBuy = options.isGroupBuy == `true`
    const canBackShopCart = options.canBackShopCart == `true`
    const orderNOs = JSON.parse(options.orderNOs)
    const isYjpOrder = options.isYjpOrder == `true`
    //如果是易酒批订单，查询订单优惠券领取活动列表
    if (isYjpOrder) {
      this.getOrderCoupons(orderNOs)
    }
    this.setData({ result, totalPayableAmount, placeOrderTime, istemporary, isLargeCargo, isGroupBuy, canBackShopCart, orderNOs,isYjpOrder, windowHeight: systemInfo.windowHeight})

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
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '购买分析-订单提交成功', eventType: 506, actionId: orderNOs[0]})
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
  goToOrderDetail(e) {
    const orderNO = e.currentTarget.dataset.orderNO
    App.WxService.navigateTo(App.Constants.Route.orderDetail, { orderNO })
  },
  //获取订单优惠券列表
  getOrderCoupons(param) {
    App.HttpService.getorderCoupons({
      datas: param
    }).then(data => {
      if (data.data && data.data.length > 0) {
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
  receiveOrderCoupon(e) {
    let idx = e.currentTarget.dataset.idx
    let promotionId = e.currentTarget.dataset.promotionId
    const orderCouponsArr = this.data.orderCouponsArr
    App.HttpService.receiveOrderCoupon({
      data: promotionId
    }).then(data => {

    }).catch(e => $yjpToast.show({ text: e }))
    this.setData({
      [`orderCouponsArr[${idx}].receiveCoupon`]: true
    })
  },
  //跳转优惠券定向品类列表
  useOrderCoupon(e) {
    let templateId = e.currentTarget.dataset.couponid
    App.WxService.navigateTo(App.Constants.Route.couponProduct, { templateId })
  },
  //关闭订单优惠券弹窗
  closeOrderCouponDialog() {
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