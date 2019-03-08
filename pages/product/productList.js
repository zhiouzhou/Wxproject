const App = getApp()
const vuefy = require('../../utils/vuefy.js')
import { $yjpToast, $yjpDialog, AddToShopCartJs, ProductPromotions, ApplyBuyJs } from '../../components/yjp.js'
import { AddToShopCartUtil, DateUtil, ProductUtil, FunctionUtils } from '../../utils/CommonUtils.js'
import { onlyRecommendInit, ListProductRecommend, loadMoreRecommendList } from '../../components/recommendListFn.js'
Page({
  data: {
    categoryMenuText: `全部类目`,
    brandMenuText: `全部品牌`, 
    sortMenuText: `综合排序`,
    categoryMenuShow: false,
    brandMenuShow: false,
    sortMenuShow: false,
    sortList: [{ sortType: 0, sortText: `综合排序` },
    { sortType: 1, sortText: `销量从高到低` },
    { sortType: 2, sortText: `价格从低到高` },
    { sortType: 3, sortText: `价格从高到低` }],
    sortType: 0,
    initing: true,
    isSelfSale: false,
    isYJPDelivery: false,
    isHasStock: false,
    productList: [],
    productListCouponDesc : '',
    recommendList: [],//为您推荐list 
    recommendType: 1,
    fuzzySearchList: []
  },
  onLoad: function (options) {
    this.inputDebounce = vuefy.debounce(this.setFuzzyData, 200)
    Object.assign(this, AddToShopCartJs, ProductPromotions, ApplyBuyJs)
    // //TODO 测试TP2-896
    // if (options.brandName =='茅台'){
    //   App.globalData.jumpToSecoundPage=true
    // }else{
    //   App.globalData.jumpToSecoundPage = false
    // }
    this.onSelectInterface(options)
    this.getProductList()
    this.getSearchCategory()
    this.getSearchBrands()
  },
  onUnload:function(){
    // App.WxService.reLaunch(App.Constants.Route.sHome, { specialAreaId: 1 })
  },
  onSelectInterface(options) {
    const isVisitor = wx.getStorageSync(`isVisitor`)
    const settingValue = App.globalData.settingValue
    const UnLoginPriceDesc = settingValue.UnLoginPriceDesc || `登录后查看价格`
    const PendingAuditPriceDesc = settingValue.PendingAuditPriceDesc || `审核通过后可以查看价格`

    const systemInfo = App.globalData.systemInfo
    //搜索框提示文字 
    const productSearchLabel = wx.getStorageSync(`appSetting`).productSearchLabel || ``
    const productListCouponDesc = wx.getStorageSync(`appSetting`).productListCouponDesc || ``
    const hiddenPriceText = isVisitor ? UnLoginPriceDesc : App.globalData.userDetail.state != 1 ? PendingAuditPriceDesc : ``//隐藏价格提示
    const firstCategoryId = options.firstCategoryId || ``
    let categoryId = (options.categoryId && JSON.parse(options.categoryId)) || []
    //如果二级类目跟一级类目一样（子类目中的全部品牌），则省略二级类目
    if (categoryId.length && categoryId[0] == firstCategoryId) { categoryId = [] }
    const brandIds = (options.brandIds && JSON.parse(options.brandIds)) || []
    const labelId = options.labelId || ``
    const currentPage = 1
    const isAscending = options.isAscending == `true`
    const pageSize = 20
    const saleModel = -1//产品类型:	全部(-1), 酒批配送(1), 合作商配送(2);
    const saleModels = (options.saleModels && JSON.parse(options.saleModels)) || []//销售模式 代营(0),自营(1),合作(2),寄售(3),经销商(6)
    const searchKey = options.searchKey || ``
    const searchModes = (options.searchModes && JSON.parse(options.searchModes)) || []//查询模式 0=仅看自营, 1=易久批配送, 2=仅看有货;
    const productSearchSource = options.productSearchSource == undefined ? 1 : parseInt(options.productSearchSource) //	搜索来源 首页本地热销(0), 产品搜索(1);
    const menuSearchSource = options.menuSearchSource == undefined ? 0 : parseInt(options.menuSearchSource)// 查询来源 全部类型商品=0,明星爆款商品=1;
    const sort = options.sort == undefined ? 0 : parseInt(options.sort)  //排序方式 按排序号(0),按时间(1),按价格(2),按销量(3),
    const shopId = options.shopId || ``
    const brandMenuText = options.brandName || `全部品牌`
    const categoryMenuText = options.sonName ? options.sonName : options.firstCategoryName ? `全部${options.firstCategoryName}` : `全部类目`
    const isFromGather = options.isFromGather == `true`//去凑单列表
    const isFromFullReduce = options.isFromFullReduce == `true`//去满减列表

    const isFromCouponGather = options.isFromCouponGather == `true` //优惠券去凑单
    const jiupiCanUseCouponAmount = parseFloat(options.jiupiCanUseCouponAmount)//优惠券去凑单时购物车已经加了的商品金额
      
    const wiiUseCoupon = (options.wiiUseCoupon && JSON.parse(options.wiiUseCoupon)) || [] 
    const specialAreaId = options.specialAreaId || "" //专区id

    const discountId = options.discountId || ``//满减产品集ID
    const fullReduceListNotice = options.fullReduceListNotice || ``//满减提示
    const allGatherNeedAmount = parseFloat(options.allGatherNeedAmount) || 0//去凑单需要金额
    const searchAndMenuHeight = systemInfo.windowWidth / 750 * 180
    const subMenuHeight = systemInfo.windowWidth / 750 * 80
    const gatherNoticeHeight = systemInfo.windowWidth / 750 * 72
    const fullReduceNoticeHeight = systemInfo.windowWidth / 750 * 72
    const isVisitorHeight = systemInfo.windowWidth / 750 * 98
    //特价处理经销商
    const delearSale = options.delearSale == `true`
    //列表优惠卷提示计算时的金额
    let userCouponMoney = AddToShopCartUtil.getUserCouponMoneyforDefault()
    let currentProductMoney = AddToShopCartUtil.getUserMoneyforDefault()
    //存储查询参数
    this.setData({
      windowHeight: systemInfo.windowHeight - searchAndMenuHeight - (isFromGather ? gatherNoticeHeight : isFromFullReduce ? fullReduceNoticeHeight : delearSale ? 0 : subMenuHeight),
      isVisitor, isVisitorHeight, productSearchLabel, hiddenPriceText,
      firstCategoryId, categoryId, brandIds, searchKey,
      labelId, currentPage, isAscending, pageSize, specialAreaId,
      saleModel, saleModels, searchModes, productSearchSource, menuSearchSource,
      sort, shopId, categoryMenuText, brandMenuText, isFromGather, isFromFullReduce, fullReduceListNotice, allGatherNeedAmount, discountId,
      addToShopCartNum: AddToShopCartUtil.getAddToShopCartNumFromStorage(`exceptLargeCargo`),
      addToShopCartPrice: AddToShopCartUtil.getAddToShopCartPriceFromStorage(`exceptLargeCargo`),
      userCouponMoney: userCouponMoney ,
      currentProductMoney,
      //列表优惠卷提示
      userCouponPrompt: AddToShopCartUtil.getUserCouponPrompt(currentProductMoney,userCouponMoney),
      delearSale,
      isFromCouponGather, jiupiCanUseCouponAmount, wiiUseCoupon, productListCouponDesc, fuzzyHeight: systemInfo.windowHeight - systemInfo.windowWidth*92/750
    })
  },
  //获取产品列表
  getProductList() {
    let { firstCategoryId, categoryId, brandIds, labelId, currentPage,
      isAscending, pageSize, saleModel, saleModels, searchKey,
      searchModes, productSearchSource, sort, isFromGather, isFromFullReduce, discountId, delearSale, specialAreaId } = this.data
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({
      title: '加载中',
    })
    if (isFromGather) {
      //凑单列表
      return App.HttpService.queryGatherProductList({
        brandId: brandIds.length ? brandIds[0] : ``,
        currentPage, pageSize, categoryId, firstCategoryId,
        isAscending, labelId, searchKey, sort
      })
        .then(data => this.processData(data))
        .catch(e => { this.setData({ requesting: false, initing: false }); wx.hideLoading() })
    } else if (isFromFullReduce) {
      //满减列表
      return App.HttpService.queryFullReduceProductList({
        currentPage, pageSize, data: {
          ascending: isAscending, brandIds, firstCategoryId, reduceGroupId: discountId,
          searchKey, secondCategoryId: categoryId, sort
        }
      })
        .then(data => this.processData(data))
        .catch(e => { this.setData({ requesting: false, initing: false }); wx.hideLoading() })
    } else if (delearSale) {
      ///特价处理经销商
      return App.HttpService.querydelearSaleList({
        currentPage, pageSize, data: {
          isAscending, brandIds, firstCategoryId, categoryId, saleModel,
          searchKey, sort
        }
      })
        .then(data => this.processData(data))
        .catch(e => { this.setData({ requesting: false, initing: false }); wx.hideLoading() })

    } else {
      //优惠券凑单产品列表
      if (this.data.isFromCouponGather){
        productSearchSource = ''
      }
      //普通列表
      return App.HttpService.queryProductList({
        firstCategoryId, categoryId, brandIds, labelId, currentPage,
        isAscending, pageSize, saleModel, saleModels, searchKey,
        searchModes, searchSource: productSearchSource, sort, specialAreaId
      })
        .then(data => this.processData(data))
        .catch(e => { this.setData({ requesting: false, initing: false }); wx.hideLoading() })
    }
  },


  //处理商品数据
  processData(data) {
    if (data.data.length != 0) {
      let extraProducts = ProductUtil.rebuildProducts(data.data, `productList`)
      //如果是从优惠去凑单进来的，需要过滤掉不可用券商品
      if (this.data.isFromCouponGather){
        extraProducts = extraProducts.filter(item => item.isUseCoupon && item.saleMode!=6)
      }
      this.setData({ currentPage: ++this.data.currentPage, productList: this.data.productList.concat(extraProducts) })
    } else if (data.data.length == 0 && this.data.currentPage == 1) {
      this.setData({ productList: [] })
      onlyRecommendInit(this)
      ListProductRecommend(this)
    } else {
      $yjpToast.show({ text: `没有更多数据了` })
    }
    this.setData({ requesting: false, initing: false })
    wx.hideLoading()
  },
  loadMoreRecommendList(){
    loadMoreRecommendList(this)
  },
  //获取类目菜单数据
  getSearchCategory() {
    //通过searchKey是否存在去判定取全部类目还是部分类目
    if (this.data.searchKey) {
      let { labelId, saleModels, searchKey, searchModes, menuSearchSource, shopId } = this.data
      return App.HttpService.listSearchCategory({
        data: { labelId, saleModels, searchKey, searchModes, searchSource: menuSearchSource, shopId }
      }).then(datas => this.setData({ categoryList: this.rebuildCategoryList(datas.data) }))
    } else {
      return App.HttpService.listCategory().then(datas => {
        //聚合品类过来 匹配categoryMenuText  brandMenuText 
        if (this.data.categoryId && this.data.categoryId.length && this.data.categoryMenuText == '全部类目' && datas.data.categoryList) {
          for (let item of datas.data.categoryList) {
            if (item.sonCategorys && item.sonCategorys.length) {
              for (let ii of item.sonCategorys) {
                if (ii.sonId == this.data.categoryId) {
                  this.data.categoryMenuText = ii.sonName
                }
                
              }
            }
          }
          this.setData({ categoryList: this.rebuildCategoryList(datas.data), categoryMenuText: this.data.categoryMenuText })
        } else {
          this.setData({ categoryList: this.rebuildCategoryList(datas.data) })
        }
      })
    }
  },
  //获取品牌菜单数据
  getSearchBrands() {
    let { categoryId, firstCategoryId, labelId, saleModel,
      saleModels, searchKey, searchModes, menuSearchSource, shopId } = this.data
    return App.HttpService.queryProductBrands({
      data: {
        categoryIds: categoryId, firstCategoryId,
        labelId, saleModel, saleModels, searchKey, searchModes,
        searchSource: menuSearchSource, shopId
      }
    }).then(datas => {
      //聚合品类过来 匹配categoryMenuText  brandMenuText 
      if (this.data.brandIds && this.data.brandIds.length && this.data.brandMenuText == '全部品牌' && datas.data) {
        for (let item of datas.data) {
          if (item.brandId == this.data.brandIds) {
            this.data.brandMenuText = item.brandName
          }
        }

        this.setData({ brandList: this.rebuildBrandList(datas.data), brandMenuText: this.data.brandMenuText })
      } else {
        this.setData({ brandList: this.rebuildBrandList(datas.data) })
      }
    })
  },
  //处理搜索类目数据
  rebuildCategoryList(categoryList) {
    let finalCategoryList = []
    //部分类目会是一个数组，而全部类目是类目列表和活动类目列表
    if (categoryList instanceof Array) {
      finalCategoryList = categoryList
    } else {
      //去掉活动类目列表
      finalCategoryList = categoryList.categoryList.filter(item => item.categoryType == 3)
      for (let item of finalCategoryList) {
        //去掉子类目中的组合产品
        item.sonCategorys = item.sonCategorys.filter(item => item.categoryType != 2)
        //让全部类目的数据兼容部分类目接口的数据
        for (let sonItem of item.sonCategorys) {
          sonItem.categoryId = sonItem.sonId
          sonItem.categoryName = sonItem.sonName
        }
        item.categoryName = item.name
      }
    }
    return finalCategoryList
  },
  //处理搜索品牌数据
  rebuildBrandList(brandList) {
    if (!brandList.length) {
      return []
    }
    else {
      brandList.unshift({ brandId: ``, brandName: `全部品牌`, highLight: false })
      return brandList
    }
  },
  //点击筛选菜单按钮
  switchMenu(e) {
    const keyword = typeof e === `string` ? e : e.currentTarget.dataset.menuType
    //关闭菜单
    if (this.data.$yjp && this.data.$yjp.dialog && this.data.$yjp.dialog.visible) {
      typeof this[`$yjp.dialog.hide`] === `function` && this[`$yjp.dialog.hide`]()
      this.setData({ categoryMenuShow: false, brandMenuShow: false, sortMenuShow: false })
    } else {
      //打开菜单
      let dialogData = {}
      switch (keyword) {
        case `categoryMenu`:
          if (!this.data.categoryList.length) { $yjpToast.show({ text: `暂无信息` }); return; }
          const index = this.data.categoryList.findIndex(item => item.categoryId == this.data.firstCategoryId)
          dialogData = {
            firstCategoryId: this.data.firstCategoryId,
            categoryId: this.data.categoryId.length ? this.data.categoryId[0] : this.data.firstCategoryId,
            firstCategorys: this.data.categoryList,
            sonCategorys: index >= 0 ? this.data.categoryList[index].sonCategorys : this.data.categoryList[0].sonCategorys
          }
          this.setData({ categoryMenuShow: true })
          break;
        case `brandMenu`:
          if (!this.data.brandList.length) { $yjpToast.show({ text: `暂无信息` }); return; }
          dialogData = {
            brandId: this.data.brandIds.length ? this.data.brandIds[0] : ``,
            brandList: this.data.brandList
          }
          this.setData({ brandMenuShow: true })
          break;
        case `sortMenu`:
          dialogData = {
            sortType: this.data.sortType || 0,
            sortList: this.data.sortList
          }
          this.setData({ sortMenuShow: true })
          break;
      }
      wx.showLoading({
        title: '处理中'
      })
      $yjpDialog.open({
        pullDownDialogType: keyword, marginTop: 180,
        dialogData: dialogData,
        onReset: () => {
          this.setData({ categoryMenuShow: false, brandMenuShow: false, sortMenuShow: false })
          typeof this[`$yjp.dialog.hide`] === `function` && this[`$yjp.dialog.hide`]()
        }
      })
    }
  },
  //类目菜单点击一级类目
  onClickCategoryMenuFirst(e) {
    const categoryId = e.currentTarget.dataset.categoryId
    this.setData({
      [`$yjp.dialog.dialogData.firstCategoryId`]: categoryId,
      [`$yjp.dialog.dialogData.sonCategorys`]: this.data.categoryList.find(item => item.categoryId == categoryId).sonCategorys
    })
  },
  //类目菜单点击子类目
  onClickCategoryMenuSon(e) {
    const originalFirstCategoryId = this.data.firstCategoryId
    const originalCategoryId = this.data.categoryId.length ? this.data.categoryId[0] : ``
    let dialogData = this.data.$yjp.dialog.dialogData
    const categoryId = e.currentTarget.dataset.categoryId
    let firstCategoryName =''
    if (dialogData.firstCategoryId==''){
       firstCategoryName = dialogData.firstCategorys[0].categoryName
    }else{
       firstCategoryName = dialogData.firstCategorys.find(item => item.categoryId == dialogData.firstCategoryId).categoryName
    }
    const sonName = e.currentTarget.dataset.sonName
    this.setData({
      [`$yjp.dialog.dialogData.categoryId`]: categoryId,
      firstCategoryId: dialogData.firstCategoryId,
      categoryId: categoryId == dialogData.firstCategoryId ? [] : [categoryId],
      categoryMenuText: categoryId === dialogData.firstCategoryId ? `全部${firstCategoryName}` : sonName
    })
    this.switchMenu(`categoryMenu`)
    if (originalCategoryId != categoryId) {
      this.setData({ currentPage: 1, productList: [] })
      this.getProductList()
      this.getSearchBrands().then(data => this.setData({ brandIds: [], brandMenuText: `全部品牌` }))
    }
  },
  //点击菜单品牌
  onClickBrand(e) {
    const originalBrandId = this.data.brandIds.length ? this.data.brandIds[0] : ``
    const brandId = e.currentTarget.dataset.brandId
    const brandName = e.currentTarget.dataset.brandName
    this.setData({
      brandIds: brandId ? [brandId] : [],
      brandMenuText: brandName
    })
    this.switchMenu(`brandMenu`)
    if (originalBrandId != brandId) {
      this.setData({ currentPage: 1, productList: [] })
      this.getProductList()
    }
  },
  //点击排序筛选
  onClickSort(e) {
    const originalSortType = this.data.sortType
    const sortType = e.currentTarget.dataset.sortType
    const sortText = e.currentTarget.dataset.sortText
    this.setData({ sortType, sortMenuText: sortText })
    this.switchMenu(`sortMenu`)
    if (originalSortType != sortType) {
      switch (sortType) {
        case 0:
          this.setData({ isAscending: false, sort: 0 })
          break;
        case 1:
          this.setData({ isAscending: false, sort: 3 })
          break;
        case 2:
          this.setData({ isAscending: true, sort: 2 })
          break;
        case 3:
          this.setData({ isAscending: false, sort: 2 })
          break;
        default:
          break;
      }
      this.setData({ currentPage: 1, productList: [] })
      this.getProductList()
    }
  },
  //隐藏下拉菜单
  hidePullDownDialog() {
    this.setData({ categoryMenuShow: false, brandMenuShow: false, sortMenuShow: false })
    typeof this[`$yjp.dialog.hide`] === `function` && this[`$yjp.dialog.hide`]()
  },
  //修改搜索关键字
  onChangeSearchKey(e) {
    this.keyWords = e.detail.value;
    this.inputDebounce();
    //this.setData({ searchKey: e.detail.value })
  },
  /*模糊搜索debounce*/
  setFuzzyData() {
    var key = this.keyWords;
    var params = {
      data: key
    }
    App.HttpService.ListSearchKeyRecommend(params).then((res) => {
      if (key && res.data && res.data.length) {
        this.setData({ fuzzySearchList: res.data.slice(0, 11), searchKey: key })
      } else {
        this.setData({ searchKey: key })
      }
    }).catch(e => this.setData({ fuzzySearchList: [], searchKey: key }))
  },
  clickFuzzyItem(e) {
    App.WxService.navigateTo(App.Constants.Route.productList, { searchKey: e.currentTarget.dataset.word })
  },
  //点击搜索按钮
  onClickSearchButton() {
    this.hidePullDownDialog()
    this.setData({ categoryMenuText: `全部类目`, brandMenuText: `全部品牌`, currentPage: 1, productList: [], fuzzySearchList:[] })
    this.getProductList()
    this.getSearchCategory()
    this.getSearchBrands()
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '搜索内容', eventType: 202, actionId: this.data.searchKey })

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
  //切换配送，自营，有货筛选条件
  switchDeliveryMenu(e) {
    let searchModes = this.data.searchModes
    const tag = e.currentTarget.dataset.tag
    const tagType = tag == `isSelfSale` ? 0 : tag == `isYJPDelivery` ? 1 : tag == `isHasStock` ? 2 : 0
    const tagBoolean = !!this.data[tag]
    if (tagBoolean) {
      searchModes = searchModes.filter(item => item != tagType)
    } else {
      searchModes.push(tagType)
    }
    this.setData({ searchModes, [tag]: !tagBoolean, currentPage: 1, productList: [] })
    this.getProductList()
  },
  // 返回顶部
  backToTop() {
    this.setData({ scrollPosition: 'top' })
  },
  //去登录
  goToLogin() {
    App.WxService.reLaunch(App.Constants.Route.login)
  },
  //加载更多
  loadMore() {
    this.getProductList()
  },
  //商品详情
  goToProductDetail(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    App.WxService.navigateTo(App.Constants.Route.productDetail, { productSkuId })
    if (this.data&&this.data.searchKey){
      let additionalData = { searchKey: this.data.searchKey}
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '搜索出来的产品的点击', eventType: 203, actionId: productSkuId, additionalData: additionalData, subType:1})
    }else{
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '普通商品查看', eventType: 201, actionId: productSkuId })
    }
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
  hideCouponDiscountTip(){
     this.setData({
        productListCouponDesc : null
     })
  },
  firstEvt(){
    App.WxService.navigateTo(App.Constants.Route.addFindGoods)
  },
  secondEvt(){
    App.WxService.navigateTo(App.Constants.Route.proAndDis, { categoryType: 0 })
  }
  
})