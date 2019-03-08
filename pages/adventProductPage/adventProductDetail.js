
//活动产品名称，分享，价格举报，送货地址，跳类目
let App = getApp()
import { $yjpToast, $yjpDialog, SwitchAddressJs } from '../../components/yjp.js'
import DateUtil from '../../utils/DateUtil.js'

let userAddress = wx.getStorageSync(`userAddress`) || []
userAddress = userAddress.filter(item => item.state == 0 || item.state == 1)
Page({
  data: {
      exist: true,
      bulk : ''
  },
  onLoad: function (options) {
    const bulk = options.bulk;
    this.data.bulk = bulk;
  	const productSkuId= options.productSkuId;
	  const data = options.nearExpireId;
    this.data.nearExpireId = data
    this.data.isVisitor = wx.getStorageSync(`isVisitor`) || 0
    wx.showLoading({
      title: '加载中',
    })
    Object.assign(this, SwitchAddressJs)
    //是否来自分享
    const isFromShare = options.isFromShare == `true`
    if (isFromShare){
      App.HttpService.onAppLaunch().then(data => {
        this.openShareProduct(productSkuId)
      })
    } else {
      this.initbulkProduct(bulk, productSkuId, data)
    }
  },
  initbulkProduct: function (bulk, productSkuId, data){
    let _this = this;
    App.HttpService.getLargeCargoProductDetail({ bulk, productSkuId, data })
      .then(data => {
        if (data.success && data.data) {
          _this.initProduct(data.data);
        } else {
          _this.setData({ exist: false });
          wx.hideLoading()
        }
      })
      .catch(e => {
        $yjpToast.show({ text: e })
        _this.setData({ exist: false });
        wx.hideLoading()
      })
  },
  openShareProduct: function (productSkuId){
    var that =this
    return App.HttpService.autoLogin()
      .then(data => {
        if (data) {
          if (that.data.bulk=='2'){
            that.initbulkProduct(that.data.bulk, productSkuId, that.data.nearExpireId)
            //临期的分享
          }else{
            //大宗商品，限时惠商品的分享，先统一走这个接口，出问题胡开阳改（18.3.2亲口说）
            return App.HttpService.getShareProductDetail({ data: productSkuId })
              .then(data1 => {
                if (!data1 || !data1.data) {
                  setTimeout(() => App.WxService.switchTab(App.Constants.Route.homePage), 1500)
                  $yjpToast.show(`商品不存在`)
                } else {
                  that.initProduct(data1.data);
                }
              })
          }

        } else {
          //自动登录失败
          App.WxService.redirectTo(App.Constants.Route.login, { shareFail: true })
        }
      })
  },
  //初始化product 
  initProduct : function(product){
  	
  	product.citySelfPickUp = false;
		product.productionDate = DateUtil.getDateStr(product.productionDate);
		product.mainPrice = product.productPrice ? product.productPrice.price : product.price;

    product.maxBuyNum = product.canSellStoreCount;
    if (product.productTags && product.productTags.length) {
      for (let tag of product.productTags) {
        //限购
        if (tag.tagType == 1) {
          product.limitBuyCount = parseInt(tag.value)
          product.maxBuyNum = Math.min(product.canSellStoreCount, product.limitBuyCount);
        }
      }
    }
    if (product.minPurchaseNum > 1) {
      product.minBuyNum = product.minPurchaseNum;
    } else {
      product.minBuyNum = 1;
    }
    if (product.minBuyNum > product.maxBuyNum){
      product.buyNum = 0;
    }else{
      product.buyNum = product.minBuyNum;
    }
		product.stockText =
	    product.stockState == 2 ? `仅剩${product.storeCount}${product.storeUnit}` :
	      product.stockState == 3 ? `已抢光` :
	        product.stockState == 4 ? `预售${product.presaleStoreCount}${product.storeUnit}` : ``	
	        
		if (product.productTags && product.productTags.length) {
		    for (let tag of product.productTags) {
		      //限购
		      if (tag.tagType == 1) {
		        product.limitBuyTag = tag;
		        product.limitBuyCount = parseInt(tag.value);
		      }
		      //产品底部展示标签(数组)
		      if (tag.tagType == 1 || tag.tagType == 2 || tag.tagType == 3 || tag.tagType == 4 || tag.tagType == 7 || tag.tagType == 97 || tag.tagType == 99) {
		        if (product.showTags instanceof Array) { product.showTags.push(tag) } else { product.showTags = [tag] }
		       // if (tag.tagType == 99) { product.selfPickUpReduceTag = tag; product.selfPickUpReduce = parseInt(tag.value); }
		      }
		      //会员等级标签
		      if (tag.tagType == 97) {
		        product.levelNotice = tag.tagDetail
		      }
		      //商品详情，促销活动数组
		      if (tag.tagType == 2 || tag.tagType == 3 || tag.tagType == 4 || tag.tagType == 5 || tag.tagType == 7 || tag.tagType == 8 || tag.tagType == 11 || tag.tagType == 18) {
		        if (product.promotionTags instanceof Array) { product.promotionTags.push(tag) } else { product.promotionTags = [tag] }
		      }
		      //优惠通知，特别提示 商品详情展示需要
		      if (tag.tagType == 98) {
		        product.specialNoticeTag = tag
		      }
		    }
		}	
    if (product.productInfo && product.productInfo.length) {
      for (let item of product.productInfo) {
        for (let key in item) {
          if (product.productInfoArray instanceof Array) { product.productInfoArray.push({ key: key, value: item[key] }) } else { product.productInfoArray = [{ key: key, value: item[key] }] }
        }
      }
    }
    this.setData({
        productDetail: product, bulk: this.data.bulk, isVisitor: this.data.isVisitor,
        userAddress, userState: App.globalData.userDetail.state,
        LargeCargoProductDesc: App.globalData.settingValue.LargeCargoProductDesc,
        windowHeight: App.globalData.systemInfo.windowHeight,
        detailAddressText: this.getDetailAddressText(userAddress, App.globalData.addressId)
       },
      function(){
          wx.hideLoading()
    });
  },
  //配送方式 
  deliveryModeAddressTip(e) {
    let { productDetail } = this.data
    //deliveryMode	配送方式 0-可配送可自提， 1-可配送 ，2-可自提
    if (productDetail.saleMode != 2 && productDetail.saleMode != 6) {
      productDetail.deliveryMode = e
      this.setData({ productDetail })
    }
  },
  decrease: function (e) {
    let product = e.currentTarget.dataset.product;
    const currentVal = product.buyNum;
    const minBuyNum = product.minBuyNum;
    const maxBuyNum = product.maxBuyNum;
    let afterSubNum = (currentVal - 1) < minBuyNum ? minBuyNum :
      (currentVal - 1) > maxBuyNum ? maxBuyNum :
        (currentVal - 1)
    product.buyNum = afterSubNum;
    this.setData({ productDetail: product });
  },
  increase: function (e) {
    let product = e.currentTarget.dataset.product;
    const currentVal = product.buyNum;
    const minBuyNum = product.minBuyNum;
    const maxBuyNum = product.maxBuyNum;
    if (minBuyNum > maxBuyNum){
      $yjpToast.show({ text: '起购数量大于库存数量!' })
      return ;
    }
    let afterAddNum = (currentVal + 1) < minBuyNum ? minBuyNum :
      (currentVal + 1) > maxBuyNum ? maxBuyNum :
        (currentVal + 1)
    product.buyNum = afterAddNum;
    this.setData({ productDetail: product });

  },
  editNumber: function (e) {
    const currentVal = parseInt(e.detail.value) || 0;
    let product = e.currentTarget.dataset.product;
    const minBuyNum = product.minBuyNum;
    const maxBuyNum = product.maxBuyNum;
    let targetNum = currentVal < minBuyNum ? minBuyNum :
      currentVal > maxBuyNum ? maxBuyNum :
        currentVal;
    product.buyNum = targetNum;
    this.setData({ productDetail: product });
  },
  //加入购物车 
  addToCart() {

    let _this = this;
    let productItem = _this.data.productDetail;
    const productStorageKey = _this.data.bulk == 1 ? 'bulkProductData' : 'adventProductData';
    wx.getStorage({
      key: productStorageKey,
      success: function (res) {
       
        let adventProductData = res.data || [];
        let index;
        if (productStorageKey == 'adventProductData') {//临期产品判断用到nearExpireId
           index = adventProductData.findIndex(item => item.productSkuId == productItem.productSkuId
            && item.productSaleSpecId == productItem.productSaleSpecId && item.nearExpireId == productItem.nearExpireId);
        } else {
          index = adventProductData.findIndex(item => item.productSkuId == productItem.productSkuId
            && item.productSaleSpecId == productItem.productSaleSpecId);
        } 
        if (index >= 0) {
          for (let product of adventProductData) {
            if (product.productSkuId == productItem.productSkuId && product.productSaleSpecId == productItem.productSaleSpecId) {
              product.buyNum += productItem.buyNum;
            }
          }
        } else {
          adventProductData.push(productItem);
        }
        wx.setStorage({
          key: productStorageKey,
          data: adventProductData,
          success: function (res) {
            $yjpToast.show({ text: '加入购物车成功' })
          }
        })
      },
      fail: function (res) {
        let adventProductData = [];
        adventProductData.push(productItem);
        wx.setStorage({
          key: productStorageKey,
          data: adventProductData,
          success: function (res) {
            $yjpToast.show({ text: '加入购物车成功' })
          }
        })
      }
    })
  },
  backToTop() {
    this.setData({ scrollPosition: 'top' })
  },
  goToShopCart() {
    App.WxService.navigateTo(App.Constants.Route.adventProductCart, { bulk: this.data.bulk })
  },
  goToLogin() {
    App.WxService.reLaunch(App.Constants.Route.login)
  },
  goOrderSubmit() {
    const userDetail = App.globalData.userDetail;
    const userState = userDetail.state;
    const auditRejectionReason = userDetail.auditRejectionReason || ``;
    if (userState == 3) {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        hiddenCancel: true, confirmText: `我知道了`,
        dialogData: { text: `您的账号未通过审核,审核通过后可下单，审核不通过原因:${auditRejectionReason}` }
      })
      return
    }
    let productDetail = this.data.productDetail
    if (productDetail.canSellStoreCount < (productDetail.minPurchaseNum || 0) && productDetail.saleMode != 2 && productDetail.saleMode != 6) {
      return $yjpToast.show({ text: `该产品库存不足` })
    }
    let detail = this.data.productDetail
    detail.buyCount = detail.buyNum
    //订单限制起送金额
    if (detail.productPrice.price * detail.buyCount * detail.saleSpecQuantity < this.data.minBuyAmount && detail.saleMode != 2 && detail.saleMode != 6) {
      return $yjpToast.show({ text: `订单满${this.data.minBuyAmount}元起送` })
    }
    let list = [detail]
    let decodelist = encodeURIComponent(JSON.stringify(list))
    //0表示临期商品，1表示大宗商品
    let cartType = 0
    if (this.data.bulk == 1) {
      cartType = 1
    }
    App.WxService.redirectTo(App.Constants.Route.orderSubmit, { productList: decodelist, cartType, needdecodeURI: true })
  },
  //查看 品牌  类目
  goToProductList(e) {
    const productDetail = this.data.productDetail
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
  onShareAppMessage: function () {
    return {
      path: `${App.Constants.Route.adventProductDetail}?isFromShare=true&productSkuId=${this.data.productDetail.productSkuId}&bulk=${this.data.bulk}&nearExpireId=${this.data.productDetail.nearExpireId }` 
    }
  }
})