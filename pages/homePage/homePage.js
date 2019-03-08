// pages/homePage/homePage.js
let App = getApp()
const ROUTE = App.Constants.Route
import { ProductUtil, DateUtil, FunctionUtils} from '../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog } from '../../components/yjp.js'
Page({
  data: {
    isVisitor: false,
    userState: -1,
    initing: true,
    shopsProductsIndex: 0,//店铺产品列表的index
    signInDetail: null
  },
  onLoad: function (options) {
    const isFromShare = options.isFromShare == `true`
    if (isFromShare){
      this.dealShareOnload()
    }else{
      this.dealOnloadData()
    }
  },
  dealOnloadData(){
    const systemInfo = App.globalData.systemInfo
    const isVisitor = wx.getStorageSync(`isVisitor`) || false
    const firsrShowDialog = App.globalData.firsrShowDialog

    //获取App配置信息,只有获取会员类别了才能调用，分享的情况，如果没有登录会跳到登录页，所以必定经过首页
    const getAppSettingPromise = App.HttpService.postRequest(`Setting/GetAppSetting`, {
    })
      .then(data => {
        wx.setStorageSync(`appSetting`, data.data)
        App.globalData.appSetting = data.data
      })
    const settingValue = App.globalData.settingValue
    const UnLoginPriceDesc = settingValue.UnLoginPriceDesc || `登录后查看价格`
    const PendingAuditPriceDesc = settingValue.PendingAuditPriceDesc || `审核通过后可以查看价格`
    const productSearchLabel = wx.getStorageSync(`appSetting`).productSearchLabel || ``
    this.setData({
      windowHeight: systemInfo.windowHeight,
      isVisitor, productSearchLabel,
      hiddenPriceText: isVisitor ? UnLoginPriceDesc : App.globalData.userDetail.state != 1 ? PendingAuditPriceDesc : ``,//隐藏价格提示
      cityName: wx.getStorageSync(`cityName`),
    })
    if (!isVisitor) {
      this.getSignInDetail();
    }
    if (firsrShowDialog) {
      this.getHomePopupInfo();
    }
    this.loadHomePageData()
  },
  loadHomePageData(){
    //游客模式手动选择地址需要刷新页面，商品详情切换地址，经销商推荐商品也要相应改变，也需要刷新页面
    this.getHomePageInfo()
    //获取当前用户的可用优惠卷（通用现金券）
    this.getUserCouponData()
  },
  //隐藏的时候重新加载优惠券数据
  onHide() {
    this.getUserCouponData()
  },
  getUserCouponData() {
    let data= { couponState:1, couponType:0, couponUseType:2, shopCoupon:false }
    return App.HttpService.myCoupon({ currentPage:1, pageSize:20, data })
      .then(data => {
        wx.setStorage({
          key: 'myCouponData',
          data:data,
        })
      })
      .catch(e => {})
  },
  //获取首页数据
  getHomePageInfo() {
    if (this.data.initing) {
      wx.showLoading({ title: '加载中' })
    }
    App.HttpService.getPageInfo()
      .then(data => {
        //广告分组
        const sortBannerResult = this.sortBanners(data.data.banners)
        const hdBanners = sortBannerResult.hdBanners
        const midBanners = sortBannerResult.midBanners
        // console.log(midBanners)
        const countryHdBanners = sortBannerResult.countryHdBanners
        this.setData({
          //导航图标
          appIcons: this.rebuildAppIcons(data.data.appIcons),
          //广告
          hdBanners: hdBanners,
          midBanners: midBanners,
          countryHdBanners: countryHdBanners,
          //酒批通知
          notices: data.data.notices,
          //活动聚合
          promotionGathers: this.rebuildPromotionGathers(data.data.promotionGathers),
          //首页活动列表
          promotionList: this.rebuildPromotionList(data.data.promotionList),
          //拼团活动列表
          activityGroup: data.data.groupPurchases,
          //客服电话
          serviceTel: data.data.serviceTelephone,
          //首页显示店铺列表
          shops: data.data.shopList,
          shopsProducts: this.getShopsProducts(data.data.shopList),
          //首页显示模板
          templates: data.data.templates.sort((a, b) => a.sequenceNo < b.sequenceNo ? -1 : 1),
          initing: false
        }, function (e) {
          wx.hideLoading()
        })
      }).catch(e => {
        wx.hideLoading()
        $yjpToast.show({ text: e })
      })
  },
  rebuildPromotionGathers(promotionGathers) {
    if (!promotionGathers || !promotionGathers.length) return []
    for (let promotion of promotionGathers) {
      if (promotion.promotionGatherType == 1) { //品类聚合 
        promotion.promotionTitleImg = promotion.promotionTitle.indexOf('http') != -1 ? promotion.promotionTitle : '';
        promotion.templateList.sort(function (a, b) {
          return a - b;
        })
      } else { // 活动聚合 
        for (let item of promotion.templateList) {
          if (item.linkMode == 2) {
            item.promotion.activityTimeNotice = DateUtil.getActivityTimeNotice(item.promotion.startTime, item.promotion.endTime, item.promotion.state)
          }
        }
      }
    }
    return promotionGathers
  },
  //改造活动列表的数据
  rebuildPromotionList(promotionList) {
    let newArr = []
    //活动状态
    if (promotionList && promotionList.length) {
      for (let promotion of promotionList) {
        const timeNoticeTemp = DateUtil.getActivityTimeNotice(promotion.startTime, promotion.endTime, promotion.state)
        promotion.timeNotice = timeNoticeTemp
        if (promotion.promotionProducts && promotion.promotionProducts.length) {
          for (let product of promotion.promotionProducts) {
            //首页只展示已抢光的情况
            product.stockText = product.storeState == 3 ? `已抢光` : ``
            product.productionDate = DateUtil.getDateStr(product.productionDate)
          }
        }
        if ((promotion.promotionProducts && promotion.displayType == 2 && promotion.promotionProducts.length < 3) ||
          (promotion.promotionProducts && promotion.displayType == 1 && promotion.promotionProducts.length < 4)) {
          promotion.displayType = 0
        }
        //打折促销和凑单活动不显示会员优惠信息
        if (promotion.productTags && promotion.promotionType != 3 && promotion.promotionType != 6) {
          promotion.productTags.forEach(tag => {
            if (tag.tagType == 97) {
              promotion.showMember = tag.tagDetail;
            }
          })
        }
        newArr.push(promotion)
      }
    }
    return newArr
  },
  //广告分类
  sortBanners(banners) {
    let hdBanners = [], midBanners = [], countryHdBanners = [], profileBanners = []
    for (let banner of banners) {
      banner.bannerPosition == 0 ? hdBanners.push(banner) :
        banner.bannerPosition == 1 ? midBanners.push(banner) :
          banner.bannerPosition == 3 ? countryHdBanners.push(banner) : 
            banner.bannerPosition == 7 ? profileBanners.push(banner) : {}
    }
    getApp().globalData.profileBanners = profileBanners
    return { hdBanners: hdBanners, midBanners: midBanners, countryHdBanners: countryHdBanners }
  },
  //获取经销商店铺的商品
  getShopsProducts(shopList) {
    let arr = []
    shopList.length && shopList.forEach((item) =>{
      item.productSkuList ? item.productSkuList : item.productSkuList = [];
      arr.push(...item.productSkuList);
    }) 
    return arr
  },
  //拨打客服电话
  makePhoneCall(e) {
    wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.num })
  },
  //店铺产品切换触发事件
  onShopsProductChange(e) {
    this.setData({ shopsProductsIndex: e.detail.current })
  },
  //点击店铺产品的左右切换按钮
  onShopsProductSwitch(e) {
    const direction = e.currentTarget.dataset.direction
    switch (direction) {
      case `pre`:
        this.setData({ shopsProductsIndex: --this.data.shopsProductsIndex })
        break;
      case `next`:
        this.setData({ shopsProductsIndex: ++this.data.shopsProductsIndex })
        break;
      default:
        break;
    }
  },
  //去活动详情
  goToPromotionDetail(e) {
    const activityId = e.currentTarget.dataset.activityId
    const promotionType = e.currentTarget.dataset.promotionType
    
    let talkingDataParams = { eventName: '首页活动引流', actionId: activityId, eventType: 104}
    talkingDataParams.subType = this.transToSubType(promotionType)
    FunctionUtils.bindNomalTalkingDataEvent(talkingDataParams)

    if (promotionType == 5) {
      App.WxService.navigateTo(ROUTE.comAtyDetail, { activityId, promotionType })
    } else {
      App.WxService.navigateTo(ROUTE.atyDetail, { activityId, promotionType })
    }
  },
  //首页页头广告跳转
  onTapHdBanner(e) {
    let tag = e.target.dataset.tag
    let typ = tag.bannerType
    let promotionType = tag.promotionType
    let activityId = tag.targetId
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '首页广告引流', eventType: 101, actionId: activityId })
    //	广告(0), 活动(1), 产品(2), 类目(3), 链接(4), 领优惠券(5),实名认证(6)
    if (typ == 1) {
      if (tag.promotionType == 5) {
        //组合活动跳组合活动详情
        App.WxService.navigateTo(ROUTE.comAtyDetail, { activityId })
      } else {
        //其他活动跳活动详情
        App.WxService.navigateTo(ROUTE.atyDetail, { promotionType, activityId })
      }
    }
    if (typ == 2) {
      App.WxService.navigateTo(ROUTE.productDetail, { productSkuId: tag.targetId })
    }
    if (typ == 3) {
      App.WxService.navigateTo(App.Constants.Route.productList, { categoryId: [tag.targetId]})
    }
    //食品专区
    if (typ == 7) {
      App.WxService.navigateTo(App.Constants.Route.sHome, { specialAreaId: activityId })
    }
    //链接广告
    // if (typ == 4) {
    //   App.WxService.navigateTo(App.Constants.Route.linkAd, { linkTitle: tag.title, linkUrl: tag.skipUrl })
    // }
  },
  //去产品详情
  goToProductDetail(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    // const productType = e.currentTarget.dataset.productType
    App.WxService.navigateTo(ROUTE.productDetail, { productSkuId })
  },
  //去经销商列表
  goToDealerList(e) {
    //7.11需求。如果只有一个经销商推荐，则查看更多跳转经销商店铺详情
    const firstShopId = e.currentTarget.dataset.shopId
    if (this.data.shops && this.data.shops.length == 1) {
      App.WxService.navigateTo(App.Constants.Route.dealer, { shopId: firstShopId})
    } else {
      App.WxService.navigateTo(App.Constants.Route.dealerList)
    }
  },
  goToDealerShop(e){
    const firstShopId = e.currentTarget.dataset.shopId
    App.WxService.navigateTo(App.Constants.Route.dealer, { shopId: firstShopId })
  },
  //返回顶部
  backToTop() {
    this.setData({ scrollPosition: 'top' })
  },
  //重新定位
  onRelocate(e) {
    let cityName = e.currentTarget.dataset.cityName
    App.WxService.navigateTo(ROUTE.onRelocate, { cityName })
  },
  //获取条码类型 0:订单码 1:单个产品码 2:多个产品码 3:查不到产品码
  getCodeType(codeResult) {
    if (codeResult.scanType == `QR_CODE`) {
      return Promise.resolve({ codeType: 0, codeData: codeResult.result })
    } else {
      return App.HttpService.queryProductList({
        brandIds: [], categoryId: [], currentPage: 1, firstCategoryId: ``,
        isAscending: false, labelId: ``, pageSize: 20, saleModel: -1, saleModels: [],
        searchKey: codeResult.result, searchModes: [], searchSource: 1, sort: 0
      })
        .then(data => {
          if (data.data && data.data.length == 1) {
            return Promise.resolve({ codeType: 1, codeData: data.data[0] })
          } else if (data.data && data.data.length > 1) {
            return Promise.resolve({ codeType: 2, codeData: codeResult.result })
          } else {
            return Promise.resolve({ codeType: 3, codeData: codeResult.result })
          }
        })
        .catch(e => Promise.reject(e))
    }

  },
  //扫订单
  onScanOrder() {
    let codeResult = null
    App.WxService.scanCode()
      .then(codeResult => {
        return this.getCodeType(codeResult)
      })
      .then(data => {
        console.log(`条码类型`, data)
        if (data.codeType == 0) {
          return App.WxService.navigateTo(ROUTE.orderDetail, { orderNO: data.codeData })
        } else if (data.codeType == 1) {
          let productSkuId = data.codeData.productSkuId
          return App.WxService.navigateTo(ROUTE.productDetail, { productSkuId })
        } else if (data.codeType == 2) {
          return App.WxService.navigateTo(ROUTE.productList, { searchKey: data.codeData })
        } else if (data.codeType == 3) {
          return App.WxService.navigateTo(ROUTE.productList, { searchKey: data.codeData })
        }
      })
      .catch(e => $yjpToast.show({ text: e }))
  },
  //去商品列表
  goToProductList() {
    App.WxService.navigateTo(ROUTE.productList)
  },
  //去搜索页面
  goToSearch() {
    App.WxService.navigateTo(ROUTE.search)
  },
  //去消息列表
  goToMessage() {
    App.WxService.navigateTo(ROUTE.message)
  },
  goToLogin() {
    App.WxService.reLaunch(ROUTE.login)
  },
  goToShopCart() {
    App.WxService.switchTab(ROUTE.shopCart)
  },
  removeObjWithArr(_arr, iconType) {
    var length = _arr.length;
    for (var i = 0; i < length; i++) {
      if (_arr[i].iconType == iconType) {
        if (i == 0) {
          _arr.shift(); //删除并返回数组的第一个元素
          return;
        }
        else if (i == length - 1) {
          _arr.pop();  //删除并返回数组的最后一个元素
          return;
        }
        else {
          _arr.splice(i, 1); //删除下标为i的元素
          return;
        }
      }
    }
    return _arr
  },
  dealAppIcons(appIcons){
     /*TODO :小程序的准备写死,
       如果没有帮我找货，加上帮我找货，
       如果没有签到加上优惠特价
       如果有赚钱精选，去掉
       2018.8.28 新需求 去掉拼团特惠，并显示优惠特价
    */
    //如果不存在我要找货，加上我要找货
    let existFindProduct = appIcons.find(item => item.iconType == 22)
    if (!existFindProduct){
      let bwzh = {
        "imgUrl": "/assets/images/ic_bangwozhaohuo@2x.png",
        "title": "帮我找货",
        "iconType": 22,
        "iconValue": null
      }
      appIcons.push(bwzh)
    }
    //删除赚钱精选
    this.removeObjWithArr(appIcons, 25)
    //删除拼团特惠，优惠特价，再加上优惠特价
    this.removeObjWithArr(appIcons, 31)
    this.removeObjWithArr(appIcons, 10)
    let yhtj = {
      "imgUrl": "http://yjp-app.ufile.ucloud.com.cn/appicon/home_ic_youhuitejia_180330@3x.png",
      "title": "优惠特价",
      "iconType": 10,
      "iconValue": null
    }
    //常够清单，改成我的货架,然后我的货架和退货换货
    this.removeObjWithArr(appIcons, 21)
    let wdhj ={
      "imgUrl": "http://yjp-app.ufile.ucloud.com.cn/appicon/icon_wodehuojia_1808@3x.png",
      "title": "我的货架",
      "iconType": 33,
      "iconValue": null
    }
    appIcons.splice(2, 0, yhtj)
    let existWdhj = appIcons.find(item => item.iconType == 33)
    const isVisitor = wx.getStorageSync(`isVisitor`) || false

    if (!existWdhj && !isVisitor){
      appIcons.splice(3, 0, wdhj)
    }
    return appIcons
  },
  rebuildAppIcons(appIcons) {
    if (!appIcons || !appIcons.length) {
      return []
    }
    for (let item of appIcons) {
      if (item.iconType == 19 || item.iconType == 20) {
        item.iconType = 998
      }
      let a = "1,2,3,4,5,6,7,8,9"
      if (a.indexOf(item.iconType) != -1) {
        item.iconType = 999
      }
    }
    return this.dealAppIcons(appIcons)
  },
  onClickAppIcons(e) {
    /**	白酒进货 = 1,葡萄酒进货 = 2,啤酒进货 = 3,食品进货 = 4,饮料进货 = 5,茶叶进货 = 6,洋酒进货 = 7,礼品进货 = 8,其他酒进货 = 9
     * ,促销活动 = 10,抢购活动 = 11,组合产品 = 12,找货与投诉 = 13,我的订单 = 14,凑单活动 = 15,签到 = 16,爆品区 = 17,清仓区 = 18,订制酒 = 19,县市加盟 = 20，常购清单 = 21，我要找货=22，我要投诉=23，客户服务=24，赚钱精选=25，特价预售=26，包量申请=27，兑奖申请=28，临期产品=29，退货换货=30，拼团优惠=31*/
    const iconType = e.currentTarget.dataset.iconType
    const iconValue = e.currentTarget.dataset.iconValue
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '首页按钮引流', subType: iconType, eventType: 102 })
    switch (iconType) {
      case 10:
        App.WxService.navigateTo(ROUTE.proAndDis, { categoryType: 2 })
        break;
      case 11:
        App.WxService.navigateTo(ROUTE.proAndDis, { categoryType: 5 })
        break;
      case 12:
        App.WxService.navigateTo(ROUTE.proAndDis, { categoryType: 3 })
        break;
      case 13:
        App.WxService.switchTab(ROUTE.service)
        break;
      case 14:
        if (this.data.isVisitor) {
          App.WxService.reLaunch(ROUTE.login)
        } else {
          App.WxService.navigateTo(ROUTE.orders, { bundleData: -1 })
        }
        break;
      case 15:
        App.WxService.navigateTo(ROUTE.proAndDis, { categoryType: 4 })
        break;
      case 16://签到
        if (this.data.isVisitor) {
          App.WxService.reLaunch(ROUTE.login)
        } else {
          this.goSign()
        }
        break;
      case 17://爆品区
        App.WxService.navigateTo(ROUTE.proAndDis, { categoryType: 0 })
        break;
      case 18:
        App.WxService.navigateTo(ROUTE.proAndDis, { categoryType: 1 })
        break;
      /* 19 20  21*/
      case 21:  //常购清单
        if (this.data.isVisitor) {
          App.WxService.reLaunch(ROUTE.login)
        } else {
          App.WxService.navigateTo(ROUTE.alwaysBuyList)
        }
        break;
      case 22:
        if (this.data.isVisitor) {
          App.WxService.reLaunch(ROUTE.login)
        } else {
          App.WxService.navigateTo(ROUTE.findGoods)
        }
        break;
      case 23:
        if (this.data.isVisitor) {
          App.WxService.reLaunch(ROUTE.login)
        } else {
          App.WxService.navigateTo(ROUTE.complaints)
        }
        break;
      case 24:
        if (this.data.isVisitor) {
          App.WxService.reLaunch(ROUTE.login)
        } else {
          App.WxService.navigateTo(ROUTE.service)
        }
        break;
      case 25:
        App.WxService.navigateTo(ROUTE.proAndDis, { categoryType: 0 })
        break;
      case 26:
        App.WxService.navigateTo(ROUTE.adventProductList, { bulk: 1 })
        break;
      case 27:
        if (this.data.isVisitor) {
          App.WxService.reLaunch(ROUTE.login)
        } else {
          App.WxService.navigateTo(ROUTE.underwriteList)
        }
        break;
      case 28://兑奖
        if (this.data.isVisitor) {
          App.WxService.reLaunch(ROUTE.login)
        } else {
          //城市信息中字段openAward，决定该城市是否有开通兑奖申请
          var appSetting = wx.getStorageSync("appSetting")
          if (appSetting && appSetting.openAward) {
            App.WxService.navigateTo(ROUTE.prizeApply)
          } else {
            $yjpDialog.open({
              dialogType: `defaultText`, title: `温馨提示`,
              dialogData: { text: `当前城市尚未开通线上兑奖,如需兑奖，请联系业务员` },
              hiddenCancel: true, confirmText: `确定`
            })
          }
        }
        break;
      case 29:
        App.WxService.navigateTo(ROUTE.adventProductList, { bulk: 2 })
        break;
      case 30:
        if (this.data.isVisitor) {
          App.WxService.reLaunch(ROUTE.login)
        } else {
          App.WxService.navigateTo(ROUTE.orderReturn)
        }
        break;
      case 31:
        App.WxService.navigateTo(App.Constants.Route.groupFrame)
        break;
      case 32:
        App.WxService.navigateTo(App.Constants.Route.sHome, { specialAreaId: iconValue })
        break;
      case 33:
        App.globalData.showMycategory=true
        App.WxService.switchTab(App.Constants.Route.category)
        break;
      case 998:
        $yjpToast.show({ text: '敬请期待!' })
        break;
      case 999:
        App.WxService.navigateTo(ROUTE.productList, { productSearchSource: 0 })
        break;
      default:
        break;
    }
  },
  //活动聚合跳转
  onClickPromotionGather(e) {
    // 赚钱精选(1), 利润产品(2), 批发促销(3), 限时惠(4), 组合产品(5), 凑单活动(6), 团购活动(7), 产品精选(8);promotionType
    //爆品特价(0),清仓特价(1),打折特价(2),组合特价(3),凑单特价(4),限时特价(5);类目列表，优惠特价的枚举值categoryType,出自类目列表接口
    const linkMode = e.currentTarget.dataset.linkMode
    const promotionType = e.currentTarget.dataset.promotionType
    const activityId = e.currentTarget.dataset.activityId
    const productSkuId = e.currentTarget.dataset.productSkuId
    const categoryType = promotionType == 3 ? 2 : promotionType == 4 ? 5 : promotionType == 5 ? 3 : promotionType == 6 ? 4 : 0
    this.onGatherNavigate({ linkMode, promotionType, activityId, productSkuId, categoryType })
  },
  //品类聚合跳转
  categoryJump(e) {
    let item = e.currentTarget.dataset.item;
    let categoryId = [item.category.categoryId];
    let brandIds = [item.category.brandId];
    this.onGatherNavigate({ linkMode: item.linkMode, categoryId, brandIds })
  },
  //单张大图聚合跳转
  onClickSingleImgGather(e) {
    const info = e.currentTarget.dataset.info
    const linkMode = info.linkMode
    const promotionType = info.promotionType
    const activityId = info.promotion && info.promotion.activityId
    const productSkuId = info.productSku && info.productSku.productSkuId
    const categoryType = promotionType == 3 ? 2 : promotionType == 4 ? 5 : promotionType == 5 ? 3 : promotionType == 6 ? 4 : promotionType == 8 ? 0 : 0
    const categoryId = info.category && [info.category.categoryId];
    const brandIds = info.category && [info.category.brandId];
    this.onGatherNavigate({ linkMode, promotionType, activityId, productSkuId, categoryType, categoryId, brandIds })
  },
  //聚合活动跳转
  onGatherNavigate(data) {
    let linkMode = parseInt(data.linkMode)
    let promotionType = data.promotionType
    let activityId = data.activityId
    let productSkuId = data.productSkuId
    let categoryType = data.categoryType
    let categoryId = data.categoryId
    let brandIds = data.brandIds
    let talkingDataParams = { eventName: '首页聚合活动引流', actionId: activityId, eventType: 103 }
    talkingDataParams.subType = this.transToSubType(promotionType)
    FunctionUtils.bindNomalTalkingDataEvent(talkingDataParams)
    switch (linkMode) {
      case 0:
        if (promotionType == 5) {
          //组合活动跳组合活动列表
          App.WxService.navigateTo(ROUTE.comAtyList)
        } else if (promotionType == 8){
          //产品精选
          App.WxService.navigateTo(ROUTE.atyList, { activityType: promotionType })
        }else {
          App.WxService.navigateTo(ROUTE.proAndDis, { categoryType })
        }
        break;
      case 1:
        if (promotionType == 5) {
          //组合活动跳组合活动列表
          App.WxService.navigateTo(ROUTE.comAtyList)
        } else {
          //其他活动跳活动详情
          App.WxService.navigateTo(ROUTE.atyDetail, { promotionType, activityId })
        }
        break;
      case 2:
        if (promotionType == 5) {
          //组合活动跳组合商品详情
          App.WxService.navigateTo(ROUTE.comAtyDetail, { activityId })
        } else {
          //其他活动跳活动详情
          App.WxService.navigateTo(ROUTE.atyDetail, { promotionType, activityId })
        }
        break;
      case 3:
        App.WxService.navigateTo(ROUTE.productDetail, { productSkuId })
        break;
      case 4: //一个类目
        App.WxService.navigateTo(ROUTE.productList, { categoryId })
        break;
      case 5: //一个品牌
        App.WxService.navigateTo(ROUTE.productList, { brandIds })
        break;
      case 6: //类目和品牌（包含）
        App.WxService.navigateTo(ROUTE.productList, { categoryId, brandIds })
        break;
      default:
        break;
    }
  },
  //获取首页弹窗信息
  getHomePopupInfo(){
    const userSetting = wx.getStorageSync(`userSetting`)
    getApp().globalData.firsrShowDialog = false
    App.HttpService.getGainPopupInfo({
      userDisplayClass: userSetting.displayClass
    }).then(data => {
      //显示关联产品模版(5),关联活动模版(6),优惠券发放模板(0),红包发放模板(1),
      if (data.success && data.data && (data.data.templateType == 5 || data.data.templateType == 6 || data.data.templateType == 0 || data.data.templateType == 1 || data.data.templateType == 2)) {
         this.setData({
           activityDialogData: data.data,
           activityPopupShow: true,
           popupTemplateType: data.data.templateType
         })
        }
       //首页优惠券提示弹窗 
      if (data.success && data.data && data.data.templateType == 7){
        if (data.data.couponRules && data.data.couponRules.length > 0){
          for (let item of data.data.couponRules){
            item.expiredTime = DateUtil.getDateStr(item.expiredTime)
          }
          this.setData({
            activityDialogData: data.data,
            couponPopupShow: true
          })          
        }
        }
        //针对会员的文字提示弹窗
      if (data.success && data.data && data.data.templateType == 3 && data.data.buttonAction == 0){
        this.setData({
          activityDialogData: data.data,
          memberPopupShow: true
        })
        }
        //没有首页弹窗则调用部分反馈的弹窗
      if (!data.data){
        this.getDeliveryOrderPopup()
        }
      }).catch(e => {
      })
  },
  //获取配送弹窗详情
  getDeliveryOrderPopup() {
    App.HttpService.getDeliveryPopupInfo({    
    }).then(data => {
      if(data.data){
        //记录弹窗时间，一天以内只弹一次部分配送反馈的弹窗
        let lastTime = wx.getStorageSync(`deliveryPopupTime`) ? new Date(wx.getStorageSync(`deliveryPopupTime`).replace(/-/g, "\/")).getTime() : 0
        let lastDay = wx.getStorageSync(`deliveryPopupTime`) ? new Date(wx.getStorageSync(`deliveryPopupTime`).replace(/-/g, "\/")).getDate() : 0
        let lastMonth = wx.getStorageSync(`deliveryPopupTime`) ? new Date(wx.getStorageSync(`deliveryPopupTime`).replace(/-/g, "\/")).getMonth() : 0
        let currentTime = new Date(data.serviceTime.replace(/-/g, "\/")).getTime()
        let currentDay = new Date(data.serviceTime.replace(/-/g, "\/")).getDate()
        let currentMonth = new Date(data.serviceTime.replace(/-/g, "\/")).getMonth()
        let differenceTime = (currentTime - lastTime)/1000
        let differenceDay = parseInt(differenceTime / (24 * 60 * 60))
        if ((differenceDay >= 1) || (differenceDay < 1 && lastDay < currentDay) || (lastMonth < currentMonth)) {
          wx.setStorageSync(`deliveryPopupTime`, data.serviceTime)
          data.data.templateTitle = data.data.templateTitle || `异常配送订单确认`
          this.setData({
            activityDialogData: data.data,
            activityPopupShow: true,
            popupTemplateType: 2,
            skipLinkUrlShow: true
          })
        }
      } 
    }).catch(e => {
    })
  },  
  //关闭首页弹窗
  closeActivityDialog(){
    this.setData({
      activityPopupShow: false,
      couponPopupShow: false,
      memberPopupShow: false
    })
  },
  //跳转到类目
  goCategory(){
    this.closeActivityDialog()
    App.WxService.switchTab(App.Constants.Route.category)
  },
  //弹窗跳转到linkurl
  skipLinkUrl(e){
    const skipInfo = e.currentTarget.dataset.skipInfo
    const skipUrl = skipInfo.linkUrl
    this.closeActivityDialog()
    App.WxService.navigateTo(App.Constants.Route.explain, { keyWord: `异常配送订单确认`, skipUrl})
  },
  //首页弹窗跳产品，跳活动
  popGoToPage(){
    const activityDialogData = this.data.activityDialogData
    this.setData({
      activityPopupShow: false
    })
    if (activityDialogData.buttonAction == 1){
      //templateType=5 产品， templateType=6 活动
      if (activityDialogData.templateType == 5) {
        App.WxService.navigateTo(App.Constants.Route.productDetail, {
          productSkuId: activityDialogData.productSkuId
        })
      } else {
        const activityId = activityDialogData.promotionId
        const promotionType = activityDialogData.promotionType
        if (promotionType == 5) {
          App.WxService.navigateTo(ROUTE.comAtyDetail, { activityId, promotionType })
        } else {
          App.WxService.navigateTo(ROUTE.atyDetail, { activityId, promotionType })
        }
      }
    }
  },
  //去拼团活动详情
  goToGroupActivity(e){
    let id = e.currentTarget.dataset.id
    App.WxService.navigateTo(App.Constants.Route.groupFrame, { source: 0, promotionId: id, isGroupJoin: false })
  },
  //获取签到信息
  getSignInDetail() {
    wx.removeStorageSync(`signInUrl`)
    App.HttpService.getSignInDetail()
      .then(data => {
        if (data.success) {
          const signInDetail = data.data
          this.setData({
            signInDetail: signInDetail
          });
        }
      }).catch(e => {
      })
  },

  //跳转签到页面
  goSign() {
    const signInDetail = this.data.signInDetail
    wx.setStorageSync(`signInUrl`, signInDetail.signInUrl)
    App.WxService.navigateTo(App.Constants.Route.signIn)
  },
  startView() {
    this.setData({ touchDoing: true })
  },
  endView() {
    this.setData({ touchDoing: false })
  },
  transToSubType(promotionType){
    let subType =0
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
  onShareAppMessage() {
    return {
      path: `${App.Constants.Route.homePage}?isFromShare=true`,
    }
  },
  dealShareOnload(){
      App.HttpService.onAppLaunch().then(data => {
        return App.HttpService.autoLogin()
          .then(data => {
            if (data) {
              this.dealOnloadData()
            } else {
              App.WxService.redirectTo(App.Constants.Route.login, { shareFail: true })
              return Promise.reject(``)
            }
          })
      })
  }
})