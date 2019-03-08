// pages/user/groupBuying/groupBuyList.js
const App = getApp();
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog, OrderOperationJs } from '../../../components/yjp.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    windowHeight: 0,
    currentPage: 1,
    pageSize: 20,
    data: -1,
    orders: [],
    isEmpty: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const systemInfo = App.globalData.systemInfo;
    let stateHeight = systemInfo.windowWidth / 750 * 88;
    const settingValue = App.globalData.settingValue;
    const cityId = wx.getStorageSync(`userDetail`).cityId
    let userDisplayClassName = wx.getStorageSync(`userDetail`).userDisplayClassName
    let userClassId = userDisplayClassName == `烟酒店` ? 0 : userDisplayClassName == `餐饮店` ? 1 : userDisplayClassName == `便利店` ? 2 : 0
   let  userDisplayClass = wx.getStorageSync(`userDetail`).userDisplayClassId
    this.setData({
      windowHeight: systemInfo.windowHeight - stateHeight,
      cityId,
      userClassId,
      userDisplayClass
    })
    this.getData()
  },
  getData() {
    let { currentPage, pageSize, data } = this.data
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    App.HttpService.getGroupBuyList({ currentPage, pageSize, data })
      .then(data => {
        if (data.data && data.data.length) {
          let extraOrders = this.rebuildOrders(data.data)
          console.log(extraOrders)
          if (currentPage == 1) {
            this.setData({ currentPage: ++this.data.currentPage, orders: extraOrders })
          } else {
            this.setData({ currentPage: ++this.data.currentPage, orders: this.data.orders.concat(extraOrders) })
          }
        } else if ((!data.data || data.data.length == 0) && this.data.currentPage == 1) {
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
    console.log(orders)
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
  //去订单详情
  gotoOrderDetail(e) {
    const orderId = e.currentTarget.dataset.orderId
    const orderNO = e.currentTarget.dataset.orderNO
    console.log(orderNO)
    App.WxService.navigateTo(App.Constants.Route.orderDetail, { orderId, orderNO, isGroupBuy: true })
  },
  //去拼购详情
  gotoGroupBuyDetail(e) {
    const groupPurchaseId = e.currentTarget.dataset.data
    App.WxService.navigateTo(App.Constants.Route.groupBuyDetail, { groupPurchaseId })
  },
  //订单追踪
  goToOrderTrack(e) {
    let orderNO = e.currentTarget.dataset.orderNO;
    App.WxService.navigateTo(App.Constants.Route.orderTrack, {
      orderNO
    })
  },
  //全部拼团订单
  allOrder() {
    this.setData({
      data: -1,
      currentPage: 1,
      orders: [],
      isEmpty: false,
    })
    this.getData()
  },
  //拼团中
  paymentOrder() {
    this.setData({
      data: 0,
      currentPage: 1,
      orders: [],
      isEmpty: false,
    })
    this.getData()
  },
  //已拼成
  receivedOrder() {
    this.setData({
      data: 1,
      currentPage: 1,
      orders: [],
      isEmpty: false,
    })
    this.getData()
  },
  //已失败
  pendingEvaluate() {
    this.setData({
      data: 2,
      currentPage: 1,
      orders: [],
      isEmpty: false,
    })
    this.getData()
  },
  backHome() {
    App.WxService.switchTab(App.Constants.Route.homePage)

  },
  onShareAppMessage(res){
    console.log(res.target.dataset)
    let groupPurchaseId = res.target.dataset.groupPurchaseId;
    let imageUrl = res.target.dataset.imageUrl;
    let productName = res.target.dataset.productName;
    if(res.from === 'button'){
      return this.onClickShareButton(groupPurchaseId, imageUrl, productName)
    }
  },
  onClickShareButton(groupPurchaseId, imageUrl, productName){
    let { cityId, userClassId, userDisplayClass} = this.data
    console.log(groupPurchaseId)
    return {
      title: `${productName}火热拼团中`,
      imageUrl: `${imageUrl}`,
      path: `${App.Constants.Route.groupBuyDetail}?isFromShare=true&groupPurchaseId=${groupPurchaseId}&cityId=${cityId}&userClassId=${userClassId}&userDisplayClass=${userDisplayClass}`
    }
  }
})