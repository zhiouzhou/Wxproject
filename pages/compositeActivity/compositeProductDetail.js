// pages/compositeActivity/compositeProductDetail.js
//会员专享，送货地址，产品跳转，马上进货
const App = getApp()
import { $yjpToast, $yjpDialog, AddToShopCartJs, SwitchAddressJs } from '../../components/yjp.js'
import { ProductUtil, AddToShopCartUtil, DateUtil, FunctionUtils } from '../../utils/CommonUtils.js'
Page({
  data: {
    windowHeight: 0,
    activityId: ``,
    isFromShare: false,
    activityDetail: {},
    productList: [],
    detailAddressText: ``,
    minBuyAmount: 0
  },
  getGlobalData() {
    const userDetail = App.globalData.userDetail
    const userState = userDetail.state
    const auditRejectionReason = userDetail.auditRejectionReason || ``
    const isVisitor = wx.getStorageSync(`isVisitor`)
    const systemInfo = App.globalData.systemInfo
    let userAddress = wx.getStorageSync(`userAddress`) || []
    userAddress = userAddress.filter(item => item.state == 0 || item.state == 1)
    this.setData({
      userState, auditRejectionReason,
      isVisitor, userAddress,
      windowHeight: systemInfo.windowHeight,
      detailAddressText: this.getDetailAddressText(userAddress, App.globalData.addressId),
    })
  },
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中',
    })
    Object.assign(this, AddToShopCartJs, SwitchAddressJs)
    //活动Id
    const activityId = options.activityId || ``
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: "活动详情分析", actionId: activityId, subType:3, eventType: 401 })

    const isFromShare = options.isFromShare == `true`
    this.setData({ activityId, isFromShare })
    if (isFromShare) {
      return App.HttpService.autoLogin()
        .then(data => {
          this.getGlobalData()
          return Promise.resolve(data)
        })
        .then(data => {
          if (data) {
            return App.HttpService.getCompositeActivityShareDetail({ "data": activityId })
              .then(data1 => {
                if (!data1 || !data1.data) {
                  $yjpToast.show({ text: `活动不存在` })
                  setTimeout(() => App.WxService.redirectTo(App.Constants.Route.comAtyList), 1500)
                  return Promise.reject(``)
                } else {
                  return Promise.resolve(data1)
                    .then(data2 => this.processProductData(data2))
                }
              })
              .catch(e => {
                setTimeout(() => App.WxService.redirectTo(App.Constants.Route.comAtyList), 1500)
                return Promise.reject(``)
              })
          } else {
            App.WxService.redirectTo(App.Constants.Route.login, { shareFail: true })
            return Promise.reject(``)
          }
        })
    } else {
      return App.HttpService.getCompositeActivityDetail({ activityId })
        .then(data => {
          this.getGlobalData()
          return Promise.resolve(data)
        })
        .then(data => {
          this.processProductData(data)
        })
    }
  },
  onShow: function(){
    //获取订单起送金额接口
    App.HttpService.getOrderMinBuyAmount()
      .then(data => {
        App.globalData.orderMinBuyAmount = data.data || 0
        const minBuyAmount = App.globalData.orderMinBuyAmount >= 0 ? App.globalData.orderMinBuyAmount : App.globalData.appSetting.minBuyAmount
        this.setData({ minBuyAmount })
      }) 
  },
  processProductData(data) {
    let { isVisitor, userState, isFromShare } = this.data
    //分享返回的商品可能不是同一个商品
    if (isFromShare) {
      this.setData({ activityId: data.data.activityId })
    }
    let activityDetail = ProductUtil.rebuildProduct(data.data, `compositeProductDetail`)
    //游客模式提示
    const settingValue = App.globalData.settingValue;
    const UnLoginPriceDesc = settingValue.UnLoginPriceDesc || `登录后查看价格`
    const PendingAuditPriceDesc = settingValue.PendingAuditPriceDesc || `审核通过后可以查看价格`
    const UnLoginBuyDesc = settingValue.UnLoginBuyDesc || `登录后购买，立即登录`
    const PendingAuditBuyDesc = settingValue.PendingAuditBuyDesc || `审核通过后可以购买`
    const hiddenPriceText = isVisitor ? UnLoginPriceDesc : userState != 1 ? PendingAuditPriceDesc : ``//隐藏价格提示
    let hiddenBuyText = ``//登录底栏
    if (isVisitor) {
      hiddenBuyText = activityDetail.packagePrice ? UnLoginBuyDesc : UnLoginPriceDesc
    } else if (userState != 1 && !activityDetail.packagePrice) {
      hiddenBuyText = PendingAuditBuyDesc
    }
    this.setData({
      activityDetail,
      hiddenPriceText, hiddenBuyText,
      addShopCartObj: {
        count: activityDetail.buyNum,
        productSkuId: activityDetail.activityId,
        productSaleSpecId: activityDetail.activityId,
        saleSpecQuantity: 1,
        productType: 2,
        saleSpecId: activityDetail.activityId,
        sellingPrice: activityDetail.packagePrice,
        sellingPriceUnit: activityDetail.priceUnit,
        sourceId: activityDetail.activityId,
        minBuyNum: activityDetail.minBuyNum,
        maxBuyNum: activityDetail.maxBuyNum,
        addShopCartUnit: activityDetail.priceUnit
      },
      productList: activityDetail.items,
      cantBuy: this.getActivityState(activityDetail).cantBuy,
      cantBuyText: this.getActivityState(activityDetail).cantBuyText
    })
    wx.hideLoading()
  },
  getActivityState(activityDetail) {
    const hasNotBegin = DateUtil.compareDate(activityDetail.beginDate, wx.getStorageSync(`serviceTime`))
    const hasEnd = DateUtil.compareDate(wx.getStorageSync(`serviceTime`), activityDetail.endDate)
    //活动状态不为已发布
    let cantBuy = activityDetail.state != 2 || hasNotBegin || hasEnd || !activityDetail.enjoyUserLevelDiscount || (activityDetail.stockCount == 0 && !hasNotBegin && !hasEnd && activityDetail.state != 3)
    let cantBuyText = activityDetail.state != 2 ? `活动已下架` :
      hasNotBegin ? `活动未开始` :
        hasEnd ? `活动已结束` :
          !activityDetail.enjoyUserLevelDiscount ? `您的会员等级不够，暂时不能购买` :
            (activityDetail.stockCount == 0 && !hasNotBegin && !hasEnd && activityDetail.state != 3) ? `商品已抢光` : ``
    return { cantBuy, cantBuyText }
  },
  goToProductDetail(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    const hideProduct = !!e.currentTarget.dataset.hideProduct
    if (hideProduct) {
      $yjpToast.show({ text: `此产品为更高等级会员专享` })
    } else {
      App.WxService.navigateTo(App.Constants.Route.productDetail, { productSkuId })
    }
  },
  deliveryModeAddressTip(e) {
    let { activityDetail } = this.data
    //deliveryMode	配送方式 0-可配送可自提， 1-可配送 ，2-可自提
    activityDetail.deliveryMode = e
    this.setData({ activityDetail })
  },
  backToTop() {
    this.setData({ scrollPosition: 'top' })
  },
  goToShopCart() {
    App.WxService.switchTab(App.Constants.Route.shopCart)
  },
  goToLogin() {
    App.WxService.reLaunch(App.Constants.Route.login)
  },
  onShareAppMessage: function () {
    return {
      path: `${App.Constants.Route.comAtyDetail}?isFromShare=true&activityId=${this.data.activityId}`
    }
  },
  //去首页
  goToHomePage() {
    App.WxService.switchTab(App.Constants.Route.homePage)
  }
})