// pages/compositeActivity/compositeProductList.js
const App = getApp()
import { $yjpToast, $yjpDialog, AddToShopCartJs } from '../../components/yjp.js'
import { ProductUtil, AddToShopCartUtil } from '../../utils/CommonUtils.js'
Page({
  data: {
    windowHeight: 0,
    isVisitor: false,
    productList: [],
    currentPage: 1,
    pageSize: 10,
    addToShopCartNum: 0,
    addToShopCartPrice: `0.00`,
    initing:true,
  },
  onLoad: function (options) {
    Object.assign(this, AddToShopCartJs)
    //获取屏幕的高度
    const systemInfo = App.globalData.systemInfo
    const isVisitorHeight = systemInfo.windowWidth / 750 * 98
    this.setData({
      initing:false,
      windowHeight: systemInfo.windowHeight,
      isVisitorHeight,
      isVisitor: wx.getStorageSync(`isVisitor`),
      categoryId: options.categoryId || ``,
      addToShopCartNum: AddToShopCartUtil.getAddToShopCartNumFromStorage(`exceptLargeCargo`),
      addToShopCartPrice: AddToShopCartUtil.getAddToShopCartPriceFromStorage(`exceptLargeCargo`)
    })
    this.getCompositeActivityList()
  },
  getCompositeActivityList() {
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    App.HttpService.getCompositeActivityList({ categoryId: this.data.categoryId, currentPage: this.data.currentPage, pageSize: this.data.pageSize })
      .then(data => {
        if (data.data.length != 0) {
          let extraProducts = ProductUtil.rebuildProducts(data.data, `compositeActivityList`)
          this.setData({ currentPage: ++this.data.currentPage, productList: this.data.productList.concat(extraProducts) })
        } else if (data.data.length == 0 && this.data.currentPage == 1) {
          this.setData({ productList: [] })
        } else {
          $yjpToast.show({ text: `没有更多数据了` })
        }
        this.setData({ requesting: false })
        wx.hideLoading()
      })
      .catch(e => {
        this.setData({ requesting: false })
        wx.hideLoading()
      })
  },
  loadMore() {
    this.getCompositeActivityList()
  },
  goToProductDetail(e) {
    const activityId = e.currentTarget.dataset.activityId
    App.WxService.navigateTo(App.Constants.Route.comAtyDetail, { activityId })
  }
})