
const App = getApp()
import { $yjpToast, $yjpDialog, AddToShopCartJs, ProductPromotions, ApplyBuyJs } from '../../../components/yjp.js'
import { AddToShopCartUtil, DateUtil, ProductUtil } from '../../../utils/CommonUtils.js'
Page({
  data: {
    initing: true,
    isSelfSale: false,
    isYJPDelivery: false,
    isHasStock: false,
    productList: [],
    productListCouponDesc: ''
  },
  onLoad: function (options) {
    this.setData({ initing: true })
    Object.assign(this, AddToShopCartJs, ProductPromotions, ApplyBuyJs)
    this.onSelectInterface(options)
    this.getProductList()
  },
  onSelectInterface(options) {
    const isVisitor = wx.getStorageSync(`isVisitor`)
    const settingValue = App.globalData.settingValue
    const systemInfo = App.globalData.systemInfo
    const currentPage = 1
    const pageSize = 20
    const productListCouponDesc = wx.getStorageSync(`appSetting`).productListCouponDesc || ``
    //列表优惠卷提示计算时的金额
    let userCouponMoney = AddToShopCartUtil.getUserCouponMoneyforDefault()
    let currentProductMoney = AddToShopCartUtil.getUserMoneyforDefault()

    //存储查询参数
    this.setData({
      windowHeight: systemInfo.windowHeight,
      currentPage, pageSize,
      userCouponMoney,
      currentProductMoney,
      productListCouponDesc,
      //列表优惠卷提示
      userCouponPrompt: AddToShopCartUtil.getUserCouponPrompt(currentProductMoney,userCouponMoney),
      addToShopCartNum: AddToShopCartUtil.getAddToShopCartNumFromStorage(`exceptLargeCargo`),
      addToShopCartPrice: AddToShopCartUtil.getAddToShopCartPriceFromStorage(`exceptLargeCargo`)
    })
  },
  //获取常购清单产品列表
  getProductList() {
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({
      title: '加载中',
    })
    return App.HttpService.getAlwaysBuyList({})
      .then(data => this.processData(data))
      .catch(e => { this.setData({ requesting: false, initing: false }); wx.hideLoading() })
  },
  //处理商品数据
  processData(data) {
    if (data.data.length != 0) {
      let extraProducts = ProductUtil.rebuildProducts(data.data, `productList`)
      this.setData({ currentPage: ++this.data.currentPage, productList: this.data.productList.concat(extraProducts) })
    } else if (data.data.length == 0 && this.data.currentPage == 1) {
      this.setData({ productList: [] })
    } else {
      $yjpToast.show({ text: `没有更多数据了` })
    }
    this.setData({ requesting: false, initing: false })
    wx.hideLoading()
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
  // 返回顶部
  backToTop() {
    this.setData({ scrollPosition: 'top' })
  },
  //去登录
  goToLogin() {
    App.WxService.reLaunch(App.Constants.Route.login)
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
  //去购物车
  goToShopCart() {
    App.WxService.switchTab(App.Constants.Route.shopCart)
  },
  hideCouponDiscountTip() {
    this.setData({
      productListCouponDesc: null
    })
  }

})