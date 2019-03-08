// pages/user/orderReturn/orderReturn.js
const App = getApp()
import { ProductUtil, DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'
Page({
  data: {
    defaultId: 1,//默认的id值
    returnTitles: [{ name: '退货中', id: 1 }, { name: '已退货', id: 2 }, { name: '已取消', id: 3 }, { name: '已拒绝', id: 4 }],
    exchangeTitles: [{ name: '换货中', id: 1 }, { name: '已换货', id: 2 }, { name: '已取消', id: 3 }, { name: '已拒绝', id: 4 }],
    orderState: 1,
    currentPage: 1,
    pageSize: 5,
    orders: [],//退货单
    changeOrders: [],//换货单
    applyOrders: [],//申请退换单
    vm: {},
    orderType: 2,  //0 退货单   1 换货单 
    applyCount: 0,
    returnCount: 0,
    swapCount: 0,
  },
  onLoad: function (options) {
    const systemInfo = App.globalData.systemInfo;
    this.setData({
      windowHeight: systemInfo.windowHeight * systemInfo.pixelRatio
    })
    this.getApplyOrders();
  },
  onShow: function () {
    this.getOrderCount();
  },
  // 选择title
  choseTitle: function (e) {
    let { orderType } = this.data
    this.setData({
      orderState: parseInt(e.currentTarget.id),
      defaultId: parseInt(e.currentTarget.id),
      currentPage: 1,
      orders: [],
      changeOrders: [],
    });
    if (orderType == 0) {
      this.getOrders()
    } else if (orderType == 1) {
      this.getChangeOrders()
    } else if (orderType == 2) {
      this.getApplyOrders()
    }

  },
  //获取总数量
  getOrderCount() {
    App.HttpService.getOrderCount({})
      .then(data => {
        this.setData({
          returnCount: data.data.orderCount.returnIng,
          swapCount: data.data.orderCount.swapCount
        })
      })
  },
  getOrders() {
    let { currentPage, pageSize, orderState, } = this.data
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    return App.HttpService.queryReturnOrders({ currentPage, pageSize, orderState: orderState })
      .then(data => {
        if (data.data.length) {
          let extraOrders = this.rebuildOrders(data.data)
          if (currentPage == 1) {
            this.setData({ currentPage: ++this.data.currentPage, orders: extraOrders, vm: { isEmpty: false } })
          } else {
            this.setData({ currentPage: ++this.data.currentPage, orders: this.data.orders.concat(extraOrders), vm: { isEmpty: false } })
          }
        } else if (data.data.length == 0 && this.data.currentPage == 1) {
          this.setData({
            orders: [],
            vm: { isEmpty: true }
          })
        } else {
          $yjpToast.show({ text: `没有更多数据了` })
        }
        this.setData({ requesting: false })
        wx.hideLoading()
      })
      .catch(e => { this.setData({ requesting: false }); wx.hideLoading() })
  },
  getChangeOrders() {
    let { currentPage, pageSize, orderState } = this.data
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    return App.HttpService.querySwapOrders({ currentPage, pageSize, data: orderState })
      .then(data => {
        if (data.data.length) {
          let extraOrders = this.rebuildChangeOrders(data.data)
          if (currentPage == 1) {
            this.setData({ currentPage: ++this.data.currentPage, changeOrders: extraOrders, vm: { isEmpty: false } })
          } else {
            this.setData({ currentPage: ++this.data.currentPage, changeOrders: this.data.changeOrders.concat(extraOrders), vm: { isEmpty: false } })
          }
        } else if (data.data.length == 0 && this.data.currentPage == 1) {
          this.setData({
            changeOrders: [],
            vm: { isEmpty: true }
          })
        } else {
          $yjpToast.show({ text: `没有更多数据了` })
        }
        this.setData({ requesting: false })
        wx.hideLoading()
      })
      .catch(e => { this.setData({ requesting: false }); wx.hideLoading() })
  },
  //修改换货单数据
  rebuildChangeOrders(orders) {
    for (let order of orders) {
      let i = 0
      let j = 0
      for (let item of order.swapItems) {
        if (item.productSaleSpecQuantity == item.productSpecQuantity) {
          item.swapCount = item.count;
          i += item.count;
        } else {
          item.swapCount = item.count * item.productSaleSpecQuantity
          i += item.count * item.productSaleSpecQuantity
        }
      }
      for (let item of order.returnItems) {
        if (item.productSaleSpecQuantity == item.productSpecQuantity) {
          item.returnCount = item.count;
          j += item.count;
        } else {
          item.returnCount = item.count * item.productSaleSpecQuantity
          j += item.count * item.productSaleSpecQuantity
        }
      }
      //item.product  item.returnCount
      order.swapTotalCount = i
      order.returnTotalCount = j
    }
    return orders
  },
  //修改退货单数据
  rebuildOrders(orders) {
    for (let order of orders) {
      let i = 0
      for (let item of order.items) {
        if (item.product.saleSpecQuantity == item.product.specQuantity) {
          item.product.returnCount = item.returnCount;
          i += item.returnCount;
        } else {
          item.product.returnCount = item.returnCount * item.product.saleSpecQuantity
          i += item.returnCount * item.product.saleSpecQuantity
        }

      }
      //item.product  item.returnCount
      order.totalCount = i
    }
    return orders
  },
  //去订单详情
  goToOrderDetail(e) {
    const orderNO = e.currentTarget.dataset.orderNO
    const orderType = e.currentTarget.dataset.orderType
    const orderId = e.currentTarget.dataset.orderId
    App.WxService.navigateTo(App.Constants.Route.orderReturnDetail, { orderNO, orderType, orderId })
  },

  //取消退货
  cancelOrder(e) {
    const orderType = e.currentTarget.dataset.orderType
    const orderNO = e.currentTarget.dataset.orderNO
    App.HttpService.cancelReturnOrder({ orderNO })
      .then(data => {
        $yjpToast.show({ text: `已成功取消退货！` })
        this.setData({ currentPage: 1 })
        if (orderType == 0) {
          this.getOrders()
        } else if (orderType == 1) {
          this.getChangeOrders()
        } else if (orderType == 2) {
          this.getApplyOrders()
        }
      }).catch(error => {
        $yjpToast.show({ text: error })
      })
  },
  //删除订单 
  deleteReturnOrder(e) {
    let orderNO = e.currentTarget.dataset.orderNO
    let that = this
    $yjpDialog.open({
      title: '温馨提示', dialogType: `defaultText`,
      dialogData: { text: `您确认删除订单吗？` },
      onConfirm: () => {
        App.HttpService.deleteReturnOrder({ orderNO })
          .then(data => {
            $yjpToast.show({ text: `删除成功` })
            that.setData({ currentPage: 1 })
            that.getOrders()
          }).catch(e => $yjpToast.show({ text: e }))
      }
    })
  },
  //订单追踪
  traceOrder(e) {
    let orderNO = e.currentTarget.dataset.orderNO
    const types = 1 //type==1 为退货订单物流信息
    App.WxService.navigateTo(App.Constants.Route.orderTrack, { orderNO, types })
  },

  gotoHomePage() {
    App.WxService.switchTab(App.Constants.Route.homePage, {})
  },

  loadMore() {
    let { orderType } = this.data
    if (orderType == 0) {
      this.getOrders()
    } else if (orderType == 1) {
      this.getChangeOrders()
    } else if (orderType == 2) {
      this.getApplyOrders()
    }
  },
  //退货单
  chooseReturn() {
    this.setData({
      orderType: 0,
      orderState: 1,
      defaultId: 1,
      currentPage: 1,
      pageSize: 5,
      orders: [],
      changeOrders: [],
      applyOrders: []
    })
    this.getOrders();
  },
  //换货单
  chooseExchange() {
    this.setData({
      orderType: 1,
      currentPage: 1,
      orderState: 1,
      defaultId: 1,
      pageSize: 5,
      changeOrders: [],
      orders: [],
      applyOrders: []
    })
    this.getChangeOrders()
  },

  // ******************************************************************申请售后部分*************************************************************************
  //选择申请售后
  chooseApply() {
    this.setData({
      orderType: 2,
      currentPage: 1,
      orderState: 1,
      defaultId: 1,
      pageSize: 5,
      changeOrders: [],
      orders: [],
      applyOrders: []
    })
    this.getApplyOrders()
  },
  //去订单详情
  goToApplyOrderDetail(e) {
    const orderNO = e.currentTarget.dataset.orderNO
    App.WxService.navigateTo(App.Constants.Route.orderDetail, { orderNO: orderNO })
  },
  getApplyOrders() {
    let { currentPage, pageSize } = this.data
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    return App.HttpService.getCanSwapOrders({ currentPage, pageSize })
      .then(data => {
        if (data.data.length) {
          let extraOrders = this.rebuildApplyOrders(data.data)
          if (currentPage == 1) {
            this.setData({ currentPage: ++this.data.currentPage, applyOrders: extraOrders, vm: { isEmpty: false } })
          } else {
            this.setData({ currentPage: ++this.data.currentPage, applyOrders: this.data.applyOrders.concat(extraOrders), vm: { isEmpty: false } })
          }
        } else if (data.data.length == 0 && this.data.currentPage == 1) {
          this.setData({
            applyOrders: [],
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

  rebuildApplyOrders(orders) {
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
  //跳转换货申请
  exchangeOrder(e) {
    let that = this
    const orderNO = e.currentTarget.dataset.orderNO
    wx.showLoading({ title: '加载中' })
    App.HttpService.getOrderDetail({ orderNO })
      .then(data => {
        let orderDetail = data.data;
        data.data.serviceTime = data.serviceTime;
        if (orderDetail.canSwappable == true) {
          App.WxService.navigateTo(App.Constants.Route.exchangeOne, {
            order: orderDetail
          });
        } else {
          $yjpToast.show({ text: `该订单不支持换货` })
        }
        wx.hideLoading()
      })
      .catch(e => {
        let error = e;
        this.setData({
          vm: {
            error: true
          }
        })
        wx.hideLoading()  //error
      })

  },
  //申请退货
  exreturnOrder(e) {
    let that = this
    const orderNO = e.currentTarget.dataset.orderNO
    wx.showLoading({ title: '加载中' })
    App.HttpService.getOrderDetail({ orderNO })
      .then(data => {
        let orderDetail = data.data;
        data.data.serviceTime = data.serviceTime;
        if (orderDetail.canReturnOrder == true) {
          if (orderDetail.itemList.length > 5) {
            App.WxService.navigateTo(App.Constants.Route.applyReturnOrderList, { orderDetail })
          }else{
            App.WxService.navigateTo(App.Constants.Route.applyReturnOrder, { orderDetail })
          }
        } else {
          $yjpToast.show({ text: `该订单不支持退货` })
        }

        wx.hideLoading()
      })
      .catch(e => {
        let error = e;
        this.setData({
          vm: {
            error: true
          }
        })   //error
        wx.hideLoading()
      })
  },
  //去经销商店铺
  goToDealerShop(e) {
    const shopId = e.currentTarget.dataset.shopId
    const orderType = e.currentTarget.dataset.orderType
    if (shopId && orderType == 2) {
      App.WxService.navigateTo(App.Constants.Route.dealer, { shopId })
    }
  },
})