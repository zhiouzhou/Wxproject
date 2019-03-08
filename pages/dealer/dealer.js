// pages/dealer/dealer.js
const App = getApp()
import { $yjpToast, $yjpDialog, AddToShopCartJs, ProductPromotions, ApplyBuyJs } from '../../components/yjp.js'
import { ProductUtil, AddToShopCartUtil } from '../../utils/CommonUtils.js'

Page({
  data: {
    shopId: ``,
    shopDetail: {},
    activities: [],//店铺活动
    currentTab: 0,
    shopCoupons: [],
    brandIds: [],
    isAscending: false,
    sort: 0,
    searchKey: ``,//产品搜索关键字
    categoryList: [],//产品搜索类目
    firstCategoryId: ``,//一级类目ID
    categoryIds: [],//二级类目ID
    currentPage: 1,
    categoryMenuShow: false,
    brandMenuShow: false,
    sortMenuShow: false,
    categoryMenuText: `全部分类`,
    brandMenuText: `全部品牌`,
    sortMenuText: `全部排序`,
    categoryList: [],
    brandList: [],
    productList: [],
    productListTotalCount: 0,
    sortList: [{ sortType: 0, sortText: `综合排序` },
    { sortType: 1, sortText: `销量从高到低` },
    { sortType: 2, sortText: `价格从低到高` },
    { sortType: 3, sortText: `价格从高到低` }],
    initing: true
  },
  onLoad: function (options) {
    Object.assign(this, AddToShopCartJs, ProductPromotions, ApplyBuyJs)
    this.setData({
      isVisitor: wx.getStorageSync(`isVisitor`), shopId: options.shopId,
      addToShopCartNum: AddToShopCartUtil.getAddToShopCartNumFromStorage(options.shopId),
      addToShopCartPrice: AddToShopCartUtil.getAddToShopCartPriceFromStorage(options.shopId)
    })
    this.getShopDetail()
    this.onListShopCouponReceive()
    this.getShopActivities()
    this.getSearchCategory()
    this.getSearchBrands()
    this.getProductList()
  },
  //关注或者取消关注店铺
  onFavoriteShop(e) {
    let { shopDetail } = this.data
    if (!shopDetail) return
    const shopId = e.currentTarget.dataset.shopId
    if (shopDetail.haveFavorite) {
      App.HttpService.unfavoriteDealerShop({ data: shopDetail.shopId })
        .then(data => {
          wx.showToast({
            title: '取消关注成功',
            image: `/assets/images/ic_guanzhuchenggong@2x.png`
          })
          this.setData({ [`shopDetail.haveFavorite`]: false, [`shopDetail.userFavoriteCount`]: --this.data.shopDetail.userFavoriteCount })
        })
        .catch(e => $yjpToast.show({ text: e }))
    } else {
      App.HttpService.favoriteDealerShop({ data: shopDetail.shopId })
        .then(data => {
          wx.showToast({
            title: '关注成功',
            image: `/assets/images/ic_guanzhuchenggong@2x.png`
          })
          this.setData({ [`shopDetail.haveFavorite`]: true, [`shopDetail.userFavoriteCount`]: ++this.data.shopDetail.userFavoriteCount })
        })
        .catch(e => $yjpToast.show({ text: e }))
    }
  },
  //切换tab页
  onSwitchTab(e) {
    let currentTab = e.currentTarget.dataset.tab
    this.setData({ currentTab: e.currentTarget.dataset.tab })
    if (currentTab != 0) {
      this.hidePullDownDialog()
    }
  },
  //获取店铺详情
  getShopDetail() {
    App.HttpService.getDealerShopDetail({ data: this.data.shopId })
      .then(data => {
        if (!data || !data.data) return Promise.reject(`获取店铺详情失败`)
        else if (data.data.state == 0) return Promise.reject(`经销商店铺已停用`)
        else if (!data.data.openDealerShop) return Promise.reject(`经销商店铺已关闭`)
        else {
          // if (!data.data.score && data.data.score != 0) {
          //   data.data.score = 5
          // }
          this.setData({ shopDetail: data.data })
          wx.setNavigationBarTitle({
            title: data.data.shopName,
          })
        }
      })
      .catch(e => {
        $yjpToast.show({ text: e })
        setTimeout(() => {
          App.WxService.navigateBack()
        }, 2000)
      })
  },
  //获取店铺活动
  getShopActivities() {
    App.HttpService.queryActivitys({ currentPage: 1, pageSize: 60, data: { shopId: this.data.shopId } })
      .then(data => { this.setData({ activities: data.data }) })
  },
  //获取店铺的优惠券领取活动
  onListShopCouponReceive() {
    App.HttpService.listShopCouponReceive({ currentPage: 1, pageSize: 60, data: this.data.shopId })
      .then(data => {
        if (data.data) {
          this.setData({ shopCoupons: data.data })
        }
      })
      .catch(e => $yjpToast.show({ text: e }))
  },
  //获取店铺内优惠券
  receiveCoupons(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    App.HttpService.receiveCoupon({ data: id })
      .then(data => {
        $yjpToast.show({ text: `领取成功` })
        this.setData({ [`shopCoupons[${index}].alreadyReceived`]: true })
      })
      .catch(e => $yjpToast.show({ text: e }))
  },
  //领取已领完的券
  onConfirmAlreadyReceiveCoupons() {
    $yjpToast.show({ text: `优惠券已领完` })
  },
  //切换菜单
  switchMenu(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({ [tag]: !this.data[tag] })

  },
  //设置搜索关键词
  setSearchKeyword(e) {
    this.setData({ searchKey: e.detail.value })
  },
  //搜本店
  onSearchShop() {
    this.hidePullDownDialog()
    this.setData({ categoryMenuText: `全部类目`, brandMenuText: `全部品牌`, currentPage: 1, productList: [] })
    this.getSearchCategory()
    this.getSearchBrands()
    this.getProductList()
  },
  //获取产品搜索类目
  getSearchCategory() {
    let { searchKey, shopId } = this.data
    return App.HttpService.listSearchCategory({
      data: { saleModels: [6], searchKey, searchSource: -1, shopId }
    }).then(data => {
      if (data.data && data.data.length) {
        let categoryList = this.rebuildCategoryList(data.data)
        this.setData({ categoryList })
      }
    })
  },
  //修改类目列表数据
  rebuildCategoryList(categoryList) {
    for (let firstCategory of categoryList) {
      //给每个父类目的子类目列表第一位加上全部选项
      firstCategory.sonCategorys.unshift({ categoryId: firstCategory.categoryId, categoryName: `全部`, groupName: null, sonCategorys: [] })
    }
    return categoryList
  },
  //获取品牌
  getSearchBrands() {
    let { firstCategoryId, categoryIds, searchKey, shopId } = this.data
    return App.HttpService.queryProductBrands({
      data: {
        categoryIds: categoryIds.length ? categoryIds : [], firstCategoryId, saleModels: [6], searchKey, searchSource: -1, shopId
      }
    }).then(data => {
      this.setData({ brandList: this.rebuildBrandList(data.data) })
    })
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
  //获取产品
  getProductList() {
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({
      title: '加载中',
    })
    let { currentPage, brandIds, isAscending, sort, firstCategoryId, categoryIds, searchKey, shopId } = this.data
    return App.HttpService.getDealerShopProducts({
      currentPage, pageSize: 20,
      data: {
        ascending: isAscending, sort,
        brandIds, firstCategoryId, searchKey,
        secondCategoryId: categoryIds,
        shopId,
      }
    }).then(data => {
      this.processData(data)
    }).catch(e => {
      wx.hideLoading()
      $yjpToast.show({ text: e })
      this.setData({ initing: false, requesting: false })
    })
  },
  processData(data) {
    if (data.data.length != 0) {
      let extraProducts = ProductUtil.rebuildProducts(data.data, `dealerShop`)
      this.setData({ currentPage: ++this.data.currentPage, productList: this.data.productList.concat(extraProducts), productListTotalCount: data.totalCount || 0 })
    } else if (data.data.length == 0 && this.data.currentPage == 1) {
      this.setData({ productList: [], productListTotalCount: 0 })
    } else {
      $yjpToast.show({ text: `没有更多数据了` })
    }
    this.setData({ requesting: false, initing: false })
    wx.hideLoading()
  },
  rebuildProductList(productList) {
    if (!productList || !productList.length) {
      return []
    } else {
      return ProductUtil.rebuildProducts(productList, `dealerShop`)
    }
  },
  loadMore() {
    this.getProductList()
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
            categoryId: this.data.categoryIds.length ? this.data.categoryIds[0] : this.data.firstCategoryId,
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
      $yjpDialog.open({
        pullDownDialogType: keyword, marginTop: 464,
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
    const originalCategoryId = this.data.categoryIds.length ? this.data.categoryIds[0] : ``
    let dialogData = this.data.$yjp.dialog.dialogData
    const categoryId = e.currentTarget.dataset.categoryId
    const firstCategoryName = dialogData.firstCategorys.find(item => item.categoryId == dialogData.firstCategoryId).categoryName
    const sonName = e.currentTarget.dataset.sonName
    this.setData({
      [`$yjp.dialog.dialogData.categoryId`]: categoryId,
      firstCategoryId: dialogData.firstCategoryId,
      categoryIds: categoryId == dialogData.firstCategoryId ? [] : [categoryId],
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
  //隐藏搜索菜单
  hidePullDownDialog() {
    this.setData({ categoryMenuShow: false, brandMenuShow: false, sortMenuShow: false })
    typeof this[`$yjp.dialog.hide`] === `function` && this[`$yjp.dialog.hide`]()
  },
  //商品促销信息弹半框
  goPromotions(e) {
    let item = e.currentTarget.dataset.tag;
    this.promotions(item);
  },
  //商品详情
  goToProductDetail(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    App.WxService.navigateTo(App.Constants.Route.productDetail, { productSkuId })
  },
  //经销商活动跳转
  goToActivitiesDetail(e) {
    let activity = e.currentTarget.dataset.activity
    if (activity.promotionType == 5) {
      App.WxService.navigateTo(App.Constants.Route.comAtyDetail, { activityId: activity.activityId })
    } else {
      App.WxService.navigateTo(App.Constants.Route.atyDetail, { activityId: activity.activityId, promotionType: activity.promotionType })
    }
  }
}) 