// pages/user/orders/orders.js
const App = getApp()
import { DateUtil, FunctionUtils } from '../../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog, OrderOperationJs } from '../../../components/yjp.js'
Page({
  data: {
    isEmpty: false,
    currentPage: 1,
    pageSize: 5,
    orders: [],
    sectionBuy: false
  },
  onLoad: function (options) {
    Object.assign(this, OrderOperationJs)
    const orderState = parseInt(options.bundleData)
    const isVisitor = wx.getStorageSync(`isVisitor`)
    const systemInfo = App.globalData.systemInfo;
    const pjbtnName = App.globalData.settingValue.OrderEvaluationButtonText;
    this.setData({ orderState: orderState, isVisitor, windowHeight: systemInfo.windowHeight * systemInfo.pixelRatio, pjbtnName })
  },
  onShow: function () {
    this.setData({
      orders: [],
      currentPage: 1,
    })
    this.getOrders()

  },
  getOrders() {
    let { currentPage, pageSize, orderState } = this.data
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    return App.HttpService.queryOrders({ currentPage, pageSize, state: orderState })
      .then(data => {
        if (data.data.length) {
          let extraOrders = this.rebuildOrders(data.data)
          if (currentPage == 1) {
            this.setData({ currentPage: ++this.data.currentPage, orders: extraOrders })
          } else {
            this.setData({ currentPage: ++this.data.currentPage, orders: this.data.orders.concat(extraOrders) })
          }
        } else if (data.data.length == 0 && this.data.currentPage == 1) {
          this.setData({
            orders: [],
            isEmpty: true
          })
        } else {
          $yjpToast.show({ text: `没有更多数据了` })
        }
        this.setData({ requesting: false })
        wx.hideLoading()
      })
      .catch(e => {
        this.setData({ requesting: false });
        wx.hideLoading()
      })
  },
  rebuildOrders(orders) {
    for (let order of orders) {
      let i = 0
      for (let item of order.items) {
        if (item.giftProduct) {
          i += item.count;
        } else {
          i += item.count * this.createProductXs(item.product)
        }

      }
      order.totalCount = i
      //订单的支付倒计时初始化
      order.onlinePayCountDown = DateUtil.getOnlinePayCountDownMinuteStr(order.createTime)
    }
    return orders
  },
  createProductXs(product) {
    //拆包商品点击加减时要乘以系数
    if (product.saleSpecQuantity == product.specQuantity) {
      product.XS = 1;
    } else {
      product.XS = product.saleSpecQuantity;
    }
    return product.XS;
  },
  loadMore() {
    this.getOrders()
  },
  //去订单详情
  goToOrderDetail(e) {
    const order = e.currentTarget.dataset.order
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '订单处理-订单查看', eventType: 604, actionId: order.orderNO })
    if (order.classify == 3) {
      App.WxService.navigateTo(App.Constants.Route.orderDetail, { orderNO: order.orderNO, orderId: order.orderId, isGroupBuy: true })
    } else {
      App.WxService.navigateTo(App.Constants.Route.orderDetail, { orderNO: order.orderNO, orderId: order.orderId })
    }
  },
  //去经销商店铺
  goToDealerShop(e) {
    const shopId = e.currentTarget.dataset.shopId
    const orderType = e.currentTarget.dataset.orderType
    if (shopId && orderType == 2) {
      App.WxService.navigateTo(App.Constants.Route.dealer, { shopId })
    }
  },
  //去首页
  backHome() {
    App.WxService.switchTab(App.Constants.Route.homePage)

  },
  // 全部订单
  allOrder() {
    this.setData({
      orderState: -1,
      orders: [],
      isEmpty: false,
      currentPage: 1,
    })
    this.getOrders();
  },
  //待付款
  paymentOrder() {
    this.setData({
      orderState: 8,
      orders: [],
      isEmpty: false,
      currentPage: 1,
    })
    this.getOrders();
  },
  //待收货
  receivedOrder() {
    this.setData({
      orderState: 20,
      orders: [],
      isEmpty: false,
      currentPage: 1,
    })
    this.getOrders();
  },
  //待评价
  pendingEvaluate() {
    this.setData({
      orderState: 9,
      orders: [],
      isEmpty: false,
      currentPage: 1,
    })
    this.getOrders();
  },
  //已完成
  completed() {
    this.setData({
      orderState: 3,
      orders: [],
      isEmpty: false,
      currentPage: 1,
    })
    this.getOrders();
  },
  //再次购买
  closePop(e) {
    this.setData({
      sectionBuy: false
    })
  }
})