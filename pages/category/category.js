// pages/category/category.js
//独家包销，待处理
const App = getApp()
import { DateUtil, ProductUtil, AddToShopCartUtil, FunctionUtils } from '../../utils/CommonUtils.js'
import { $yjpToast, AddToShopCartJs } from '../../components/yjp.js'
const { watch, debounce, equlObj } = require('../../utils/vuefy.js')
Page({
  data: {
    categoryList: [],
    windowHeight: 0,
    second_height: 0,
    selectCategoryId: `proAndDis`,
    tab: 'all',//tab-swicth 
    showSqureList: false,
    meLeftData: [],
    meCurrentCateId: null,//mycategory current categoryid 
    meRightData: [],
    //第一次进来，渲染第一个类目中商品的数量
    firstRanderData:10,
    //第一次进来，直接渲染商品数量小于该数量的类目
    firstCategoryRanderData:5 ,
    first: true,
    isEmpty:false,
  },
  onLoad: function (options) {
    watch(this, {
      selectCategoryId: function (newVal) {
        this.setData({ selectCategoryId: newVal })
      }
    });
    this.setMeLeftIndex = debounce(function (newVal) {
      for (let [index, value] of this.data.meRightData.entries()) {
        if (index === newVal) {
          this.setData({ meCurrentCateId: value.categoryId, meLeftScrollPosition: value.categoryId })
        }
      }
    }, 300);
    watch(this, {
      meCurrentIndex: function (newVal) {
        this.setMeLeftIndex(newVal)
      }
    })
    Object.assign(this, AddToShopCartJs);
    // if (App.globalData.jumpToSecoundPage) {
    //   App.WxService.navigateTo(App.Constants.Route.sHome, { specialAreaId: 1 })
    //   App.globalData.jumpToSecoundPage = false
    // }
    const productSearchLabel = wx.getStorageSync(`appSetting`).productSearchLabel || ``
    const isVisitor = wx.getStorageSync(`isVisitor`)
    const userDetail = wx.getStorageSync(`userDetail`)
    const state = userDetail ? userDetail.state : null;
    //列表优惠卷提示计算时的金额
    let userCouponMoney = AddToShopCartUtil.getUserCouponMoneyforDefault()
    let currentProductMoney = AddToShopCartUtil.getUserMoneyforDefault()

    this.setData({
      productSearchLabel, isVisitor, state,
      addToShopCartNum: AddToShopCartUtil.getAddToShopCartNumFromStorage(`exceptLargeCargo`),
      addToShopCartPrice: AddToShopCartUtil.getAddToShopCartPriceFromStorage(`exceptLargeCargo`),
      userCouponMoney,
      currentProductMoney,
      //列表优惠卷提示
      userCouponPrompt: AddToShopCartUtil.getUserCouponPrompt(currentProductMoney, userCouponMoney)
    })
    wx.showLoading({ title: '加载中' })
    App.HttpService.listCategory()
      .then(data => this.rebuildCategory(data))
  },
  onReady() {
    const systemInfo = App.globalData.systemInfo
    this.setData({
      // second部分高度 = 利用窗口可使用高度 - first部分高度（这里的高度单位为px，利用比例将92rpx转换为px）
      second_height: systemInfo.windowHeight - systemInfo.windowWidth / 750 * 92,
      windowHeight: systemInfo.pixelRatio * systemInfo.windowHeight,
      windowWidth: systemInfo.windowWidth,
      arrowWidth: Math.floor(systemInfo.windowWidth * 88 / 750),
      meScrollListHeight: systemInfo.windowHeight - Math.ceil(systemInfo.windowWidth * (88 + 98 + 92 + 88) / 750)
    })
  },
  rebuildCategory(data) {
    let underwriteItem
    data.data.categoryList.map(item => {
      if (item.categoryType == 4) {
        item.categoryId = `underwrite`
        underwriteItem = item
      }
    })
    let categoryList = data.data.categoryList.filter(item => item.categoryType == 3)
    //去掉子类目中的全部品牌
    for (let item of categoryList) {
      item.brandList = item.sonCategorys[0].brandList
      item.sonCategorys = item.sonCategorys.filter(sonItem => sonItem.sonId != item.categoryId)
    }
    if (underwriteItem) {
      categoryList.unshift(underwriteItem)
    }
    let promotionCategorys = data.data.promotionCategorys
    categoryList.unshift({ categoryId: `proAndDis`, name: App.globalData.settingValue.PromotionCategoryName || `优惠特价`, sonCategorys: promotionCategorys })
    let _this = this
    this.setData({ categoryList }, function (e) {
      _this.listMyProductBrief();
      wx.hideLoading()
      setTimeout(() => {
        _this.calculateHeightList()
      }, 40)
    })
  },

  //点击左侧类目按钮
  onSelectLeftScroll(e) {
    const id = e.currentTarget.dataset.categoryId
    this.setData({
      leftScrollPosition: `left-${id}`,
      rightScrollPosition: `right-${id}`,
    })
  },
  //去商品列表
  goToProductList(e) {
    const firstCategoryId = e.currentTarget.dataset.firstCategoryId || ``
    const firstCategoryName = e.currentTarget.dataset.firstCategoryName || ``
    const categoryId = e.currentTarget.dataset.categoryId ? [e.currentTarget.dataset.categoryId] : ``
    const categoryType = e.currentTarget.dataset.categoryType
    const sonName = e.currentTarget.dataset.sonName || ``
    const brandIds = e.currentTarget.dataset.brandId ? [e.currentTarget.dataset.brandId] : ``
    const brandName = e.currentTarget.dataset.brandName || ``
    if (categoryType == 2) {
      App.WxService.navigateTo(App.Constants.Route.comAtyList, { FirstCategoryId: firstCategoryId, FirstCategoryName: firstCategoryName, brandName: brandName })
    } else {
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '类目品牌查看', eventType: 301, actionId: e.currentTarget.dataset.categoryId })
      App.WxService.navigateTo(App.Constants.Route.productList, { firstCategoryId, categoryId, brandIds, firstCategoryName, sonName, brandName })
    }
  },
  //去搜索页面
  goToSearch() {
    App.WxService.navigateTo(App.Constants.Route.search)
  },
  //去优惠特价
  goToProAndDis(e) {
    const categoryType = parseInt(e.currentTarget.dataset.categoryType)
    // FunctionUtils.bindNomalTalkingDataEvent("类目优惠特价情况分析", { categoryType: categoryType })
    if (categoryType == 6) {//临期入口
      App.WxService.navigateTo(App.Constants.Route.adventProductList, { bulk: 2 })
      return;
    }
    if (categoryType == 7) {//酒批特价处理经销商 delearSale
      App.WxService.navigateTo(App.Constants.Route.productList, { delearSale: true })
      return;
    }
    if (categoryType == 8) {//特价预售（畅销特价）
      App.WxService.navigateTo(App.Constants.Route.adventProductList, { bulk: 1 })
      return;
    }
    const sonCategorys = e.currentTarget.dataset.sonCategorys
    let purposeItem = sonCategorys.find(item => item.categoryType == 1)
    const labelId = purposeItem ? purposeItem.categoryId : ``
    App.WxService.navigateTo(App.Constants.Route.proAndDis, { labelId, categoryType })
  },
  //去独家包销产品列表
  goToUnderwrite(e) {
    App.WxService.navigateTo(App.Constants.Route.underwriteList, {
      categoryType: e.currentTarget.dataset.categoryType,
      categoryId: e.currentTarget.dataset.categoryId,
      categoryName: e.currentTarget.dataset.sonName
    })
  },
  //全部类目
  calculateHeightList() {
    this.heightList = [0];
    const query = wx.createSelectorQuery();
    query.selectAll('.right-scroll-item-wrap').boundingClientRect()
    query.exec((res) => {
      var data = res[0]
      var h = 0
      for (var i = 0, len = data.length; i < len; i++) {
        h += data[i].height
        this.heightList.push(h)
      }
    })
  },
  //计算右侧item距离顶部的高度，然后联动左侧列表
  query(e) {
    const categoryList = this.data.categoryList;
    let currentScrollTop = e.detail.scrollTop;
    if (this.heightList) {
      let index = this.getCurrentIndex(currentScrollTop, this.heightList)
      this.selectCategoryId = categoryList[index].categoryId
      this.currentIndex = index
    } else {
      this.calculateHeightList();
      let index = this.getCurrentIndex(currentScrollTop, this.heightList)
      this.selectCategoryId = categoryList[index].categoryId
      this.currentIndex = index
    }
  },
  getCurrentIndex(h, arr) {
    for (var j = 0, len = arr.length; j < len; j++) {
      var h1 = arr[j], h2 = arr[j + 1];
      if ((h >= h1 && h < h2) || !h2) {
        return j;
      }
    }
    return 0;
  },

  clearDataInfo() {
    //遍历所有的缓存购的商品，找到位置同时设置buyNum大于1的设置为0
    let path = []
    let that = this
    let initData = {
      addToShopCartNum: AddToShopCartUtil.getAddToShopCartNumFromStorage(`exceptLargeCargo`),
      addToShopCartPrice: AddToShopCartUtil.getAddToShopCartPriceFromStorage(`exceptLargeCargo`),
      userCouponMoney: 0,
      currentProductMoney: 0,
      //列表优惠卷提示
      userCouponPrompt: AddToShopCartUtil.getUserCouponPrompt(0, 0)
    }
    for (let [index, value] of that.data.meRightData.entries()) {
      for (let [pindex, product] of value.productList.entries()) {
        if (product.buyNum > 0) {
          path.push(`meRightData[${index}].productList[${pindex}].buyNum`)
        }
      }
    }
    let b = {}
    if (path.length > 0) {
      for (let [index, value] of path.entries()) {
        b[path[index]] = 0
      }
    }
    //合并只setdata一次
    let setData = FunctionUtils.combineArguments(b, initData)
    that.setData(setData)
  },
  //处理优惠券提示以及起送和金额
  dealCouponTitle() {
    //当前商品总额为0
    let userCouponMoney = AddToShopCartUtil.getUserCouponMoneyforDefault()
    let currentProductMoney = AddToShopCartUtil.getUserMoneyforDefault()
    if (currentProductMoney == 0) {
      //如果从类目中点击去购物车，再返回类目时，不会重新渲染该页面，导致页面之前选中的数量和下面的小计没去掉，这里处理
      this.clearDataInfo()
    } else {
      //列表优惠卷提示计算时的金额
      this.setData({
        addToShopCartNum: AddToShopCartUtil.getAddToShopCartNumFromStorage(`exceptLargeCargo`),
        addToShopCartPrice: AddToShopCartUtil.getAddToShopCartPriceFromStorage(`exceptLargeCargo`),
        userCouponMoney,
        currentProductMoney,
        //列表优惠卷提示
        userCouponPrompt: AddToShopCartUtil.getUserCouponPrompt(currentProductMoney, userCouponMoney)
      })
    }
  },
  /****我的类目****/
  switchTab(e) {
    let selectType = e.currentTarget.dataset.type;
    this.swichType(selectType)
  },
  swichType: function (selectType){
    let me = this;
    //是否显示底部栏
    if (selectType == 'all') {
      me.setData({ first: false, tab: selectType });
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '全部类目', eventType: 301, subType: 1 })
    } else if (selectType == 'me') {
      me.setData({ tab: selectType }, function () {
        if (me.data.first && me.meRightData&&me.meRightData.length) {
          me.meCurrentIndex = 0;//初次选中第一个类目
        }
      });
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '我的类目', eventType: 301, subType: 2 })
    }
  },
  callbackFn: function (categoryId) {
    var _this = this;
    setTimeout(() => {
      this.setData({ meLeftScrollPosition: categoryId, meCurrentCateId: categoryId, meProductScrollPos: categoryId }, function () {
        setTimeout(() => {
          _this.meLeftClickedCategoryId = null;
        }, 500)
      })
    }, 500)
  },
  clickMeLeftItem(e) {
    if (this.data.showSqureList){
      this.setData({ showSqureList: false})
    }
    const $index = e.currentTarget.dataset.index;
    let categoryId = e.currentTarget.dataset.categoryid;//
    if (this.meRightData.length != this.data.meRightData.length){
      this.meLeftClickedCategoryId = categoryId;
    }
    //如果render 该类目 直接jump 
    let alreayRenderSkuIds = this.data.meRightData.findIndex((item) => { return categoryId == item.categoryId });
    if (alreayRenderSkuIds === -1) {
      this.calculateNeedRenderProductList(categoryId, this.splitRenderProductWithSkus);
    } else {
      var _this = this;
      this.setData({ meLeftScrollPosition: categoryId, meCurrentCateId: categoryId, meProductScrollPos: categoryId },function(){
        setTimeout(() => {
          _this.meLeftClickedCategoryId = null;
        }, 500)
      })
    }
  },
  //商品详情
  goToProductDetail(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    App.WxService.navigateTo(App.Constants.Route.productDetail, { productSkuId })
  },
  //初始化商品信息
  initProduct(product) {
    product.minBuyNum = 1
    product.productType = 1
    product.buyNum = 0
    return product
  },
  //获取产品列表
  listMyProductBrief() {
    var me = this;
    //普通列表
    return App.HttpService.listMyProductBrief({})
      .then(res => {
        if (res.data && res.success) {
          //get this.meLeftData &&  me.meRightData && initProduct
          me.meLeftData = [];
          me.meRightData = res.data.sort(function (a, b) {
            return b.productList.length - a.productList.length
          })
          for (let item of me.meRightData) {
            me.meLeftData.push({
              categoryName: item.categoryName,
              categoryId: item.categoryId
            })
            for (let product of item.productList) {
              me.initProduct(product)
            }
          }
          //此时只渲染第一个类目,以及类目中数量小于firstCategoryRanderData的类似
          if (me.meRightData && me.meRightData.length>0){
            me.firstsplitRenderProductWithSkus();
          }else{
            me.setData({isEmpty:true})
          }
        };

      }).catch(e => { wx.hideLoading() })
  },
  getProductDetail(product, skuListDetail) {
    let purposeItem = skuListDetail.find(item => item.productSkuId == product.productSkuId)
    if (!purposeItem) {
      purposeItem = product
    }
    return purposeItem;
  },
  onShow(data) {
    //从我的货架进我的类目
    if (App.globalData.showMycategory) {
      this.swichType('me')
      delete App.globalData.showMycategory
    }

    if (this.data.tab == 'me' && this.data.meRightData.length) {
      this.dealCouponTitle()
    }
    if (this.data.tab == 'me') {
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '我的类目', eventType: 301, subType: 2 })
    } else {
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '全部类目', eventType: 301, subType: 1 })
    }
  },
  renderDataFirst(skuDetail) {
    let neededObj = {}
    //当前选中的第一个类目
    neededObj['meLeftData'] = this.meLeftData;
    neededObj[`meRightData[0].categoryName`] = this.meRightData[0].categoryName;
    neededObj[`meRightData[0].categoryId`] = this.meRightData[0].categoryId;
    let currentindex = 1;
    for (let [index, value] of this.meRightData.entries()) {
      //初始化类目中商品个数小于6的数据
      if (value.productList && value.productList.length < this.data.firstCategoryRanderData && index != 0) {
        for (let i = 0; i < value.productList.length; i++) {
          value.productList[i] = this.getProductDetail(value.productList[i], skuDetail)
        }
        neededObj[`meRightData[${currentindex}].productList`] = value.productList
        neededObj[`meRightData[${currentindex}].categoryName`] = value.categoryName
        neededObj[`meRightData[${currentindex}].categoryId`] = value.categoryId
        currentindex = currentindex + 1
      }
      //初始化第1个类目的商品数据,取前10个
      if (index == 0) {
        let firstRanderData = this.data.firstRanderData
        let firstCatelogLength = value.productList.length > firstRanderData ? firstRanderData : value.productList.length
        let firstProductList = value.productList.slice(0, firstCatelogLength)
        for (let i = 0; i < firstProductList.length; i++) {
          firstProductList[i] = this.getProductDetail(value.productList[i], skuDetail)
        }
        neededObj[`meRightData[0].productList`] = firstProductList
      }
    }

    this.renderingMore = false;
    let me = this
    if (!Object.keys(neededObj).length) {
      neededObj['isEmpty'] = true;
    } else if (me.data.meRightData.length) {
      neededObj['isEmpty'] = false;
      wx.showLoading({
        title: '加载中',
      })
    }
    this.setData(neededObj, function () {
      wx.hideLoading()
      me.calculateMeHeightList();
      me.callbackFn.call(me, me.meRightData[0].categoryId);
    })
  },
  //第一次进来渲染
  firstsplitRenderProductWithSkus() {
    //获取要查询的skuid
    let skuids = []
    // let currentindex = 1;
    for (let [index, value] of this.meRightData.entries()) {
      if (value.productList && value.productList.length < this.data.firstCategoryRanderData && index != 0) {
        for (let product of value.productList) {
          skuids.push(product.productSkuId);
        }
      }
      if (index == 0) {
        let firstRanderData = this.data.firstRanderData
        let firstCatelogLength = value.productList.length > firstRanderData ? firstRanderData : value.productList.length
        for (let i = 0; i < firstCatelogLength; i++) {
          skuids.push(value.productList[i].productSkuId);
        }
      }
    }
    //TODO :查询出各个类目中商品的商品详情
    this.getSkuIdsDetail(skuids, this.renderDataFirst)
  },
  showSqureList() {
    this.setData({ showSqureList: !this.data.showSqureList })
  },
  //我的类目计算区间
  calculateMeHeightList() {
    this.meHeightList = [0];
    const query = wx.createSelectorQuery();
    query.selectAll('.right-item-container').boundingClientRect()
    query.exec((res) => {
      var data = res[0]
      var h = 0
      for (var i = 0, len = data.length; i < len; i++) {
        h += data[i].height
        if (h > 0) {
          this.meHeightList.push(h)
        }
      }
    });
    if (!this.productHeight) {
      const queryProduct = wx.createSelectorQuery().selectAll('.right-item-product').boundingClientRect();
      queryProduct.exec((res) => {
        var data = res[0]
        this.productHeight = data[0].height;
      });
    }

  },
  //RenderMoreSkusOrNextCategory
  isRenderMoreSkus(originList, renderList, categoryId) {
    for (let origin of originList) {
      for (let render of renderList) {
        if (categoryId == origin.categoryId && categoryId == render.categoryId) {
          if (origin.productList.length > render.productList.length)
            return true;
        }
      }
    }
    return false;
  },
  //我的类目滚动派发 
  rightScrollEvent(e) {
    if (this.meLeftClickedCategoryId) return false;
    let currentScrollTop = e.detail.scrollTop;
    if (this.meHeightList && this.meHeightList != 0) {
      this.meCurrentIndex = this.getCurrentIndex(currentScrollTop, this.meHeightList);
    } else {
      this.calculateMeHeightList();
      this.meCurrentIndex = this.getCurrentIndex(currentScrollTop, this.meHeightList);
    }
    //计算一个当前类目下 的 可变化的位置 posCount
    let posCount = Math.floor(this.data.meRightData[this.meCurrentIndex].productList.length * 3 / 4);
    let posScrollHeight = this.meHeightList[this.meCurrentIndex] + this.productHeight * posCount;
    if (posScrollHeight <= currentScrollTop && this.productHeight) {
      //近似触底事件触发  
      this.scrollRender(false, this.meRightData, this.data.meRightData, this.meCurrentIndex);
    }
  },
  //触底事件
  /*
  1.加载当前类目更多商品
  2.加载下一个类目商品 
  */  //我的类目 ==> 触底事件 ==> 判断应该加载的index
  lowedCategoryRender() {
    var list = this.meRightData;
    var renderedData = this.data.meRightData;
    var alreadyRenderIndexs = [];
    if (!renderedData.length) {
      return 0;
    }
    for (let [index, item] of list.entries()) {
      for (let render of renderedData) {
        if (render.categoryId === item.categoryId) {
          alreadyRenderIndexs.push(index);
        }
      }
    }
    for (var i = 0; i < list.length; i++) {
      if (alreadyRenderIndexs.indexOf(i) === -1) {
        return i;
      }
    }
  },
  lowerHandle(e) {
    if (this.meLeftClickedCategoryId) return false;
    this.scrollRender(true, this.meRightData, this.data.meRightData, this.meCurrentIndex);
  },
  // lowerHandle || rightScrollEvent ==> 渲染逻辑 
  scrollRender(lower, originList, renderList, currentIndex) {

    if (this.renderingMore) return false;
    var currentCategoryId = renderList[currentIndex].categoryId;
    let isRenderMoreSkus = this.isRenderMoreSkus(originList, renderList, currentCategoryId);
    if (lower) {//触底事件
      if (originList.length === renderList.length && !isRenderMoreSkus) {
        return false;
      }
      if (!isRenderMoreSkus) { //加载下一个类目
        let nextCateIndex = this.lowedCategoryRender();
        currentCategoryId = originList[nextCateIndex].categoryId;
      }
      //正常加载more 
      this.calculateNeedRenderProductList(currentCategoryId, this.splitRenderProductWithSkus);
    }
    //滑动事件 
    //计算一个当前类目下 的 可变化的位置 posCount
    if (isRenderMoreSkus) {//加载更多 
      this.calculateNeedRenderProductList(currentCategoryId, this.splitRenderProductWithSkus);
    }
  },
  /*
    总关联fn，包含取skus == > 查详情 ==> 渲染cb 
  */
  calculateNeedRenderProductList(clickedCategoryId, cb) {
    if (!clickedCategoryId) { //first no needRenderCategoryId
      clickedCategoryId = this.meRightData[0].categoryId;
    }
    this.renderingMore = true;
    let skuIds = this.sliceCurrentScreenCategorySkuIds(clickedCategoryId);
    this.checkoutSliceSkuIdsDetail(clickedCategoryId, skuIds, cb);
  },
  /*
    拿到请求得到的sku详情 去render==> 
  */
  splitRenderProductWithSkus(clickedCategoryId, requestSkuIdsDetail) {
    /*
      只要 clickedCategoryId 正确 ==>
      requestSkuIdsDetail 此时已经是出入类目下 计算合适(第几页)的商品详情skus
    */
    var me = this, neededObj = {};
    var originList = me.meRightData;
    var renderList = me.data.meRightData;//

    let leftIndex = me.meLeftData.findIndex((item) => {
      return item.categoryId == clickedCategoryId
    });
    let renderIndex = renderList.findIndex((item) => {
      return item.categoryId == clickedCategoryId;
    })
    if (requestSkuIdsDetail.length) {
      // 包含 直接concat 
      if (renderIndex != -1) {
        neededObj[`meRightData[${renderIndex}].productList`] = renderList[renderIndex].productList.concat(requestSkuIdsDetail);
      } else {
        //不包含  新need render category
        var len = renderList.length;
        if (!len) {//第一次render 
          neededObj['meLeftData'] = me.meLeftData;
        }
        neededObj[`meRightData[${len}].productList`] = requestSkuIdsDetail;
        neededObj[`meRightData[${len}].categoryName`] = me.meLeftData[leftIndex].categoryName;
        neededObj[`meRightData[${len}].categoryId`] = clickedCategoryId;
      }
    }
    //添加loading  当有商品渲染的时候
    if (Object.keys(neededObj).length) {
      wx.showLoading({
        title: '加载中',
        mask: true
      })
    };
    me.renderingMore = false;
    me.setData(neededObj, function () {
      wx.hideLoading()
      me.calculateMeHeightList();
      //render之后跳转 TODO  
      if ((renderIndex === -1) || !requestSkuIdsDetail.length) {
        me.callbackFn.call(me, clickedCategoryId);
      }
    })
  },
  //CurrentCategoryId  当前需要render的类目id  hasDetail 
  sliceCurrentScreenCategorySkuIds(needRenderCategoryId) {

    // this.data.meRightData == needRenderCategoryId
    let alreayRenderSkuIds = [];//当前类目已经渲染的商品skus 
    for (let item of this.data.meRightData) {
      if (item.categoryId == needRenderCategoryId) {
        for (let product of item.productList) {
          alreayRenderSkuIds.push(product.productSkuId);
        }
      }
    }
    let skuIds = [], count = 20;
    for (let item of this.meRightData) {
      if (item.categoryId == needRenderCategoryId) {
        for (let product of item.productList) {
          if (!product.hasDetail && count > 0 &&
            alreayRenderSkuIds.indexOf(product.productSkuId) < 0) {
            skuIds.push(product.productSkuId)
            count--
          }
        }
      }
    }
    return skuIds;
  },
  getSkuIdsDetail(skuIds, callback) {
    var me = this;
    App.HttpService.listMyShelfProductByProductIds({ datas: skuIds }).then((res) => {
      if (res.success) {
        let requestSkuIdsDetail = [];
        if (res.data) {
          requestSkuIdsDetail = ProductUtil.rebuildProducts(res.data, `productList`);//商品列表 
          requestSkuIdsDetail = this.deleteSkuAttr(requestSkuIdsDetail);
        }
        callback(requestSkuIdsDetail);
      };
    }).catch(e => { this.renderingMore = false; Promise.reject(e) })
  },
  /*
  拿skuIds去请求 ==> 通过回调render. 
  */
  checkoutSliceSkuIdsDetail(clickedCategoryId, skuIds, cb) {
    var me = this;
    if (me.meLeftClickedCategoryId) {
      wx.showLoading({
        title: '加载中',
        mask: true
      })
    }
    App.HttpService.listMyShelfProductByProductIds({ datas: skuIds }).then((res) => {
      if (res.success) {
        let requestSkuIdsDetail = [];
        if (res.data) {
          requestSkuIdsDetail = ProductUtil.rebuildProducts(res.data, `productList`);//商品列表 
          requestSkuIdsDetail = this.deleteSkuAttr(requestSkuIdsDetail);
        }
        cb(clickedCategoryId, requestSkuIdsDetail);// splitRenderProductWithSkus() 
      };
    }).catch(e => { this.renderingMore = false; Promise.reject(e) })
  },
  deleteSkuAttr(list) {
    const needAttrs = ['productSkuId', 'productName', 'imgUrl', 'mainPrice', 'priceunit', 'canSellStoreCount', 'saleSpecQuantity', 'specName', 'productSaleSpecId',
      'minBuyNum', 'maxBuyNum', 'stockText', 'canSellStoreCount', 'bonusText', 'productPrice', 'couponText', 'isUseCoupon'];
    for (let item of list) {
      Object.keys(item).forEach(function (attr) {
        if (needAttrs.indexOf(attr) < 0) {
          delete item[attr]
        }
      });
      item = this.initProduct(item);
    }
    return list;
  },
  /***End 处理分多次set meRightData****/
  //扫码添加产品
  onScanAdd() {
    let codeResult = null
    App.WxService.scanCode()
      .then(codeResult => {
        return this.getCodeResult(codeResult)
      })
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '扫描加入我的货架', eventType: 901 })
  },
  //查询产品码结果
  getCodeResult(codeResult) {
    let params = { data: codeResult.result }
    return App.HttpService.onScanProduct(params)
      .then(data => {
        if (data.success) {
          if (data.data.state == 1) {
            this.addProductThenShow(data.data)
            return $yjpToast.show({ text: `扫码成功，已在本店类目中成功上架${data.data.productList[0].productName}，继续扫码添加商品`, timer: 4500 })
            //TODO:商品类目，基础细信息 找到这个商品属于哪个类加在该类的最后面，如果该类不存在，加在类别的最后面
          } else if (data.data.state == 2) {
            return $yjpToast.show({ text: `本城市未上架该产品，已为您通知城市经理请，继续扫码添加商品`, timer: 4500 })
          } else if (data.data.state == 3) {
            return App.WxService.navigateTo(App.Constants.Route.scanAddGoods, { codeData: codeResult.result })
          } else if (data.data.state == 4) {
            return $yjpToast.show({ text: `该产品已在我的货架中`, timer: 4500 })
          } else if (data.data.state == 5) {
            return $yjpToast.show({ text: `该产品无法加入我的货架`, timer: 4500 })
          }
        }
      })
      .catch(e => Promise.reject(e))
  },
  //处理通过条形码添加进来的商品显示
  addProductThenShow(catelgoryProduct) {
    let categoryId = catelgoryProduct.categoryId;
    let productSkuId = catelgoryProduct.productList[0].productSkuId;

    let that = this
    App.HttpService.listMyShelfProductByProductIds({ datas: [productSkuId] }).then((res) => {
      if (res.success && res.data) {
        let productInfo = that.initProduct(ProductUtil.rebuildProducts(res.data, `productList`)[0]);//商品列表 
        
        let containCategory = false
        for (let [index, value] of that.data.meRightData.entries()) {
          if (categoryId == value.categoryId) {
            let pindex = value.productList.length
            this.setData({ [`meRightData[${index}].productList[${pindex}]`]: productInfo }, function () {
              that.calculateMeHeightList()
            })
            containCategory = true
            break
          }
        }
        //如果不存在当前类目
        if (!containCategory) {
          const length = that.data.meRightData.length
          catelgoryProduct.productList[0] = productInfo
          that.setData({
            [`meRightData[${length}]`]: catelgoryProduct,
            [`meLeftData[${length}].categoryName`]: catelgoryProduct.categoryName,
            [`meLeftData[${length}].categoryId`]: catelgoryProduct.categoryId
          }, function (data) {
            that.calculateMeHeightList()
          })
        }

      };
    }).catch(e => { Promise.reject(e) })   //如果存在当前类目
  }

})