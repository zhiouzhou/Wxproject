// pages/promoAndDiscount/promoAndDiscount.js
const App = getApp()
import { $yjpToast, AddToShopCartJs, ProductPromotions } from '../../components/yjp.js'
import { AddToShopCartUtil, DateUtil, ProductUtil, FunctionUtils } from '../../utils/CommonUtils.js'
import { onlyRecommendInit, ListProductRecommend, loadMoreRecommendList } from '../../components/recommendListFn.js'

Page({
  data: {
    labelId: ``,
    categoryType: 0,
    currentPage: 1,
    pageSize: 20,
    productList: [],
    isFromShare:false,
    activities: [],
    initing: true,
    productListCouponDesc: '',
    recommendList: [],//为您推荐list 
    recommendType:3
  },
  onLoad: function (options) {
    Object.assign(this, AddToShopCartJs, ProductPromotions)
    const isFromShare = options.isFromShare == `true`
    const settingValue = App.globalData.settingValue
    const labelId = settingValue.ClearanceCategoryLabelId || ``//（清仓区、爆品区 Id）
   
    const systemInfo = App.globalData.systemInfo
    const categoryType = options.categoryType == undefined ? 0 : parseInt(options.categoryType)//爆品特价(0),清仓特价(1),打折特价(2),组合特价(3),凑单特价(4),限时特价(5);
    const promotionType = options.promotionType != undefined ? parseInt(options.promotionType) :
      categoryType == 2 ? 3 : categoryType == 4 ? 6 : categoryType == 5 ? 4 : -1
    const isVisitor = wx.getStorageSync(`isVisitor`) || false
    //游客模式提示
    const UnLoginPriceDesc = settingValue.UnLoginPriceDesc || `登录后查看价格`
    const PendingAuditPriceDesc = settingValue.PendingAuditPriceDesc || `审核通过后可以查看价格`
    const hiddenPriceText = isVisitor ? UnLoginPriceDesc : App.globalData.userDetail.state != 1 ? PendingAuditPriceDesc : ``//隐藏价格提示
    const isVisitorHeight = systemInfo.windowWidth / 750 * 98
    
    const productListCouponDesc = wx.getStorageSync(`appSetting`).productListCouponDesc || ``
    //列表优惠卷提示计算时的金额
    let userCouponMoney = AddToShopCartUtil.getUserCouponMoneyforDefault()
    let currentProductMoney = AddToShopCartUtil.getUserMoneyforDefault()
    this.setData({
      windowHeight: systemInfo.windowHeight - systemInfo.windowWidth / 750 * 268,
      labelId, categoryType, promotionType, isVisitor, isVisitorHeight, hiddenPriceText,
      addToShopCartNum: AddToShopCartUtil.getAddToShopCartNumFromStorage(`exceptLargeCargo`),
      userCouponMoney: userCouponMoney, productListCouponDesc,
      currentProductMoney,
      isFromShare,
      //限时惠的起送提示
      userSendPrompt: AddToShopCartUtil.getUserSendPrompt(currentProductMoney),
      //列表优惠卷提示
      userCouponPrompt: AddToShopCartUtil.getUserCouponPrompt(currentProductMoney,userCouponMoney),
      addToShopCartPrice: AddToShopCartUtil.getAddToShopCartPriceFromStorage(`exceptLargeCargo`)
    })
    this.getListData(categoryType)
  },

  switchMenu(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({ categoryType: parseInt(tag), currentPage: 1, productList: [], activities: [] })
    this.getListData(parseInt(tag))
  },

  getListData(categoryType) {
    let recommendType = this.transformRecommendRequestData(categoryType)
    this.setData({ recommendType })
    // FunctionUtils.bindNomalTalkingDataEvent("优惠特价情况分析", { categoryType: categoryType })
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    let { labelId, currentPage, pageSize, promotionType } = this.data
    if (categoryType == 0) {//赚钱精选
      return App.HttpService.queryProposeProducts({ currentPage, pageSize })
        .then(data => this.processProductList(data))
        .catch(e => {
          wx.hideLoading()
          this.setData({ requesting: false })
          $yjpToast.show({ text: e })
        })
    } else if (categoryType == 1) {//清仓特价
      return App.HttpService.queryProductList({ currentPage, pageSize, labelId })
        .then(data => this.processProductList(data))
        .catch(e => {
          wx.hideLoading()
          this.setData({ requesting: false })
          $yjpToast.show({ text: e })
        })
    } else if (categoryType == 2) {//打折特价
      return App.HttpService.queryActivitys({ currentPage, pageSize, data: { promotionType: 3 } })
        .then(data => this.processActivities(data))
        .catch(e => {
          wx.hideLoading()
          this.setData({ requesting: false })
          $yjpToast.show({ text: e })
        })
    } else if (categoryType == 3) {//组合特价
      return App.HttpService.getCompositeActivityList({ currentPage, pageSize })
        .then(data => this.processProductList(data, true))
        .catch(e => {
          wx.hideLoading()
          this.setData({ requesting: false })
          $yjpToast.show({ text: e })
        })
    } else if (categoryType == 4) {//凑单特价
      return App.HttpService.queryActivitys({ currentPage, pageSize, data: { promotionType: 6 } })
        .then(data => this.processActivities(data))
        .catch(e => {
          wx.hideLoading()
          this.setData({ requesting: false })
          $yjpToast.show({ text: e })
        })
    } else if (categoryType == 5) {//限时特价
      return App.HttpService.queryActivitys({ currentPage, pageSize, data: { promotionType: 4 } })
        .then(data => this.processActivities(data))
        .catch(e => {
          wx.hideLoading()
          this.setData({ requesting: false })
          $yjpToast.show({ text: e })
        })
    }
  },
  loadMore(e) {
    this.getListData(this.data.categoryType)
  },
  processProductList(data, isZuhe = false) {
    if (data.data && data.data.length != 0) {
      let extraProducts = ProductUtil.rebuildProducts(data.data, isZuhe ? `compositeActivityList` : `activityDetail`)
      this.setData({ currentPage: ++this.data.currentPage,isEmpty:false, productList: this.data.productList.concat(extraProducts) })
    } else if (data.data.length == 0 && this.data.currentPage == 1) {
      this.setData({ productList: [],isEmpty:true})
      onlyRecommendInit(this)
      ListProductRecommend(this);
    } else {
      $yjpToast.show({ text: `没有更多数据了` })
    }
    this.setData({ requesting: false, initing: false })
    wx.hideLoading()
  },
  processActivities(data) {
    if (data.data && data.data.length) {
      let extraProducts = data.data.map(item => {
        //如果是会员专享活动,是否显示会员专享信息
        item.showMember = null;
        //打折促销和凑单活动不显示会员优惠信息
        if (item.productTags && item.promotionType != 3 && item.promotionType != 6) {
          item.productTags.forEach(tag => {
            if (tag.tagType == 97) {
              item.showMember = tag.tagDetail;
            }
          })
        }
        item.isHeader = true
        item.activityTimeNotice = DateUtil.getActivityTimeNotice(item.startTime, item.endTime, item.state)
        return item
      })
      this.setData({ currentPage: ++this.data.currentPage, productList: this.data.productList.concat(extraProducts) })
      this.getActivitiesProducts(data.data)
    } else {
      this.setData({ productList: [], isEmpty: true,initing:false})
      onlyRecommendInit(this)
      ListProductRecommend(this);
    }
    this.setData({ requesting: false })
    wx.hideLoading()
  },
  getActivitiesProducts(newActivities) {
    let productList = this.data.productList
    for (let activity of newActivities) {
      let pageSize = 20
      if (newActivities && newActivities.length>10){
        pageSize = 8
      }
      App.HttpService.getActivityProduct({ currentPage: 1, pageSize: pageSize, data: activity.activityId }, activity.promotionType)
        .then(data => {
          //如果是会员专享；商品下面的标签显示；**会员**元 单位
          for (let product of data.data) {
            product.productTags.forEach(tag => {
              if (tag.tagType == 97) {
                // tag.memberInfo = data.data.userLevelName + data.data. 
                tag.memberInfo = '';
                product.userLevelPrices && product.userLevelPrices.forEach(price => {
                  tag.memberInfo += price.userLevelName + price.userLevelPrice + '元' + price.priceUnit + ';'
                })
              }
            })
          }

          const activityTemp = activity
          //找到插入产品列表的位置
          let insertIndex = productList.findIndex(item => item.activityId == activityTemp.activityId) + 1
          //将活动信息放入产品数据中，跳转需要
          let newProducts = ProductUtil.rebuildProducts(data.data, `activityDetail`, activityTemp.activityId)
          //将活动信息放入产品，比如限时惠等等的会员购买限制
          for (let newProduct of newProducts) {
            newProduct.enjoyUserLevelDiscount = activity.enjoyUserLevelDiscount
            let levelTag = undefined
            if (activity.productTags && activity.productTags.length) {
              levelTag = activity.productTags.find(item => item.tagType == 97)
            }
            newProduct.levelNotice = levelTag ? levelTag.tagDetail : ``
          }
          productList.splice(insertIndex, 0, ...newProducts)
          this.setData({ productList })
        })
    }
  },
  goToProductDetail(e) {
    const activityId = e.currentTarget.dataset.activityId
    const productSkuId = e.currentTarget.dataset.productSkuId
    const sourceId = e.currentTarget.dataset.sourceId || productSkuId
    let { categoryType, productList } = this.data
    if (categoryType == 0 || categoryType == 1) {
      App.WxService.navigateTo(App.Constants.Route.productDetail, { productSkuId })
    } else if (categoryType == 3) {
      App.WxService.navigateTo(App.Constants.Route.comAtyDetail, { activityId })
    } else if (categoryType == 2 || categoryType == 4 || categoryType == 5) {
      let revserseList = productList.slice(0).reverse()
      let productIndex = revserseList.findIndex(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
      revserseList = revserseList.slice(productIndex, revserseList.length)
      let activityItem = revserseList.find(item => item.activityId != undefined)
      App.WxService.navigateTo(App.Constants.Route.productDetail, {
        productSkuId,
        activityId: activityItem.activityId,
        activityName: activityItem.name,
        activityStartTime: activityItem.startTime,
        activityEndTime: activityItem.endTime,
        activityState: 2,
        promotionType: activityItem.promotionType,
        enjoyUserLevelDiscount: activityItem.enjoyUserLevelDiscount
      })
    }
  },
  goToActivityDetail(e) {
    const activityId = e.currentTarget.dataset.activityId
    const promotionType = parseInt(e.currentTarget.dataset.promotionType)
    App.WxService.navigateTo(App.Constants.Route.atyDetail, { activityId, promotionType })
  },
  goPromotions(e) {
    let item = e.currentTarget.dataset.tag;
    this.promotions(item);
  },
  //去首页
  goToHomePage() {
    App.WxService.switchTab(App.Constants.Route.homePage)
  },
  hideCouponDiscountTip() {
    this.setData({
      productListCouponDesc: null
    })
  },
  loadMoreRecommendList() {
    loadMoreRecommendList(this)
  },
  transformRecommendRequestData(categoryType){
    switch (categoryType) {
      case 2:
        return 4;
        break;
      case 3:
        return 6;
        break;
      case 4:
        return 7;
        break;
      case 5:
        return 5;
        break;
      default: 
      return 3
        break;
    }
  }
})