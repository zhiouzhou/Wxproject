// pages/user/orders/orderDetail.js
import {
  DateUtil
} from '../../../utils/CommonUtils.js'
import {
  $yjpToast,
  OrderOperationJs
} from '../../../components/yjp.js'
const App = getApp()
let countDown
let groupBuyCountDown
const productDisplay = {
  "displayAccumulation": false,
  "displayUnAccumulation": false,
  "displayAvailableBonus": true,
  "displayUnAvailableBonus": true,
  "displayUseCoupon": true,
  "displayNotUseCoupon": true,
  "displayAccumulationInfo": "参与累计",
  "unDisplayAccumulationInfo": "不参与累计",
  "displayAvailableBonusInfo": "可用红包",
  "unDisplayAvailableBonus": "不可用红包",
  "displayUseCouponInfo": "可用优惠券",
  "unDisplayUseCouponInfo": "不可用券"
};
Page({
  data: {
    vm: {},
    orderNO: ``,
    orderDetail: {},
    addressStr: ``,
    item: '',
    productCount: 0,
    sectionBuy: false,
    onlinePayCountDown: ``,
    countDownArr: []

  },
  onLoad: function (options) {
    Object.assign(this, OrderOperationJs)
    wx.hideShareMenu()
    const pjbtnName = App.globalData.settingValue.OrderEvaluationButtonText;
    const orderNO = options.orderNO || ``
    const orderId = options.orderId || ``
    const isGroupBuy = options.isGroupBuy == `true`
    this.setData({
      orderNO,
      pjbtnName,
      orderId,
      isGroupBuy,
    })
  },
  onShow: function () {
    this.getOrderDetail()
  },
  onUnload() {
    countDown = null
    groupBuyCountDown = null
  },
  goToDealerShop(e) {
    const shopId = e.currentTarget.dataset.shopId
    const orderType = e.currentTarget.dataset.orderType
    if (orderType != 2) return
    App.WxService.navigateTo(App.Constants.Route.dealer, {
      shopId
    })
  },
  onSelectInterface() {
    // if (this.data.isGroupBuy) {
    //   return App.HttpService.getGroupBuyOrderDetail({
    //     data: this.data.orderId
    //   })
    // } else {
    return App.HttpService.getOrderDetail({
      orderNO: this.data.orderNO
    })
    // }
  },
  getOrderDetail() {
    let that = this
    const orderNO = this.data.orderNO
    wx.showLoading({
      title: '加载中'
    })
    this.onSelectInterface()
      .then(data => {
        let productCount = this.rebuildOrders(data.data.itemList)
        let BtnObj = this.getBtnObj(data.data);
        if (BtnObj && BtnObj.length > 4) {
          let BtnObj1 = BtnObj.slice(0, 3).reverse();
          let BtnObj2 = BtnObj.slice(3).reverse();
          this.setData({
            BtnObj1,
            BtnObj2
          })
        }
        data.data.serviceTime = data.serviceTime;
        let addressStr = data.data.address.province + data.data.address.city + data.data.address.county + data.data.address.street + data.data.address.detailAddress;
        //拼团头像展示数组长度
        // 1.拼团中，末尾始终展示一个加号，数组长度为已参团人数加一
        // 2.拼团失败，同上，但是加号点击不可分享
        // 3.拼团成功，数组长度为成团人数
        // 4.强制拼团成功，数组长度为成团人数
        let loopTimesArr = this.getloopTimesArr(data.data.groupPurchase)
        this.setData({
          orderNO,
          BtnObj,
          hideBtn: true,
          orderDetail: data.data,
          traceItem: data.data.traceItem,
          addressStr: addressStr,
          address: data.data.address,
          selfPickUpWarehouse: data.data.selfPickUpWarehouse,
          item: data.data, // 即orderDetail cao 
          isLargeCargo: data.data.itemList[0].sourceType == 10, //大宗订单
          isNearExpire: data.data.itemList[0].sourceType == 14, //临期订单
          isdjbx: data.data.itemList[0].sourceType == 16, //独家包销订单
          productCount: productCount,
          loopTimesArr: loopTimesArr,
          vm: {
            isSingleOrder: this.isSingleOrder(data.data.itemList),
            itemList: this.transform(data.data.itemList)
          }
        }, function (e) {
          that.startCountDown()
          wx.hideLoading()
        })
      })
      .catch(e => {
        let error = e;
        this.setData({
          vm: {
            error: true
          }
        }) //error
        wx.hideLoading()
      })

  },
  getloopTimesArr(groupPurchase) {
    //拼团头像展示数组长度
    // 1.拼团中，末尾始终展示一个加号，数组长度为已参团人数加一
    // 2.拼团失败，同上，但是加号点击不可分享
    // 3.拼团成功，数组长度为成团人数
    // 4.强制拼团成功，数组长度为成团人数
    let loopTimesArrlength = !groupPurchase ? 0 :
      groupPurchase.groupPurchaseState == 1 ? groupPurchase.minParticipantCount :
        (groupPurchase.participationCount + 1)
    return loopTimesArrlength ? new Array(loopTimesArrlength) : []
  },

  //开始倒计时
  startCountDown() {
    countDown = null
    let onlinePayCountDown = ``
    countDown = setInterval(() => {
      onlinePayCountDown = DateUtil.getOnlinePayCountDownStr(this.data.orderDetail.createTime)
      if (!onlinePayCountDown && this.data.orderDetail.state == 8) {
        let orderDetail = this.data.orderDetail
        orderDetail.state = 5
        this.setData({ onlinePayCountDown: ``, orderDetail, item: orderDetail })
        clearInterval(countDown)
        countDown = null
      } else {
        this.setData({ onlinePayCountDown })
      }
    }, 1000)
    if (this.data.orderDetail.groupPurchase) {
      groupBuyCountDown = null
      let groupBuycountDownArr = ``
      groupBuyCountDown = setInterval(() => {
        groupBuycountDownArr = DateUtil.getTimestampCountDownArr(this.data.orderDetail.groupPurchase.promotionEndTime)
        if (!groupBuycountDownArr) {
          this.setData({
            countDownArr: [],
            [`orderDetail.groupPurchase.groupPurchaseState`]: 1,
            [`item.groupPurchase.groupPurchaseState`]: 1,
            loopTimesArr: this.getloopTimesArr(this.data.orderDetail.groupPurchase)
          })
          clearInterval(groupBuyCountDown)
          groupBuyCountDown = null
        } else {
          this.setData({ countDownArr: groupBuycountDownArr })
        }
      }, 1000)
    }
  },
  //返回数量 
  rebuildOrders(itemList) {
    let i = 0
    for (let item of itemList) {
      i += item.count
    }
    return i;
  },
  //把item.count 赋值给 item.product.count 
  transform(itemList) {
    for (let item of itemList) {
      item.product.count = item.count;
      item.product.sourceType = item.sourceType;
      item.product.giftSourceDesc = item.giftSourceDesc;
      this.getDisplayTagText(item.product);
    }
    return itemList;
  },
  //判断订单length  含赠品 
  isSingleOrder(itemList) {
    if (!itemList.length) {
      return;
    }
    if (itemList.length == 1) {
      return 1;
    } else if (itemList.length == 2) {
      for (let order of itemList) {
        if (order.giftProduct) {
          return 1;
        }
      }
      return 0;
    } else {
      return 0;
    }
  },
  //订单按钮个数
  getBtnObj(order) {
    let obj = {};
    let btnObj = [];
    if (order.canCancelOrder) {
      obj = {
        text: '取消订单',
        key: 8
      }
      btnObj.unshift(obj)
    }
    if (order.alreadyEvaluate) {
      obj = {
        text: '查看评价',
        key: 1
      }
      btnObj.unshift(obj)
    }
    if (order.canDeleteOrder) {
      obj = {
        text: '删除订单',
        key: 2
      }
      btnObj.unshift(obj)
    }
    if (order.canReturnOrder) {
      obj = {
        text: '申请退货',
        key: 3
      }
      btnObj.unshift(obj)
    }
    if (order.canSwappable) {
      obj = {
        text: '申请换货',
        key: 4
      }
      btnObj.unshift(obj)
    }
    if (order.canEvaluate) {
      obj = {
        text: '评价并确认收货',
        key: 5
      }
      btnObj.unshift(obj)
    }
    if (order.canComplain) {
      obj = {
        text: '订单投诉',
        key: 6
      }
      btnObj.unshift(obj)
    }
    if (order.canBuyAgain) {
      obj = {
        text: '再次购买',
        key: 7
      }
      btnObj.unshift(obj)
    }

    return btnObj;
  },
  orderOprate(e) {
    let btnObj = e.currentTarget.dataset.orderObj;
    if (btnObj.key == 1) {

      this.goToEvaluate(e)
    } else if (btnObj.key == 2) {

      this.deleteOrder(e)
    } else if (btnObj.key == 3) {

      this.applyReturnOrder(e)
    } else if (btnObj.key == 4) {

      this.exchangeOrder(e)
    } else if (btnObj.key == 5) {

      this.evaluateOrder(e)
    } else if (btnObj.key == 6) {

      this.complaintOrder(e)
    } else if (btnObj.key == 7) {

      this.buyAgain(e)
    } else if (btnObj.key == 8) {

      this.cancelOrder(e)
    }
  },
  //产品促销提示
  getDisplayTagText(product) {
    product.bonusText = true && product.isUseBonus && productDisplay.displayAvailableBonusInfo ? productDisplay.displayAvailableBonusInfo : ``
    product.unBonusText = true && !product.isUseBonus && productDisplay.unDisplayAvailableBonus ? productDisplay.unDisplayAvailableBonus : ``
    product.couponText = true && product.isUseCoupon && productDisplay.displayUseCouponInfo ? productDisplay.displayUseCouponInfo : ``
    product.unCouponText = true && !product.isUseCoupon && productDisplay.unDisplayUseCouponInfo ? productDisplay.unDisplayUseCouponInfo : ``
    return product
  },
  //查看商品清单列表
  goToOrderGoodsList(e) {
    const tag = e.currentTarget.dataset.tag
    const types = 1
    let productList = this.data.vm.itemList
    let productDataList = JSON.stringify(productList);
    let list = encodeURIComponent(productDataList)
    App.WxService.navigateTo(App.Constants.Route.orderGoodsList, {
      productList: list,
      tag,
      types,
      needdecodeURI: true
    })
  },
  //申请退货
  applyReturnOrder(e) {
    let orderDetail = e.currentTarget.dataset.orderdetail || this.data.orderDetail
    if (orderDetail.itemList.length > 5) {
      App.WxService.navigateTo(App.Constants.Route.applyReturnOrderList, {
        orderDetail
      })
      return;
    }
    App.WxService.navigateTo(App.Constants.Route.applyReturnOrder, {
      orderDetail
    })
  },
  //订单追踪
  goToOrderTrack(e) {
    let orderNO = e.currentTarget.dataset.orderNO;
    App.WxService.navigateTo(App.Constants.Route.orderTrack, {
      orderNO
    })
  },
  goToProductDetail(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    const nearExpireId = e.currentTarget.dataset.nearExpireId || ''
    let sourceType = e.currentTarget.dataset.sourceType
    if (sourceType == 5) {
      App.WxService.navigateTo(App.Constants.Route.comAtyDetail, {
        activityId: productSkuId
      })
    } else if (sourceType == 10) {
      App.WxService.navigateTo(App.Constants.Route.adventProductDetail, {
        bulk: 1,
        productSkuId
      })
    } else if (sourceType == 14) {
      App.WxService.navigateTo(App.Constants.Route.adventProductDetail, {
        bulk: 2,
        nearExpireId
      })
    } else {
      App.WxService.navigateTo(App.Constants.Route.productDetail, {
        productSkuId
      })
    }
  },
  //查看评价 
  goToEvaluate(e) {
    let orderNO = e.currentTarget.dataset.orderNO || this.data.orderNO
    App.WxService.navigateTo(App.Constants.Route.orderValuationDetail, {
      orderNO
    })
  },
  //重新扫描
  reScan() {
    App.WxService.scanCode()
      .then(data => {
        this.setData({
          orderNO: data.result
        })
        this.getOrderDetail()
      })
      .catch(e => $yjpToast.show({
        text: e.desc
      }))
  },
  //再次购买
  closePop(e) {
    this.setData({
      sectionBuy: false
    })
  },
  hideBtnAction() {
    this.data.hideBtn = !this.data.hideBtn;
    this.setData({
      hideBtn: this.data.hideBtn
    });
  },
  //去拼团详情页
  goToGroupBuyDetail(e) {
    const groupPurchaseId = e.currentTarget.dataset.groupPurchaseId
    App.WxService.navigateTo(App.Constants.Route.groupBuyDetail, { groupPurchaseId })
  },
  onShareAppMessage() {
    let { orderDetail } = this.data
    let productName = orderDetail.itemList[0].product.productName
    let image = orderDetail.itemList[0].product.imgUrl
    let groupPurchaseId = orderDetail.groupPurchase.groupPurchaseId
    let userDetail = wx.getStorageSync(`userDetail`)
    let cityId = userDetail.cityId
    let userDisplayClassName = userDetail.userDisplayClassName
    let userClassId = userDisplayClassName == `烟酒店` ? 0 : userDisplayClassName == `餐饮店` ? 1 : userDisplayClassName == `便利店` ? 2 : 0
    let userDisplayClass = userDetail.userDisplayClassId
    return {
      title: `${productName}火热拼团中`,
      imageUrl: image,
      path: `${App.Constants.Route.groupBuyDetail}?isFromShare=true&groupPurchaseId=${groupPurchaseId}&cityId=${cityId}&userClassId=${userClassId}&userDisplayClass=${userDisplayClass}`
    }
  }

})