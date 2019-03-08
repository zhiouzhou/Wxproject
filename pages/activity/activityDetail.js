// pages/activity/activityDetail.js
const App = getApp()
import { $yjpToast, $yjpDialog, AddToShopCartJs, JoinBlackList } from '../../components/yjp.js'
import { DateUtil, ProductUtil, AddToShopCartUtil, FunctionUtils } from '../../utils/CommonUtils.js'
import { onlyRecommendInit, ListProductRecommend, loadMoreRecommendList } from '../../components/recommendListFn.js'

Page({
  data: {
    activityDetail: {},
    scrollPosition: 'top',
    currentPage: 1,
    pageSize: 20,
    productList: [],
    promotionType: -1,
    isFromShare:false,
    addToShopCartNum: 0,
    addToShopCartPrice: `0.00`,
    bottomBarState: 0,
    productListCouponDesc: '',
    recommendType:0
  },

  onLoad(options) {
    wx.showLoading({
      title: '加载中',
    })
    Object.assign(this, AddToShopCartJs, JoinBlackList)
    this.onSelectInterface(options)
      .then(data => {
        this.getGlobalData()
        return Promise.resolve(data)
      })
      .then(data => {
        //分享返回的数据可能不是同一个活动
        if (options.isFromShare == `true`) {
          this.setData({ activityId: data.data.activityId })
        }
        this.setData({ activityDetail: this.rebuildActivityDetail(data.data), bottomBarState: this.getBottomBarState(data.data) })
      })
      .then(data => {
        this.getActivityProduct(this.data.activityId, options.promotionType)
        wx.hideLoading()
      })
  },
  getGlobalData() {
    const isVisitor = wx.getStorageSync(`isVisitor`)
    const systemInfo = App.globalData.systemInfo
    const settingValue = App.globalData.settingValue;
    const UnLoginPriceDesc = settingValue.UnLoginPriceDesc || `登录后查看价格`
    const PendingAuditPriceDesc = settingValue.PendingAuditPriceDesc || `审核通过后可以查看价格`
    const hiddenPriceText = isVisitor ? UnLoginPriceDesc : App.globalData.userDetail.state != 1 ? PendingAuditPriceDesc : ``//隐藏价格提示
    //列表优惠卷提示计算时的金额
    const productListCouponDesc = wx.getStorageSync(`appSetting`).productListCouponDesc || ``
    let userCouponMoney = AddToShopCartUtil.getUserCouponMoneyforDefault()
    let currentProductMoney = AddToShopCartUtil.getUserMoneyforDefault()

    this.setData({
      isVisitor, hiddenPriceText,
      windowHeight: systemInfo.windowHeight * systemInfo.pixelRatio,
      userCouponMoney: userCouponMoney, productListCouponDesc,
      currentProductMoney,
      //限时惠的起送提示,限时惠不能用优惠券
      userSendPrompt: AddToShopCartUtil.getUserSendPrompt(currentProductMoney),
      //列表优惠卷提示
      userCouponPrompt: AddToShopCartUtil.getUserCouponPrompt(currentProductMoney,userCouponMoney),
      addToShopCartNum: AddToShopCartUtil.getAddToShopCartNumFromStorage(`exceptLargeCargo`),
      addToShopCartPrice: AddToShopCartUtil.getAddToShopCartPriceFromStorage(`exceptLargeCargo`)
    })
  },
  transToSubType(promotionType) {
    let subType = 0
    if (promotionType == 3) {
      subType = 1
    }
    if (promotionType == 4) {
      subType = 2
    }
    if (promotionType == 5) {
      subType = 3
    }
    if (promotionType == 6) {
      subType = 4
    }
    if (promotionType == 8) {
      subType = 5
    }
    return subType
  },
  //是否通过分享进入页面,调用不同的接口
  onSelectInterface(options) {
    const activityId = options.activityId || ``
    const promotionType = parseInt(options.promotionType)
    let talkingDataParams = { eventName: "活动详情分析", actionId: activityId, eventType: 401 }
    talkingDataParams.subType = this.transToSubType(promotionType)
    FunctionUtils.bindNomalTalkingDataEvent(talkingDataParams)
    const isFromShare = options.isFromShare == `true`
    
    let recommendType = promotionType+1;
    this.setData({
      activityId, isFromShare, promotionType, recommendType
    })
    if (isFromShare) {
      return App.HttpService.autoLogin()
        .then(data => {
          if (data) {
            return App.HttpService.getActivityShareDetail({ data: activityId }, promotionType)
              .then(data => {
                if (!data || !data.data) {
                  wx.hideLoading()
                  let categoryType = promotionType == 3 ? 2 : promotionType == 4 ? 5 : promotionType == 5 ? 3 : promotionType == 6 ? 4 : promotionType == 8 ? 0 : 0
                  $yjpToast.show({ text: `活动不存在` })
                  setTimeout(() => {
                    if (promotionType == 5) {
                      //组合活动跳组合活动列表
                      App.WxService.redirectTo(App.Constants.Route.comAtyList, { isFromShare:true})
                    } else {
                      //其他活动跳活动详情
                      App.WxService.redirectTo(App.Constants.Route.proAndDis, { categoryType, isFromShare: true })
                    }
                  }, 1500)
                  return Promise.reject(``)
                } else {
                  return Promise.resolve(data)
                }
              }).catch(e => {
                App.WxService.redirectTo(App.Constants.Route.login, { shareFail: true })
                return Promise.reject(``)
              })
          } else {
            App.WxService.redirectTo(App.Constants.Route.login, { shareFail: true })
            return Promise.reject(``)
          }
        })
    } else {
      return App.HttpService.getActivityDetail({ data: activityId }, promotionType)
    }
  },
  onReady() {
    let title = ``
    switch (this.data.promotionType) {
      case 3:
        title = `打折促销`
        break;
      case 4:
        title = `限时惠`
        break;
      case 6:
        title = `凑单活动`
        break;
      case 8:
        title = `产品精选`
        break;
      default:
        break;
    }
    wx.setNavigationBarTitle({ title })
  },
  //获取活动商品列表
  getActivityProduct(activityId, promotionType) {

    let { activityDetail, bottomBarState } = this.data
    if (this.data.requesting) return
    this.setData({ requesting: true })
    App.HttpService.getActivityProduct({ currentPage: this.data.currentPage, pageSize: this.data.pageSize, data: activityId }, promotionType)
      .then(data => {
        if ( data.success){
          this.activityTotalPage = Math.ceil(data.totalCount / this.data.pageSize)
          if (this.activityTotalPage == this.data.currentPage){
            onlyRecommendInit(this)
            ListProductRecommend(this)
          }
        }
        if (data.data.length != 0) {
          //限时惠和组合要传活动id，方便设置sourceId，在加入购物车的时候要用
          let extraProducts = ProductUtil.rebuildProducts(data.data, `activityDetail`, activityId)
          //将活动信息放入产品，比如限时惠等等的会员购买限制
          for (let newProduct of extraProducts) {
            newProduct.productTags.forEach(tag => {
              if (tag.tagType == 97) {
                // tag.memberInfo = data.data.userLevelName + data.data. 
                tag.memberInfo = '';
                newProduct.userLevelPrices && newProduct.userLevelPrices.forEach(price => {
                  tag.memberInfo += price.userLevelName + price.userLevelPrice + '元' + price.priceUnit + ';'
                })
              }
            })
            newProduct.enjoyUserLevelDiscount = activityDetail.enjoyUserLevelDiscount
            let levelTag = undefined
            if (activityDetail.productTags && activityDetail.productTags.length) {
              levelTag = activityDetail.productTags.find(item => item.tagType == 97)
            }
            newProduct.levelNotice = levelTag ? levelTag.tagDetail : ``
          }
          this.setData({ currentPage: ++this.data.currentPage, productList: this.data.productList.concat(extraProducts) })
        } else if (data.data.length == 0 && this.data.currentPage == 1) {
          this.setData({ productList: [] })
        } else {
          $yjpToast.show({ text: `没有更多数据了` })
        }
        this.setData({ requesting: false })
      })
      .catch(e => this.setData({ requesting: false }))
  },
  //处理活动详情的数据
  rebuildActivityDetail(activityDetail) {
    //活动状态
    activityDetail.timeNotice = DateUtil.getActivityTimeNotice(activityDetail.beginDate, activityDetail.endDate, activityDetail.state)
    //会员专享价
    const levelTag = activityDetail.productTags && activityDetail.productTags.find(item => item.tagType === 97)
    activityDetail.levelNotice = levelTag ? levelTag.tagDetail : ``
    return activityDetail
  },
  //上拉加载
  loadMore() {
    this.getActivityProduct(this.data.activityId, this.data.promotionType)
  },
  goToProductDetail(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    const activityId = this.data.activityId
    const promotionType = this.data.activityDetail.promotionType
    const activityName = this.data.activityDetail.name
    const activityStartTime = this.data.activityDetail.beginDate
    const activityEndTime = this.data.activityDetail.endDate
    const activityState = this.data.activityDetail.state
    const enjoyUserLevelDiscount = this.data.activityDetail.enjoyUserLevelDiscount
    App.WxService.navigateTo(App.Constants.Route.productDetail, {
      productSkuId, activityName, activityStartTime,
      activityEndTime, activityState, activityId,
      promotionType, enjoyUserLevelDiscount
    })
  },
  //底部栏状态
  getBottomBarState(activityDetail) {
    //bottomBarState:1:活动未开始;2:活动已结束;3:活动已下架,4,会员等级不足;5:进行中，可以加入购物车
    let bottomBarState = 0
    const hasBegin = DateUtil.compareDate(wx.getStorageSync(`serviceTime`), activityDetail.beginDate)
    const hasEnd = DateUtil.compareDate(wx.getStorageSync(`serviceTime`), activityDetail.endDate)
    if ((activityDetail.promotionType == 4 || activityDetail.promotionType == 5) && !activityDetail.enjoyUserLevelDiscount) {
      bottomBarState = 4
      return bottomBarState
    }
    if (activityDetail.state == 3) {
      bottomBarState = 3
      return bottomBarState
    }
    if (activityDetail.beginDate) {
      if (hasEnd) {
        bottomBarState = 2
        return bottomBarState
      } else if (!hasBegin) {
        bottomBarState = 1
        return bottomBarState
      }
    }
    return bottomBarState
  },
  //返回顶部
  backToTop() {
    this.setData({ scrollPosition: 'top' })
  },
  goToLogin() {
    App.WxService.reLaunch(App.Constants.Route.login)
  },

  onShareAppMessage() {
    return {
      path: `${App.Constants.Route.atyDetail}?isFromShare=true&activityId=${this.data.activityId}&promotionType=${this.data.promotionType}`,
    }
  },
  hideCouponDiscountTip() {
    this.setData({
      productListCouponDesc: null
    })
  },
  loadMoreRecommendList() {
    loadMoreRecommendList(this)
  },
  //去首页
  goToHomePage() {
    App.WxService.switchTab(App.Constants.Route.homePage)
  }
})