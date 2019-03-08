/*
 * author YZS  2018-04-26
 */
//搜索类目为空的问题，会员等级ID匹配的问题
const App = getApp()
import { $yjpToast, $yjpDialog} from '../../components/yjp.js'
let adventProductService = require('./adventProductService.js');
Page({
  data: {
    bulk : '',
    categoryMenuText: `全部类目`,
    brandMenuText: `全部品牌`,
    sortMenuText: `综合排序`,
    categoryMenuShow: false,
    brandMenuShow: false,
    sortMenuShow: false,  
    isEmpty: false,
    productList : [],
    productSearchLabel : '',
    sortList: [{ sortType: 0, sortText: `综合排序` },
    { sortType: 1, sortText: `销量从高到低` },
    { sortType: 2, sortText: `价格从低到高` },
    { sortType: 3, sortText: `价格从高到低` }],
    ParamsData : {//请求参数
        	addressId : '',
        	brandIds : [],
        	firstCategoryId : '',
        	categoryId:[],
          saleModel: -1,// 全部(-1), 酒批配送(1), 合作商配送(2);
        	currentPage : 1,
        	pageSize:20,
        	isAscending:false,
        	searchKey:'',
        	sort : 0,// 按排序号(0),按时间(1),按价格(2),按销量(3),
        	categoryIds : [], // 类目id
          searchSource : 0// 全部类型商品=0,明星爆款商品=1;
        }
  },
  onLoad: function (options) {
   	this.onSelectInterface(options); //页面设置
    this.getProductList();
    this.getSearchCategory();
    this.getSearchBrands();
  },
  onSelectInterface(options) {
	  const systemInfo = App.globalData.systemInfo
      const isVisitor = wx.getStorageSync(`isVisitor`)
	  const isVisitorHeight = systemInfo.windowWidth / 750 * 98
	  const searchAndMenuHeight = systemInfo.windowWidth / 750 * 180
	  const subMenuHeight = systemInfo.windowWidth / 750 * 80 //比例换算  

    let LargeCargoProductDesc = '';
    if (options.bulk == 1) {
       LargeCargoProductDesc = App.globalData.settingValue.LargeCargoProductDesc
       const appSetting = wx.getStorageSync(`appSetting`) || {}
       this.data.productSearchLabel = appSetting.largeCargoProductSearchLabel || ''
    }else if (options.bulk == 2) {
      LargeCargoProductDesc = '以下临期产品，必须线上支付，不可用红包和优惠券，且 不可退货';
      this.data.productSearchLabel = '在临期特价中搜索'
    }
  
    this.setData({
      bulk: options.bulk,//bulk=1 为大宗（特价预售） 2为临期产品  
      [`ParamsData.bulk`]: options.bulk, LargeCargoProductDesc, productSearchLabel : this.data.productSearchLabel,
      windowHeight: systemInfo.windowHeight - searchAndMenuHeight - subMenuHeight,
      isVisitor,isVisitorHeight
    })
  },
  onReady() {
    if(this.data.bulk==1){
      wx.setNavigationBarTitle({ title:'充值特价列表'})
    }else{
      wx.setNavigationBarTitle({title:'临期特价列表'})
    }
  },
  hiddenBulkBtn () {
    this.setData({ LargeCargoProductDesc: '' });
  },
  onShow(){
    this.updateProductListCount();
    this.changeProductStorage();
  },
  //获取产品列表
  getProductList() {
     let _this = this;  
     let ParamsData = this.data.ParamsData; 
     if(this.data.requesting) return
     this.setData({ requesting: true })
      wx.showLoading({
    	  title: '加载中',
     })
      return App.HttpService.getLargeCargoProductList(ParamsData)
        .then(data =>{ 
        	if(data && data.success){
        		_this.processData(data)
        	}
        })
        .catch(e => {
          $yjpToast.show({ text: e})
        	_this.setData({ requesting: false});
        	wx.hideLoading() 
        })
      
  },
  processData(data) {
    if (data.data && data.data.length) {

      const productStorageKey = this.data.bulk == 1 ? 'bulkProductData' : 'adventProductData';
      let productStorage = wx.getStorageSync(productStorageKey) || [];
      let extraProducts = adventProductService.transformProductList(productStorage,data.data)
      this.setData({ currentPage: ++this.data.ParamsData.currentPage, productList: this.data.productList.concat(extraProducts),
        isEmpty: false, requesting: false })

    } else if (!data.data.length && this.data.ParamsData.currentPage == 1) {

      this.setData({ productList: [], isEmpty: true, requesting: false })

    } else {
      $yjpToast.show({ text: `没有更多数据了`})
      this.setData({ requesting: false })
    }
    wx.hideLoading()
  },
  
  //获取类目菜单数据
  getSearchCategory() {
	  let _this = this;
	  //let categoryParams = {data: _this.data.ParamsData};   
    App.HttpService.ListLargeCargoCategory(_this.data.ParamsData)
	  .then(data => _this.setData({ 
		  categoryList: _this.rebuildCategoryList(data.data) 
	  }))
  }, 
  //获取品牌菜单数据
  getSearchBrands() {
	  let _this = this;
	  //let brandParams = {data: _this.data.ParamsData};     
    App.HttpService.ListLargeCargoBrands(_this.data.ParamsData)
	  .then(data => _this.setData({ 
		  brandList: _this.rebuildBrandList(data.data) 
	  }))
  },
  //处理搜索类目数据
  rebuildCategoryList(categoryList) {
    if (!categoryList || !categoryList.length){
		  return ;
	  }
	  for(let item of categoryList){
		  let cateObj = {
					 categoryName : '全部',
					 categoryId :  item.categoryId 
			  }
		  item.sonCategorys.unshift(cateObj);
	  }
	  return categoryList;
  },
  //处理搜索品牌数据
  rebuildBrandList(brandList) {
    if (!brandList || !brandList.length) {
      return [];
    }
    else {
      brandList.unshift({ brandId: ``, brandName: `全部品牌`, highLight: false })
      return brandList;
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
          if (!this.data.categoryList || !this.data.categoryList.length) { 
                 $yjpToast.show({ text: `暂无信息` }); 
                 return; 
            }
          let index = this.data.categoryList.findIndex(item => item.categoryId == this.data.ParamsData.firstCategoryId)
          index = index>=0 ? index : 0;
          dialogData = {
            firstCategoryId: this.data.categoryList[index].categoryId, //默认选择第一项 
            categoryId : this.data.ParamsData.categoryId[0] || this.data.categoryList[index].sonCategorys[0].categoryId,
            firstCategorys: this.data.categoryList,
            sonCategorys: this.data.categoryList[index].sonCategorys
          }
          this.setData({ categoryMenuShow: true })
          break;

        case `brandMenu`:
          if (!this.data.brandList || !this.data.brandList.length) { $yjpToast.show({ text: `暂无信息` }); return; }
          dialogData = {
            brandId: this.data.brandList[0].brandId,
            brandList: this.data.brandList
          }
          this.setData({ brandMenuShow: true })
          break;
        case `sortMenu`:
          dialogData = {
            sortType: this.data.ParamsData.sort || 0,
            sortList: this.data.sortList
          }
          this.setData({ sortMenuShow: true })
          break;
      }
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
    const originalFirstCategoryId = this.data.ParamsData.firstCategoryId
    const originalCategoryId = this.data.ParamsData.categoryId[0] || ''

    let dialogData = this.data.$yjp.dialog.dialogData
    const categoryId = e.currentTarget.dataset.categoryId //点击二级类目
    
    const firstCategoryName = dialogData.firstCategorys.find(item => item.categoryId == dialogData.firstCategoryId).categoryName
    const sonName = e.currentTarget.dataset.sonName
    this.setData({
      [`$yjp.dialog.dialogData.categoryId`]: categoryId,
      [`ParamsData.firstCategoryId`]: dialogData.firstCategoryId,
      [`ParamsData.categoryId`]: categoryId == dialogData.firstCategoryId ? [] : [categoryId],
      categoryMenuText : categoryId === dialogData.firstCategoryId ? `全部${firstCategoryName}` : sonName,
      [`ParamsData.currentPage`]: 1, productList: [], [`ParamsData.brandIds`]: [], brandMenuText: `全部品牌`
    })
     this.switchMenu(`categoryMenu`)
    // if (originalCategoryId != categoryId) {//???
    //   this.setData({ 
    //      [`ParamsData.currentPage`]: 1, productList: [] 
    //     })
    //   this.getProductList();
    //   this.getSearchBrands().then(data => this.setData({ brandIds: [], brandMenuText: `全部品牌` }))
    // }
    this.getProductList();
    this.getSearchBrands();
  },
  //点击菜单品牌
  onClickBrand(e) {
    const originalBrandId = this.data.ParamsData.brandIds.length ? this.data.ParamsData.brandIds[0] : ``
    const brandId = e.currentTarget.dataset.brandId
    const brandName = e.currentTarget.dataset.brandName
    this.setData({
    	[`ParamsData.brandIds`]: brandId ? [brandId] : [],
        brandMenuText: brandName,
      [`ParamsData.currentPage`]: 1, productList: []
    })
    this.switchMenu(`brandMenu`)
    this.getProductList()
  },
  //点击排序筛选
  onClickSort(e) {
    const originalSortType = this.data.ParamsData.sortType
    const sortType = e.currentTarget.dataset.sortType
    const sortText = e.currentTarget.dataset.sortText
    this.setData({
       [`ParamsData.sortType`] : sortType, sortMenuText: sortText 
     })
    this.switchMenu(`sortMenu`)
    if (originalSortType != sortType) {
      switch (sortType) {
        case 0:
          this.setData({ [`ParamsData.isAscending`]: false, [`ParamsData.sort`]: 0, [`ParamsData.currentPage`]: 1, productList: []})
          break;
        case 1:
          this.setData({ [`ParamsData.isAscending`]: false, [`ParamsData.sort`]: 3, [`ParamsData.currentPage`]: 1, productList: []})
          break;
        case 2:
          this.setData({ [`ParamsData.isAscending`]: true, [`ParamsData.sort`]: 2, [`ParamsData.currentPage`]: 1, productList: []})
          break;
        case 3:
          this.setData({ [`ParamsData.isAscending`]: false, [`ParamsData.sort`]: 2, [`ParamsData.currentPage`]: 1, productList: []})
          break;
        default:
          break;
      }
      this.getProductList()
    }
  },
  hidePullDownDialog() {
    this.setData({ categoryMenuShow: false, brandMenuShow: false, sortMenuShow: false })
    typeof this[`$yjp.dialog.hide`] === `function` && this[`$yjp.dialog.hide`]()
  },
  onChangeSearchKey(e) {
    this.setData({ [`ParamsData.searchKey`] : e.detail.value })
  },
  onClickSearchButton() {
    this.hidePullDownDialog()
    this.setData({  categoryMenuText: `全部类目`, brandMenuText: `全部品牌`, [`ParamsData.currentPage`]: 1, productList: [] ,
      [`ParamsData.brandIds`]: [], [`ParamsData.firstCategoryId`]: '', [`ParamsData.categoryId`]: []
    })
    this.getProductList()
    this.getSearchCategory()
    this.getSearchBrands()
  },
  updateBottomBar(e) {
      //console.log (e.detail);// 自定义组件触发事件时提供的detail对象
      this.changeProductStorage();
  },
  changeProductStorage(){
    let _this = this;
    const productStorageKey = _this.data.bulk==1 ? 'bulkProductData' : 'adventProductData';
    let bottomBarObj = {
      // addToShopCartNum, addToShopCartPrice
      addToShopCartNum: 0,
      addToShopCartPrice: 0
    };
    wx.getStorage({
      key: productStorageKey,
      success: function (res) {
        let adventProductData = res.data;
        for (let product of adventProductData) {
          product.price = product.productPrice ? product.productPrice.price : product.price;
          product.reducePrice = product.productPrice ? product.productPrice.reducePrice : product.reducePrice;
          //计算总数 
          bottomBarObj.addToShopCartNum += product.buyNum;
          //计算总价 
          let currentProductTatal = product.buyNum * (product.price - product.reducePrice) * product.saleSpecQuantity
          bottomBarObj.addToShopCartPrice += currentProductTatal;
        }
        bottomBarObj.addToShopCartPrice = bottomBarObj.addToShopCartPrice.toFixed(2);
        _this.setData({ bottomBarObj: bottomBarObj});
      },
      fail: function (res) {
        //nothing 
        bottomBarObj.addToShopCartPrice = bottomBarObj.addToShopCartPrice.toFixed(2);
        _this.setData({ bottomBarObj: bottomBarObj });
      }
    })
  },
 //同步购物车修改商品的数量 
  updateProductListCount(){
    let list = this.data.productList; 
    const productStorageKey = this.data.bulk == 1 ? 'bulkProductData' : 'adventProductData';
    let productStorage = wx.getStorageSync(productStorageKey) || [];
    let extraProducts = adventProductService.transformProductList(productStorage, list)
    this.setData({ productList: extraProducts})
  },
  // 返回顶部
  backToTop() {
    this.setData({ scrollPosition: 'top' })
  },
  goToLogin() {
    App.WxService.reLaunch(App.Constants.Route.login)
  },
  loadMore() {
	  this.getProductList();
  },
  onGoToShopCart() {
    App.WxService.navigateTo(App.Constants.Route.adventProductCart,{bulk:this.data.bulk})
  }

})