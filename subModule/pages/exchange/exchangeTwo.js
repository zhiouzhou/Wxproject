// pages/exchange/exChangeTwo.js
const App = getApp()
import { $yjpToast, $yjpDialog, ProductPromotions } from '../../../components/yjp.js'
import { AddToShopCartUtil, DateUtil, ProductUtil } from '../../../utils/CommonUtils.js'

Page({

  /**
   * 页面的初始数据
   */
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
    totalItemEstimatePrice: 0,//退货商品货值
    totalPrice: 0,//找货商品金额
    categoryShow: false,
    brandShow: false,
    filterShow: false,
    titleShow: true
  },
  //查询参数
  params: {
    firstCategoryId: '',
    categoryId: "",
    brandId: '',
    currentPage: 1,
    isAscending: false,
    pageSize: 20,
    saleModel: -1,
    searchKey: '',
    searchSource: 1,
    sort: 0,
    totalPage: 0,
    totalCount: 0,
    supportSwapOrder: true
  },
  requesting: false,
  swapItems: [],
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    if (options && options.params) {
      this.swappableParams = JSON.parse(options.params);
      this.setData({
        totalItemEstimatePrice: this.swappableParams.totalItemEstimatePrice
      })
    }
    this.setData({ initing: true })
    Object.assign(this, ProductPromotions)
    this.getProductList();
    //获取类目列表
    this.initCategory();
    //获取品牌列表
    this.queryBrand();
    wx.getStorage({
      key: 'appSetting',
      success: function (data) {
        that.setData({
          productSearchLabel: data.data.productSearchLabel
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if(this.params.currentPage <this.params.totalPage) {
      this.params.currentPage ++;
      this.getProductList();
    }
  },
  //获取产品列表
  getProductList() {
    if (this.requesting) return
    this.requesting = true
    wx.showLoading({
      title: '加载中',
    })
    //普通列表
    if (this.params.categoryId && !Array.isArray(this.params.categoryId)) {
      this.params.categoryId = this.params.categoryId.split();
    } else if (!this.params.categoryId){
      this.params.categoryId = [];
    }
    return App.HttpService.queryProductList(this.params)
      .then(data => this.processData(data))
      .catch(e => { 
        this.requesting = false;
         wx.hideLoading() })
  },
  processData(data) {
    let extraProducts = ProductUtil.rebuildProducts(data.data, `exchange`);
    if (this.params.currentPage == 1) {
      this.setData({
        productList: extraProducts
      }) 
    } else {
      this.setData({ productList: this.data.productList.concat(extraProducts) })
    }
    this.params.totalCount = data.totalCount;
    this.params.totalPage = Math.ceil(data.totalCount / this.params.pageSize);
    this.setData({
      isEmpty: !this.data.productList.length
    })
    this.requesting= false;
    wx.hideLoading()
  },
  //重写加减购物车函数，产品加减框，数量加
  onAddProductBuyNum(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    const sourceId = e.currentTarget.dataset.sourceId || productSkuId
    let product = this.data.productList.find(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
    const productIndex = this.data.productList.findIndex(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
    if (product.enjoyUserLevelDiscount == false) {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        dialogData: { text: `此活动为${product.levelNotice},请先提升您的会员等级，再进行购物吧！` },
        hiddenCancel: true, confirmText: `我知道了`
      })
      return
    }
    let afterAddNum = (product.buyNum + 1) > product.maxBuyNum ? product.maxBuyNum :
      (product.buyNum + 1) < product.minBuyNum ? product.minBuyNum :
        (product.buyNum + 1)
    let ratio = (product.productSkuId == product.productSaleSpecId ? 1 : product.saleSpecQuantity) || 1;
    product.buyNum = afterAddNum;
    this.addSwapList();
    let totalPrice = this.totalBuyPrice(this.swapItems);
    this.setData({
      [`productList[` + productIndex + `].buyNum`]: afterAddNum,
      addToShopCartNum: this.data.addToShopCartNum + (afterAddNum - product.buyNum) * ratio,
      totalPrice
    })
  },
  //产品加减框，直接修改数量
  onInputProductBuyNum(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    const sourceId = e.currentTarget.dataset.sourceId || productSkuId
    let product = this.data.productList.find(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
    const originalBuyNum = product.buyNum
    const productIndex = this.data.productList.findIndex(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
    if (product.enjoyUserLevelDiscount == false) {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        dialogData: { text: `此活动为${product.levelNotice},请先提升您的会员等级，再进行购物吧！` },
        hiddenCancel: true, confirmText: `我知道了`
      })
      this.setData({ [`productList[` + productIndex + `].buyNum`]: 0 })
      return
    }
    let ratio = (product.productSkuId == product.productSaleSpecId ? 1 : product.saleSpecQuantity) || 1
    let inputNum = parseInt(e.detail.value) == 0 ? 0 : parseInt(e.detail.value) ? parseInt(e.detail.value) : product.minBuyNum * ratio
    inputNum = inputNum < product.minBuyNum * ratio ? product.minBuyNum * ratio : inputNum > product.maxBuyNum * ratio ? product.maxBuyNum * ratio : inputNum
    //拆包情况下输入的不是规格的倍数
    if (product.productSkuId != product.productSaleSpecId && inputNum % ratio != 0) {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        dialogData: { text: `此商品只能以${ratio}的倍数购买` },
        hiddenCancel: true, confirmText: `我知道了`
      })
      this.setData({ [`productList[` + productIndex + `].buyNum`]: originalBuyNum })
      return
    }
    product.buyNum = inputNum / ratio;
    this.addSwapList();
    let totalPrice = this.totalBuyPrice(this.swapItems);
    this.setData({
      [`productList[` + productIndex + `].buyNum`]: inputNum / ratio,
      addToShopCartNum: this.data.addToShopCartNum - (product.buyNum - inputNum / ratio) * ratio,
      totalPrice
    })
  },
  //产品加减框，数量减
  onSubProductBuyNum(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    const sourceId = e.currentTarget.dataset.sourceId || productSkuId
    let product = this.data.productList.find(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
    const productIndex = this.data.productList.findIndex(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
    if (product.enjoyUserLevelDiscount == false) {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        dialogData: { text: `此活动为${product.levelNotice},请先提升您的会员等级，再进行购物吧！` },
        hiddenCancel: true, confirmText: `我知道了`
      })
      return
    }
    let afterSubNum = (product.buyNum - 1) < product.minBuyNum ? 0 :
      (product.buyNum - 1) > product.maxBuyNum ? product.maxBuyNum :
        (product.buyNum - 1)
    //商品起购为5，所以有可能出现的值为0，5，6...，跳级加减
    let ratio = (product.productSkuId == product.productSaleSpecId ? 1 : product.saleSpecQuantity) || 1
    product.buyNum = afterSubNum;
    this.addSwapList();
    let totalPrice = this.totalBuyPrice(this.swapItems);
    this.setData({
      [`productList[` + productIndex + `].buyNum`]: afterSubNum,
      addToShopCartNum: this.data.addToShopCartNum - (product.buyNum - afterSubNum) * ratio,
      totalPrice
    })
  },
  //计算换货估值
  totalBuyPrice(productList) {
    let totalPrice = 0;
    productList.forEach(product => {
      if (product.buyNum > 0) {
        let reducePrice = product.productPrice.reducePrice || 0;
        totalPrice += product.buyNum * (product.productPrice.price - reducePrice) * product.saleSpecQuantity;
      }
    })
    return totalPrice;
  },
  //获取类目
  initCategory() {
    let params = {
      data: {}
    };
    App.HttpService.listSearchCategory(params).then(data=> {
      for(let category of data.data) {
        let o = {};
        o.categoryName = "全部";
        o.categoryId = "";
        o.parentId = category.categoryId;
        category.sonCategorys = category.sonCategorys || [];
        for (let son of category.sonCategorys) {
          son.parentId = category.categoryId;
        }
        category.sonCategorys.unshift(o)

      }
      let categoryList = data.data[0].sonCategorys;

      this.setData({
        firstCategoryList: data.data,
        categoryList
      })
    })
  },
  //获取类目下的品牌
  queryBrand() {
   let barandParams = {
     data: {
       firstCategoryId: this.params.firstCategoryId,
       searchSource: 0,
       categoryIds: this.params.categoryId
     }
   }
   if (barandParams.data.categoryIds && !Array.isArray(barandParams.data.categoryIds)) {
     barandParams.data.categoryIds = barandParams.data.categoryIds.split()
   } else if (!barandParams.data.categoryIds){
     barandParams.data.categoryIds = [];
   }
    App.HttpService.queryProductBrands(barandParams).then(data=> {
      let o = {};
      o.brandId = "";
      o.brandName = "全部品牌";
      data.data.unshift(o)
      this.setData({
        brandList: data.data
      })
    })
  },
  //切换展示类目
  toggleCategoryList() {
    let categoryShow = !this.data.categoryShow;
    this.setData({
      categoryShow,
      brandIdShow: false,
      filterShow: false
    })
  },
  //切换展示品牌列表
  toggleBrandList() {
    let brandShow = !this.data.brandShow;
    this.setData({
      categoryShow: false,
      brandShow,
      filterShow: false
    })
  },
  //切换筛选条件列表
  toggleFilterList() {
    let filterShow = !this.data.filterShow;
    this.setData({
      categoryShow: false,
      brandIdShow: false,
      filterShow
    })
  },
  //选择一级类目
  selectFirstCategory(e) {
    let categoryId = e.currentTarget.dataset.categoryId;
    let categoryList;
    this.params.firstCategory = categoryId;
    for(let category of this.data.firstCategoryList) {
      if (category.categoryId == categoryId) {
        categoryList = category.sonCategorys;
      }
    }
    this.setData({
      categoryList,
      firstCategoryId: categoryId
    })
  },
  //选择二级类目
  selectCategory(e) {
    let categoryId = e.currentTarget.dataset.categoryId;
    this.params.categoryId = categoryId;
    this.params.currentPage = 1;
    this.getProductList();//查询商品
    let categoryMenuText = "";
    let showFirstCategoryId = this.data.firstCategoryId;
    if (categoryId) {
      for(let category of this.data.categoryList) {
        if(category.categoryId == categoryId) {
          categoryMenuText = category.categoryName;
        }
      }
    } else {
      for (let category of this.data.firstCategoryList) {
        if (category.categoryId == this.data.firstCategoryId) {
          categoryMenuText = `全部${category.categoryName}`;
        }
      }
    }
    this.setData({
      categoryShow: false,
      categoryId: categoryId,
      showFirstCategoryId,
      categoryMenuText
    })
  },
  //选择品牌
  selectBrand(e) {
    let brandId = e.currentTarget.dataset.brandId;
    this.params.brandId = brandId;
    this.params.currentPage = 1;
    let brandMenuText = "";
    for(let brand of this.data.brandList) {
      if(brand.brandId == brandId) {
        brandMenuText = brand.brandName;
      }
    }
    this.setData({
      brandId,
      brandMenuText,
      brandShow: false
    })
    this.getProductList();//查询商品
  },
  //搜索
  inoutKeywords(e) {
    this.params.searchKey = e.detail.value;
  },
  doSearch() {
    this.params.currentPage = 1;
    this.getProductList();//查询商品
  },

  //选择排序条件
  selectFilter(e) {
    let sortType = e.currentTarget.dataset.sortType;
    this.params.currentPage = 1;
    let sortMenuText = "";
    switch(sortType) {
      case 0://综合排序
        this.params.sort = 0;
        this.params.isAscending = false;
        sortMenuText = "综合排序"
        break;
      case 1://销量从高到低
        this.params.sort = 3;
        this.params.isAscending = false;
        sortMenuText = "销量从高到低";
        break;
      case 2://价格从低到高
        this.params.sort = 2;
        this.params.isAscending = true;
        sortMenuText = "价格从低到高";
        break;
      case 3://价格从高到低排序
        this.params.sort = 2;
        this.params.isAscending = false;
        sortMenuText = "价格从高到低"
        break;
    }
    this.setData({
      sortType,
      sortMenuText,
      filterShow: false
    })
    this.getProductList();//查询商品
  },
  //商品加入换货数组
  addSwapList () {
    for (let item of this.data.productList) {
      if (item.buyNum > 0 && this.swapItems.indexOf(item) < 0) {
        this.swapItems.push(item)
      }
    }
    this.swapItems = this.swapItems.filter(item => {
      return item.buyNum >0;
    })
  },
  //隐藏筛条件
  hiddenTab() {
    this.setData({
      categoryShow: false,
      filterShow: false,
      brandShow: false
    })
  },
  closeTitle() {
    this.setData({
      titleShow: false
    })
  },
  goNextStep() {
    if (!this.data.totalPrice) {
      $yjpToast({text: "请选择换货产品"})
      return;
    }
    if (this.data.totalPrice < this.data.totalItemEstimatePrice) {
      $yjpToast({text: "换货商品总额须大于退货商品总额"})
      return;
    }
    // let swapItems = [];
    // for (let item of this.data.productList) {
    //   if(item.buyNum >0 ) {
    //     swapItems.push(item)
    //   }
    // }
    this.swappableParams.swapItems = this.swapItems;
    this.swappableParams.totalPrice = this.data.totalPrice;
    App.WxService.navigateTo(App.Constants.Route.exchangThree,{
      params: this.swappableParams
    })
  }
})