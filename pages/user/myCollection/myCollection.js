// pages/user/myCollection/myCollection.js
const App = getApp()
import { $yjpToast, $yjpDialog, AddToShopCartJs, ProductPromotions, ApplyBuyJs } from '../../../components/yjp.js'
import { AddToShopCartUtil, ProductUtil } from '../../../utils/CommonUtils.js'
Page({
  data: {
    currentPage: 1,
    pageSize: 10,
    productList: [],
    initing: true,
    isFromCollect:true,
    isEmpty: false
  },

  onLoad: function (options) {
    Object.assign(this, AddToShopCartJs, ProductPromotions, ApplyBuyJs)
    this.getProductList()
    const productListCouponDesc = wx.getStorageSync(`appSetting`).productListCouponDesc || ``

    const isVisitor = wx.getStorageSync(`isVisitor`)
    const settingValue = App.globalData.settingValue
    const UnLoginPriceDesc = settingValue.UnLoginPriceDesc || `登录后查看价格`
    const PendingAuditPriceDesc = settingValue.PendingAuditPriceDesc || `审核通过后可以查看价格`
    const hiddenPriceText = isVisitor ? UnLoginPriceDesc : App.globalData.userDetail.state != 1 ? PendingAuditPriceDesc : ``//隐藏价格提示

    //列表优惠卷提示计算时的金额
    let userCouponMoney = AddToShopCartUtil.getUserCouponMoneyforDefault()
    let currentProductMoney = AddToShopCartUtil.getUserMoneyforDefault()
    this.setData({
      hiddenPriceText,
      windowHeight: App.globalData.systemInfo.windowHeight,
      userCouponMoney,
      currentProductMoney,
      productListCouponDesc,
      //列表优惠卷提示
      userCouponPrompt: AddToShopCartUtil.getUserCouponPrompt(currentProductMoney,userCouponMoney),
      addToShopCartNum: AddToShopCartUtil.getAddToShopCartNumFromStorage(`exceptLargeCargo`),
      addToShopCartPrice: AddToShopCartUtil.getAddToShopCartPriceFromStorage(`exceptLargeCargo`),
    })
  },
  getProductList() {
    let { currentPage, pageSize } = this.data
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({
      title: '加载中',
    })
    App.HttpService.queryUserFavorites({ currentPage, pageSize })
      .then(data => this.processData(data))
      .catch(e => { this.setData({ requesting: false, initing: false }); wx.hideLoading() })
  },

  //处理商品数据
  processData(data) {
    if (data.data.length != 0) {
      let extraProducts = ProductUtil.rebuildProducts(data.data, `productList`)
      this.setData({ currentPage: ++this.data.currentPage, productList: this.data.productList.concat(extraProducts) })
    } else if (data.data.length == 0 && this.data.currentPage == 1) {
      this.setData({ productList: [], isEmpty: true })
    } else {
      $yjpToast.show({ text: `没有更多数据了` })
    }
    this.setData({ requesting: false, initing: false })
    wx.hideLoading()
  },
  //加载更多
  loadMore() {
    this.getProductList()
  },
  //商品详情
  goToProductDetail(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    App.WxService.navigateTo(App.Constants.Route.productDetail, { productSkuId })
  },
  //独家包销产品详情
  goToUnderWriteProductDetail(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    App.WxService.navigateTo(App.Constants.Route.productDetail, {
      productSkuId: productSkuId,
      isUnderwriting: 'true'
    })
  },
  goPromotions(e) {
    let item = e.currentTarget.dataset.tag;
    this.promotions(item);
  },
  //去购物车
  goToShopCart() {
    App.WxService.switchTab(App.Constants.Route.shopCart)
  },
  //点击到货通知
  onArrivalNotice(e) {
    let { productList } = this.data
    const productSkuId = e.currentTarget.dataset.productSkuId
    let index = productList.findIndex(item => item.productSkuId == productSkuId)
    return App.HttpService.saveArrivalNotice({ data: productSkuId })
      .then(data => {
        $yjpToast.show({ text: `如果1个月内到货，系统将以短息的形式发送到您手机上` })
        this.setData({ [`productList[${index}].alreadyArrivalNotice`]: true })
      })
      .catch(e => $yjpToast.show({ text: e }))
  },
  //已订阅到货通知
  alreadyNotice() {
    $yjpToast.show({ text: `您已订阅该商品的到货通知` })
  },
  hideCouponDiscountTip() {
    this.setData({
      productListCouponDesc: null
    })
  },
  //返回首页
  backHome() {
    App.WxService.switchTab(App.Constants.Route.homePage)
  }
})