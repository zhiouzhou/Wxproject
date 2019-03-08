// pages/product/productDetail.js
const App = getApp()
import { $yjpToast, $yjpDialog, AddToShopCartJs, SwitchAddressJs, CheckDetailJS, DealerReceiveCouponsJs, ApplyBuyJs } from '../../components/yjp.js'
import { AddToShopCartUtil, DateUtil, ProductUtil } from '../../utils/CommonUtils.js'
import { onlyRecommendInit, ListProductRecommend, loadMoreRecommendList } from '../../components/recommendListFn.js'

Page({
  data: {
    bottomBarState: 0,
    userState: -1,
    initing: true,
    isFromShare:false,
    minBuyAmount: 0,//订单起送金额
    recommendList: [],//为您推荐list 
    recommendType: 0
  },
  onLoad: function (options) {
    this.recommendCurrentPage = 1;
    this.recommendPageSize = 20;
    wx.showLoading({
      title: '加载中',
    })
    this.setData({ initing: true })
    const userDetail = App.globalData.userDetail;
    const userState = userDetail.state;
    const auditRejectionReason = userDetail.auditRejectionReason || ``;
    this.setData({ userState, auditRejectionReason })
    Object.assign(this, AddToShopCartJs, SwitchAddressJs, CheckDetailJS, DealerReceiveCouponsJs, ApplyBuyJs)
    this.onSelectInterface(options)
      .then(data => {
        this.getGlobalData()
        return Promise.resolve(data)
      })
      .then(data => {
        this.processProductData(data)
        this.setData({ initing: false })
        wx.hideLoading()
      })
      .catch(e => {
        $yjpToast.show({ text: e })
        this.setData({ initing: false })
        wx.hideLoading()
      })
    onlyRecommendInit(this)
    ListProductRecommend(this)
  },
  getOrderMinBuyAmount: function(){
    //获取订单起送金额接口
    App.HttpService.getOrderMinBuyAmount()
      .then(data => {
        App.globalData.orderMinBuyAmount = data.data || 0
        const minBuyAmount = App.globalData.orderMinBuyAmount >= 0 ? App.globalData.orderMinBuyAmount : App.globalData.appSetting.minBuyAmount
        this.setData({ minBuyAmount })
      })    
  },
  onTagTap(e) {
    let item = e.currentTarget.dataset.tag
    switch (item.tagType) {
      case 7:
        this.ruleDetail(item)
        break;
      case 18:
        this.fullCutDetail(item)
        break;
      default:
        break;
    }
  },
  processProductData(data) {
    let { isVisitor, userState, activityId, isLargeCargo, promotionType, isFromShare } = this.data
    if (data.data.enjoyPromotions && data.data.enjoyPromotions.length > 0){
      data.data.enjoyPromotions = [{ promotionType, promotionWatermark: data.data.enjoyPromotions[0].promotionWatermark }]
    }else{
      data.data.enjoyPromotions = [{ promotionType }]
    }
    //分享返回的商品可能不是同一个商品
    if (isFromShare) {
      this.setData({ productSkuId: data.data.productSkuId })
    }
    //如果是包销产品，则给data.data对象添加isUnderwriting属性
    if (data.data.saleMode == 8) {
      data.data.isUnderwriting = this.data.isUnderwriting
    }
    let productDetail = ProductUtil.rebuildProduct(data.data, `productDetail`, activityId, isLargeCargo)
    //如果商品已下架提示商品已下架
    if (productDetail && productDetail.productState == 0) {
      $yjpToast.show({ text: `该商品已下架` })
    }
    //隐藏价格
    const settingValue = App.globalData.settingValue;
    const UnLoginPriceDesc = settingValue.UnLoginPriceDesc || `登录后查看价格`
    const PendingAuditPriceDesc = settingValue.PendingAuditPriceDesc || `审核通过后可以查看价格`
    const UnLoginBuyDesc = settingValue.UnLoginBuyDesc || `登录后购买，立即登录`
    const PendingAuditBuyDesc = settingValue.PendingAuditBuyDesc || `审核通过后可以购买`
    const hiddenPriceText = isVisitor ? UnLoginPriceDesc : userState != 1 ? PendingAuditPriceDesc : ``//隐藏价格提示

    let hiddenBuyText = ``//登录底栏

    if (isVisitor) {
      hiddenBuyText = productDetail.productPrice.price ? UnLoginBuyDesc : UnLoginPriceDesc
    } else if (userState != 1 && !productDetail.productPrice.price) {
      hiddenBuyText = PendingAuditBuyDesc
    }
    this.getOrderMinBuyAmount()

    //经销商产品领券
    let hasCoupon = productDetail.productTags && productDetail.productTags.length && productDetail.productTags.findIndex(item => item.tagType == 17) != -1
    productDetail.hasCoupon = hasCoupon
    if (productDetail.hasCoupon) {
      productDetail.couponTag = productDetail.productTags.find(item => item.tagType == 17)
    }
    //给促销活动里加入促销和立减的信息
    let hasReduce = !!productDetail.productPrice.reducePrice
    let hasPromotionInfo = !!productDetail.promotionInfo
    if (hasPromotionInfo) {
      if (productDetail.promotionTags) {
        productDetail.promotionTags.unshift({ tagName: `促销`, tagDetail: productDetail.promotionInfo })

      } else {
        productDetail.promotionTags = [{ tagName: `促销`, tagDetail: productDetail.promotionInfo }]
      }

    }
    if (productDetail.promotionTags) {
      productDetail.promotionTags.forEach(tag => {
        if (tag.tagType == 18) {
          let tagDetail = '';
          tag.tagItemDetails.forEach(item => {
            tagDetail += item.tagDesc + ';'
          })
          tag.tagDetail = tagDetail;
        }
      })
    }
    if (productDetail.imgsUrl && productDetail.imgsUrl.length==0){
       productDetail.imgsUrl[0] ='/assets/images/defaul_product.png'
    }
    
    this.activityPriceTagShow(productDetail)
    productDetail.addShopCartUnit = (productDetail.productSkuId == productDetail.productSaleSpecId) ? productDetail.saleUnit : productDetail.minUnit
    this.setData({
      productDetail,
      hiddenPriceText, hiddenBuyText,
      addShopCartObj: {
        count: productDetail.buyNum,
        productSkuId: productDetail.productSkuId,
        productSaleSpecId: productDetail.productSaleSpecId,
        saleSpecQuantity: productDetail.saleSpecQuantity,
        productType: productDetail.productType,
        saleSpecId: productDetail.productSaleSpecId,
        sellingPrice: productDetail.mainPrice,
        sellingPriceUnit: productDetail.priceunit,
        sourceId: productDetail.sourceId,
        minBuyNum: productDetail.minBuyNum,
        maxBuyNum: productDetail.maxBuyNum,
        addShopCartUnit: productDetail.addShopCartUnit,
        underwritingState: productDetail.underwritingState || ''
      },
      bottomState: this.getBottomBarState(productDetail)
    })
  },
  //底部栏状态
  getBottomBarState(productDetail) {
    let bottomBarState = 0
    if (productDetail.saleMode == 2) {
      //合作商不考虑，直接买
      // bottomBarState = productDetail.stockState == 3 ? 7 : 0
    } else if (productDetail.saleMode == 6) {
      //经销商需要考虑是否需要申请进货
      bottomBarState = productDetail.stockState == 3 ? 7 : productDetail.productPrice.price ? 0 : 8
    } else {
      const isActivity = this.data.promotionType != -1
      if (isActivity) {
        const promotionType = this.data.promotionType
        const activityState = this.data.activityState
        const hasNotBegin = DateUtil.compareDate(this.data.activityStartTime, wx.getStorageSync(`serviceTime`))
        const hasEnd = DateUtil.compareDate(wx.getStorageSync(`serviceTime`), this.data.activityEndTime)
        //酒批活动商品
        if (activityState == -1 && promotionType == 6) {
          bottomBarState = 1
        } else if (activityState == -1) {
          bottomBarState = 0
        } else if (promotionType == 3 || promotionType == 8) {
          //打折促销，产品精选
          bottomBarState = activityState != 2 ? 4 : hasEnd ? 3 : 0
        } else if (promotionType == 4) {
          //限时惠
          bottomBarState = activityState != 2 ? 4 : hasNotBegin ? 2 : hasEnd ? 3 : this.data.enjoyUserLevelDiscount ? 0 : 9
        } else if (promotionType == 6) {
          //凑单
          bottomBarState = activityState != 2 ? 4 : hasEnd ? 3 : 1
        }
        //无库存
        if (productDetail.stockState == 3) {
          bottomBarState = 7
        }
      } else {
        //酒批普通商品
        //独家包销产品通过storeCount判断库存
        if (productDetail.stockState == 3 || (productDetail.saleMode == 8 && productDetail.storeCount == 0)) {
          //无库存，到货通知
          bottomBarState = productDetail.alreadyArrivalNotice ? 6 : 5
        } else {
          //有库存
          //凑单产品不能立即购买,没有马上进货
          if (productDetail.productPrice.gatherOrderPrice > 0) {
            bottomBarState = 1
          } else {
            bottomBarState = 0 
          }
        }
      }
    }
    let windowHeight
    windowHeight = this.data.windowHeight
    this.setData({ bottomBarState, windowHeight })
    return bottomBarState
  },
  //活动价显示
  activityPriceTagShow(productDetail) {
    //限时惠活动，进行中的打折促销（不享受会员价）显示活动价
    let { promotionType, enjoyUserLevelDiscount } = this.data
    let activityPriceTag = false
    const isActivity = this.data.promotionType != -1
    if (promotionType == 4) {
      activityPriceTag = true
    } else {
      activityPriceTag = false
    }
    if (isActivity && promotionType == 3) {
      const hasNotBegin = DateUtil.compareDate(this.data.activityStartTime, wx.getStorageSync(`serviceTime`))
      const hasEnd = DateUtil.compareDate(wx.getStorageSync(`serviceTime`), this.data.activityEndTime)
      if (!hasNotBegin && !hasEnd && (!productDetail.productPrice.userLevelReduceAmount > 0 || !enjoyUserLevelDiscount)) {
        activityPriceTag = true
      } else {
        activityPriceTag = false
      }
    }
    this.setData({ activityPriceTag })
  },
  getGlobalData() {
    const isVisitor = wx.getStorageSync(`isVisitor`)
    const systemInfo = App.globalData.systemInfo
    //用户地址
    let userAddress = wx.getStorageSync(`userAddress`) || []
    userAddress = userAddress.filter(item => item.state == 0 || item.state == 1)
    this.setData({
      isVisitor,
      windowHeight: systemInfo.windowHeight,
      systemInfo,
      userAddress,
      detailAddressText: this.getDetailAddressText(userAddress, App.globalData.addressId),
    })
  },
  //根据传入的值去判断走哪个接口
  onSelectInterface(options) {
    //商品列表的活动商品取不到活动信息，当做普通商品展示
    const productSkuId = options.productSkuId || ``
    //活动Id，非活动不传
    const activityId = options.activityId || ``
    //活动名称，非活动不传
    const activityName = options.activityName || ``
    //活动时间,非活动不传
    const activityStartTime = options.activityStartTime || ``
    const activityEndTime = options.activityEndTime || ``
    //活动状态,非活动不传
    const activityState = options.activityState == undefined ? -1 : parseInt(options.activityState)
    //活动类型，非活动不传
    const promotionType = options.promotionType == undefined ? -1 : parseInt(options.promotionType)
    //是否享受会员等级优惠，非活动不传
    const enjoyUserLevelDiscount = options.enjoyUserLevelDiscount == `true`
    //分享人城市Id
    const cityId = options.cityId || ``
    //是否来自分享
    const isFromShare = options.isFromShare == `true`
    //是否是独家包销商品,不是可以不传
    const isUnderwriting = options.isUnderwriting == `true`
    //是否是从我的包销商品列表进入
    const underwriteNocanBuy = options.underwriteNocanBuy == `true`   
    //是否是大宗商品,不是可以不传
    const isLargeCargo = options.isLargeCargo == `true`
    this.setData({
      productSkuId, activityId, cityId, promotionType,
      activityName, activityState,
      activityStartTime, activityEndTime, enjoyUserLevelDiscount,
      activityTimeNotice: DateUtil.getActivityTimeNotice(activityStartTime, activityEndTime, activityState),
      isFromShare, isUnderwriting, isLargeCargo, underwriteNocanBuy
    })
    if (isFromShare) {
      return App.HttpService.autoLogin()
        .then(data => {
          if (data) {
            //大宗商品，限时惠商品的分享，先统一走这个接口，出问题胡开阳改（18.3.2亲口说）
            return App.HttpService.getShareProductDetail({ data: productSkuId })
              .then(data1 => {
                if (!data1 || !data1.data) {
                  setTimeout(() => App.WxService.switchTab(App.Constants.Route.homePage), 1500)
                  return Promise.reject(`商品不存在`)
                } else {
                  return Promise.resolve(data1)
                }
              })
          } else {
            //自动登录失败
            App.WxService.redirectTo(App.Constants.Route.login, { shareFail: true })
            return Promise.reject(``)
          }
        })
    } else if (isLargeCargo) {
      return App.HttpService.getLargeCargoProductDetail({ productSkuId })
    } else if (activityId && promotionType == 4) {
      return App.HttpService.getTimeLimitProductDetail({ data: { productSkuId: productSkuId, promotionId: activityId } })
    } else {
      return App.HttpService.getProductDetail({ productSkuId })
    }
  },
  //配送方式提示
  deliveryModeAddressTip(e) {
    let { productDetail } = this.data
    //deliveryMode	配送方式 0-可配送可自提， 1-可配送 ，2-可自提
    if (productDetail.saleMode != 2 && productDetail.saleMode != 6) {
      productDetail.deliveryMode = e
      this.setData({ productDetail })
    }
  },
  //返回顶部
  backToTop() {
    this.setData({ scrollPosition: 'top' })
  },
  //去购物车
  goToShopCart() {
    App.WxService.switchTab(App.Constants.Route.shopCart)
  },
  //去登录
  goToLogin() {
    App.WxService.reLaunch(App.Constants.Route.login)
  },
  //去活动详情
  goToActivityDetail(e) {
    const activityId = this.data.activityId
    const promotionType = this.data.promotionType
    App.WxService.navigateTo(App.Constants.Route.atyDetail, { activityId, promotionType })
  },
  //去产品列表
  goToProductList(e) {
    const productDetail = e.currentTarget.dataset.productDetail
    const tag = e.currentTarget.dataset.tag
    const categoryId = productDetail.productCategoryId ? [productDetail.productCategoryId] : []
    const sonName = productDetail.productCategoryName || ``
    const brandIds = productDetail.productBrandId ? [productDetail.productBrandId] : []
    const brandName = productDetail.productBrandName || ``
    if (tag == `brand`) {
      App.WxService.navigateTo(App.Constants.Route.productList, { categoryId, sonName, brandIds, brandName })
    } else if (tag == `category`) {
      App.WxService.navigateTo(App.Constants.Route.productList, { categoryId, sonName })
    }
  },
  //去经销商店铺
  goToDealerShop(e) {
    const shopId = e.currentTarget.dataset.shopId
    App.WxService.navigateTo(App.Constants.Route.dealer, { shopId })
  },
  goToGroupBuyProductDetail(e){
    const groupBuyPromotionId = e.currentTarget.dataset.groupBuyPromotionId
    App.WxService.navigateTo(App.Constants.Route.groupFrame, { source: 0, promotionId: groupBuyPromotionId, isGroupJoin: false })
  },
  //拨打联系电话
  makePhoneCall(e) {
    const num = e.currentTarget.dataset.num
    wx.makePhoneCall({
      phoneNumber: num,
    })
  },
  //点击到货通知
  onArrivalNotice(e) {
    let { productDetail } = this.data
    const productSkuId = e.currentTarget.dataset.productSkuId
    return App.HttpService.saveArrivalNotice({ data: productSkuId })
      .then(data => {
        $yjpToast.show({ text: `如果1个月内到货，系统将以短息的形式发送到您手机上` })
        this.setData({ [`productDetail.alreadyArrivalNotice`]: true, bottomBarState: 6 })
      })
      .catch(e => $yjpToast.show({ text: e }))
  },
  //申请独家包销
  applyUnderwrite() {
    const productDetail = this.data.productDetail
    const product = {}
    product.underwritingDesc = '全年包销数量' + productDetail.underwritingInfo.minimumYearly + productDetail.saleUnit + '起'
    product.price = productDetail.productPrice.minPrice
    product.maxPrice = productDetail.productPrice.maxPrice
    product.minPrice = productDetail.productPrice.minPrice
    product.canApply = productDetail.underwritingInfo.canApply
    product.priceUnit = productDetail.priceunit
    product.saleUnit = productDetail.saleUnit
    product.productImgUrl = productDetail.imgsUrl[0]
    product.productSpecName = productDetail.specName
    product.productName = productDetail.productName
    product.productSkuId = productDetail.productSkuId
    product.alreadyUnderwriting = productDetail.underwritingInfo.alreadyUnderwriting
    product.applyCount = productDetail.underwritingInfo.applyCount
    product.underwritingState = productDetail.underwritingInfo.underwritingState
    product.ProductUnderwritingWatermark = wx.getStorageSync(`settingValue`).ProductUnderwritingWatermark
    product.minimumYearly = productDetail.underwritingInfo.minimumYearly
    if (product.canApply) {
      App.WxService.navigateTo(App.Constants.Route.underwriteApply, {
        product: product,
        sourceType: 1
      })
    }
  },
  alreadyNotice() {
    $yjpToast.show({ text: `您已订阅该商品的到货通知` })
  },
  //去首页
  goToHomePage() {
    App.WxService.switchTab(App.Constants.Route.homePage)
  },
  //收藏
  onFavorite() {
    let { productDetail } = this.data
    if (!productDetail.favorite) {
      App.HttpService.addUserFavorites({
        datas: [{ favoriteProductType: productDetail.saleMode == 8 ? 1 : 0, productSkuId: productDetail.productSkuId }]
      })
        .then(data => {
          this.setData({ [`productDetail.favorite`]: true })
          $yjpToast.show({ text: `收藏成功` })
        })
    } else {
      App.HttpService.removeUserFavorites({
        datas: [productDetail.productSkuId]
      })
        .then(data => {
          this.setData({ [`productDetail.favorite`]: false })
          $yjpToast.show({ text: `取消收藏成功` })
        })
    }
  },
  onShareAppMessage: function () {
    return {
      path: `${App.Constants.Route.productDetail}?isFromShare=true&productSkuId=${this.data.productSkuId}&activityId=${this.data.activityId}&activityName=${this.data.activityName}&activityStartTime=${this.data.activityStartTime}&activityEndTime=${this.data.activityEndTime}&activityState=${this.data.activityState}&promotionType=${this.data.promotionType}&enjoyUserLevelDiscount=${this.data.enjoyUserLevelDiscount}&cityId=${this.data.cityId}&isUnderwriting=${this.data.isUnderwriting}&isLargeCargo=${this.data.isLargeCargo}`
    }
  },
  loadMoreRecommendList() {
    loadMoreRecommendList(this)
  },
})