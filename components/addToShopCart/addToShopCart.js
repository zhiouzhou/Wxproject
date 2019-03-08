const App = getApp()
import $yjpToast from '../toast/toast.js'
import $yjpDialog from '../dialog/dialog.js'
import AddToShopCartUtil from '../../utils/AddToShopCartUtil.js'
import {FunctionUtils}  from '../../utils/CommonUtils.js'
/*
 * 为你推荐加入购物车 
 */
function recommendGoodAddToCart(e){
	const product = e.currentTarget.dataset.product;
  if (!product.canSellStoreCount){
    return false;
  }
	if (product.enjoyUserLevelDiscount == false) {
		    $yjpDialog.open({
		      dialogType: `defaultText`, title: `温馨提示`,
		      dialogData: { text: `此活动为${product.levelNotice},请先提升您的会员等级，再进行购物吧！` },
		      hiddenCancel: true, confirmText: `我知道了`
		    })
		    return
		  }
  let afterSubNum = product.minBuyNum||1;
  //直接加入到购物车
  let addShopCartObj = {
    count: afterSubNum,
    productSkuId: product.productSkuId,
    saleSpecId: product.productSaleSpecId || product.productSkuId,
    productType: product.productType||1,
    sellingPrice: product.mainPrice,
    sellingPriceUnit: product.priceunit,
    sourceId: product.productSkuId
    }
    App.HttpService.addShopCartList({ datas: [addShopCartObj] })
      .then(data => {
        $yjpToast.show({ text: `加入购物车成功` })
    })
}
/** *******************************************列表加入购物车******************************** */
/**
 * 产品加减框，数量减
 */
function onSubProductBuyNum(e) {
  const productSkuId = e.currentTarget.dataset.productSkuId
  const sourceId = e.currentTarget.dataset.sourceId || productSkuId
  let product ,productIndex=0
  //类目中的商品结构与其他的不一样，这里特殊处理
  if (e.currentTarget.dataset.productFromCategory){
    product = e.currentTarget.dataset.productInfo
    product.productFromCategory =true
    //我的货架中当前屏幕的商品还没有完全加载出来时，不让点，这里通过商品规格控制
    if (!product.specName) {
      return
    }
  }else{
    product = this.data.productList.find(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
    productIndex = this.data.productList.findIndex(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
  }
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
  let price = product.productType == 2 ? product.packagePrice : product.productPrice.price
  let reducePrice = product.productType == 2 ? product.reducePrice : product.productPrice.reducePrice
  let tempPrice = (price - reducePrice) * product.saleSpecQuantity * (product.buyNum - afterSubNum)
  let ratio = (product.productSkuId == product.productSaleSpecId ? 1 : product.saleSpecQuantity) || 1
  //列表优惠卷提示计算时的金额
  let userCouponMoney = this.data.userCouponMoney
  if (product.isUseCoupon && product.saleMode != 2 && product.saleMode != 6){
      userCouponMoney = (this.data.userCouponMoney - tempPrice).toFixed(2)
  }
  //当前酒批商品总额
  let currentProductMoney = this.data.currentProductMoney
  if (product.saleMode != 2 && product.saleMode != 6){
    // let currentMoney = price* product.saleSpecQuantity * (product.buyNum - afterSubNum)
    currentProductMoney = (this.data.currentProductMoney - tempPrice).toFixed(2)
  }
 
  //列表优惠卷提示
  let userCouponPrompt = AddToShopCartUtil.getUserCouponPrompt(currentProductMoney,userCouponMoney)
  //限时惠的起送提示
  let userSendPrompt = AddToShopCartUtil.getUserSendPrompt(currentProductMoney)
  //类目中的商品
  if (e.currentTarget.dataset.productFromCategory) {
    let index=0,pindex =0
    //类目中的商品位置
    for (let [index1, value] of this.data.meRightData.entries()) {
      for (let [pindex1, product] of value.productList.entries()) {
        if (product.productSkuId == productSkuId) {
          index = index1
          pindex = pindex1
        }
      }
    }  
    this.setData({
      [`meRightData[${index}].productList[${pindex}].buyNum`]: afterSubNum,
      addToShopCartNum: this.data.addToShopCartNum - (product.buyNum - afterSubNum) * ratio,
      addToShopCartPrice: (this.data.addToShopCartPrice - tempPrice).toFixed(2),
      userCouponMoney,
      currentProductMoney,
      userCouponPrompt,
      userSendPrompt
    })
  }else{
    this.setData({
      [`productList[` + productIndex + `].buyNum`]: afterSubNum,
      addToShopCartNum: this.data.addToShopCartNum - (product.buyNum - afterSubNum) * ratio,
      addToShopCartPrice: (this.data.addToShopCartPrice - tempPrice).toFixed(2),
      userCouponMoney,
      currentProductMoney,
      userCouponPrompt,
      userSendPrompt
    })
  }
 
  AddToShopCartUtil.updateProductNumToStorage(product, afterSubNum)
}
/**
 * 产品加减框，直接编辑数量
 */
function onInputProductBuyNum(e) {
  const productSkuId = e.currentTarget.dataset.productSkuId
  const sourceId = e.currentTarget.dataset.sourceId || productSkuId
  let product, productIndex = 0
  //类目中的商品结构与其他的不一样，这里特殊处理
  if (e.currentTarget.dataset.productFromCategory) {
    product = e.currentTarget.dataset.productInfo
    product.productFromCategory = true

    //我的货架中当前屏幕的商品还没有完全加载出来时，不让点，这里通过商品规格控制
    if (!product.specName) {
      return
    }
  } else {
    product = this.data.productList.find(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
    productIndex = this.data.productList.findIndex(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
  }
  if (product.enjoyUserLevelDiscount == false) {
    //TODO :我的类目中先不考虑
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
  let price = product.productType == 2 ? product.packagePrice : product.productPrice.price
  let reducePrice = product.productType == 2 ? product.reducePrice : product.productPrice.reducePrice
  let tempPrice = (price - reducePrice) * product.saleSpecQuantity * (product.buyNum - inputNum / ratio)
  const originalBuyNum = product.buyNum
  //拆包情况下输入的不是规格的倍数
  if (product.productSkuId != product.productSaleSpecId && inputNum % ratio != 0) {
     //TODO :我的类目中先不考虑
    $yjpDialog.open({
      dialogType: `defaultText`, title: `温馨提示`,
      dialogData: { text: `此商品只能以${ratio}的倍数购买` },
      hiddenCancel: true, confirmText: `我知道了`
    })
    this.setData({ [`productList[` + productIndex + `].buyNum`]: originalBuyNum })
    return
  }
  //列表优惠卷提示计算时的金额
  let userCouponMoney = this.data.userCouponMoney
  if (product.isUseCoupon && product.saleMode != 2 && product.saleMode != 6) {
    userCouponMoney = (this.data.userCouponMoney - tempPrice).toFixed(2)
  }
  //当前酒批商品总额
  let currentProductMoney = this.data.currentProductMoney
  if (product.saleMode != 2 && product.saleMode != 6) {
    // let currentMoney = price * product.saleSpecQuantity * (product.buyNum - inputNum / ratio)
    currentProductMoney = (this.data.currentProductMoney - tempPrice).toFixed(2)
  }
  //列表优惠卷提示
  let userCouponPrompt = AddToShopCartUtil.getUserCouponPrompt(currentProductMoney,userCouponMoney)
  //限时惠的起送提示
  let userSendPrompt = AddToShopCartUtil.getUserSendPrompt(currentProductMoney)
  //类目中的商品
  if (e.currentTarget.dataset.productFromCategory) {
    let index = 0, pindex = 0
    //类目中的商品位置
    for (let [index1, value] of this.data.meRightData.entries()) {
      for (let [pindex1, product] of value.productList.entries()) {
        if (product.productSkuId == productSkuId) {
          index = index1
          pindex = pindex1
        }
      }
    }
    this.setData({
      [`meRightData[${index}].productList[${pindex}].buyNum`]: inputNum / ratio,
      addToShopCartNum: this.data.addToShopCartNum - (product.buyNum - inputNum / ratio) * ratio,
      addToShopCartPrice: (this.data.addToShopCartPrice - tempPrice).toFixed(2),
      userCouponMoney,
      currentProductMoney,
      userCouponPrompt,
      userSendPrompt
    })
  } else {
    this.setData({
      [`productList[` + productIndex + `].buyNum`]: inputNum / ratio,
      addToShopCartNum: this.data.addToShopCartNum - (product.buyNum - inputNum / ratio) * ratio,
      addToShopCartPrice: (this.data.addToShopCartPrice - tempPrice).toFixed(2),
      userCouponMoney,
      currentProductMoney,
      userCouponPrompt,
      userSendPrompt
    })
  }
 
  AddToShopCartUtil.updateProductNumToStorage(product, inputNum / ratio)
}
/**
 * 产品加减框，数量加
 */
function onAddProductBuyNum(e) {
  const productSkuId = e.currentTarget.dataset.productSkuId
  const sourceId = e.currentTarget.dataset.sourceId || productSkuId
  let product, productIndex = 0
  //类目中的商品结构与其他的不一样，这里特殊处理
  if (e.currentTarget.dataset.productFromCategory) {
    product = e.currentTarget.dataset.productInfo
    product.productFromCategory = true

    //我的货架中当前屏幕的商品还没有完全加载出来时，不让点，这里通过商品规格控制
    if (!product.specName) {
      return
    }
  } else {
    product = this.data.productList.find(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
    productIndex = this.data.productList.findIndex(item => item.productSkuId == productSkuId && item.sourceId == sourceId)
  }
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
  let ratio = (product.productSkuId == product.productSaleSpecId ? 1 : product.saleSpecQuantity) || 1
  let price = product.productType == 2 ? product.packagePrice : product.productPrice.price
  let reducePrice = product.productType == 2 ? product.reducePrice : product.productPrice.reducePrice
  let tempPrice = (price - reducePrice) * product.saleSpecQuantity * (product.buyNum - afterAddNum)
  //列表优惠卷提示计算时的金额
  let userCouponMoney = this.data.userCouponMoney
  if (product.isUseCoupon && product.saleMode != 2 && product.saleMode != 6) {
    userCouponMoney = (this.data.userCouponMoney - tempPrice).toFixed(2)
  }
  //当前酒批商品总额
  let currentProductMoney = this.data.currentProductMoney
  if (product.saleMode != 2 && product.saleMode != 6) {
    // let currentMoney = price * product.saleSpecQuantity * (product.buyNum - afterAddNum)
    currentProductMoney = (this.data.currentProductMoney - tempPrice).toFixed(2)
  }
  //列表优惠卷提示
  let userCouponPrompt = AddToShopCartUtil.getUserCouponPrompt(currentProductMoney,userCouponMoney)
  //限时惠的起送提示
  let userSendPrompt = AddToShopCartUtil.getUserSendPrompt(currentProductMoney)
  //类目中的商品
  if (e.currentTarget.dataset.productFromCategory) {
     let index = 0, pindex = 0
    //类目中的商品位置
    for (let [index1, value] of this.data.meRightData.entries()) {
      for (let [pindex1, product] of value.productList.entries()) {
        if (product.productSkuId == productSkuId) {
          index = index1
          pindex = pindex1
        }
      }
    }
    this.setData({
      [`meRightData[${index}].productList[${pindex}].buyNum`]: afterAddNum,
      addToShopCartNum: this.data.addToShopCartNum + (afterAddNum - product.buyNum) * ratio,
      addToShopCartPrice: (this.data.addToShopCartPrice - tempPrice).toFixed(2),
      userCouponMoney,
      currentProductMoney,
      userCouponPrompt,
      userSendPrompt
    })
  } else {
    this.setData({
      [`productList[` + productIndex + `].buyNum`]: afterAddNum,
      addToShopCartNum: this.data.addToShopCartNum + (afterAddNum - product.buyNum) * ratio,
      addToShopCartPrice: (this.data.addToShopCartPrice - tempPrice).toFixed(2),
      userCouponMoney,
      currentProductMoney,
      userCouponPrompt,
      userSendPrompt
    })
  }
  
  AddToShopCartUtil.updateProductNumToStorage(product, afterAddNum)
}

/**
 * 去购物车
 */
function onGoToShopCart() {
  App.WxService.switchTab(App.Constants.Route.shopCart)
}

/** *******************************************详情加入购物车******************************** */

/**
 * 详情购物车减号
 */
function onDetailSubProductBuyNum(e) {
  let afterNum = (this.data.addShopCartObj.count - 1 < this.data.addShopCartObj.minBuyNum) ? this.data.addShopCartObj.minBuyNum : (this.data.addShopCartObj.count - 1)
  this.setData({ [`addShopCartObj.count`]: afterNum })
}
/**
 * 详情购物车输入中
 */
function onDetailInputingProductBuyNum() {
  this.setData({ inputing: true })
}
/**
 * 详情购物车输入数量
 */
function onDetailInputProductBuyNum(e) {
  let ratio = (this.data.addShopCartObj.productSkuId == this.data.addShopCartObj.productSaleSpecId ? 1 : this.data.addShopCartObj.saleSpecQuantity) || 1
  const originalBuyNum = this.data.addShopCartObj.count
  let inputNum = parseInt(e.detail.value) || this.data.addShopCartObj.minBuyNum * ratio
  inputNum = inputNum < this.data.addShopCartObj.minBuyNum * ratio ? this.data.addShopCartObj.minBuyNum * ratio : inputNum > this.data.addShopCartObj.maxBuyNum * ratio ? this.data.addShopCartObj.maxBuyNum * ratio : inputNum
  //拆包情况下输入的不是规格的倍数
  if (this.data.addShopCartObj.productSkuId != this.data.addShopCartObj.productSaleSpecId && inputNum % ratio != 0) {
    $yjpDialog.open({
      dialogType: `defaultText`, title: `温馨提示`,
      dialogData: { text: `此商品只能以${ratio}的倍数购买` },
      hiddenCancel: true, confirmText: `我知道了`
    })
    this.setData({ [`addShopCartObj.count`]: originalBuyNum })
    return
  }
  this.setData({ [`addShopCartObj.count`]: inputNum / ratio, inputing: false })
}
/**
 * 详情购物车加号
 */
function onDetailAddProductBuyNum(e) {
  let afterNum = (this.data.addShopCartObj.count + 1 > this.data.addShopCartObj.maxBuyNum) ? this.data.addShopCartObj.maxBuyNum : (this.data.addShopCartObj.count + 1)
  this.setData({ [`addShopCartObj.count`]: afterNum })
}
function addToShopCart() {
  //输入中点击按钮会不走输入完毕校验的逻辑，所以用inputing控制
  if (this.data.inputing) return
  if (this.data.productDetail) {
    let productDetail = this.data.productDetail
    if (productDetail.canSellStoreCount < (productDetail.minPurchaseNum || 0) && productDetail.saleMode != 2 && productDetail.saleMode != 6) {
      return $yjpToast.show({ text: `该产品库存不足` })
    }

    if (this.data && this.data.promotionType > 0) {
      let subType = transToSubType(this.data.promotionType)
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '加入购物车', eventType: 701, actionId: productDetail.productSkuId, subType: subType, actionFromType: subType, actionFromId: this.data.activityId})
    } else {
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '加入购物车', eventType: 701, actionId: productDetail.productSkuId })
    }

  } else if (this.data.activityDetail) {
    let activityDetail = this.data.activityDetail
    if (activityDetail.stockCount < (activityDetail.minDeliverCount || 0)) {
      return $yjpToast.show({ text: `该产品库存不足` })
    }
    let subType = transToSubType(activityDetail.promotionType)
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '加入购物车', eventType: 701, actionId: activityDetail.activityId, subType: subType, actionFromType: subType, actionFromId: activityDetail.activityId })
  }
  App.HttpService.addShopCartList({ datas: [this.data.addShopCartObj] })
    .then(data => {
      this.setData({ hasAddToShopCartNum: this.data.addShopCartObj.count + (this.data.hasAddToShopCartNum || 0) })
      $yjpToast.show({ text: `加入购物车成功` })
    })
}
function transToSubType(promotionType) {
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
}

function goToOrderSubmit() {
  //输入中点击按钮会不走输入完毕校验的逻辑，所以用inputing控制
  if (this.data.inputing) return
  let { userState, auditRejectionReason } = this.data
  if (userState == 3) {
    $yjpDialog.open({
      dialogType: `defaultText`, title: `温馨提示`,
      hiddenCancel: true, confirmText: `我知道了`,
      dialogData: { text: `您的账号未通过审核,审核通过后可下单，审核不通过原因:${auditRejectionReason}` }
    })
    return
  }
  if (this.data.productDetail) {

    let productDetail = this.data.productDetail
    if (productDetail.canSellStoreCount < (productDetail.minPurchaseNum || 0) && productDetail.saleMode != 2 && productDetail.saleMode != 6) {
      return $yjpToast.show({ text: `该产品库存不足` })
    }
    if (this.data && this.data.promotionType > 0) {
      let subType = transToSubType(this.data.promotionType)
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '购买分析-立即购买点击时（活动商品）', eventType: 502, actionId: this.data.activityId, subType: subType })
    } else {
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '购买分析-立即购买点击时（非活动商品）', eventType: 501, actionId: this.data.productDetail && this.data.productDetail.productSkuId })
    }
  } else if (this.data.activityDetail) {
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '购买分析-立即购买点击时（活动商品）', eventType: 502, actionId: this.data.activityDetail.activityId, subType: this.data.promotionType})
    let activityDetail = this.data.activityDetail
    if (activityDetail.stockCount < (activityDetail.minDeliverCount || 0)) {
      return $yjpToast.show({ text: `该产品库存不足` })
    }
  }
  let detail = {}
  if (this.data.productDetail) {
    detail = this.data.productDetail
  } else if (this.data.activityDetail) {
    detail = this.data.activityDetail
    detail.productSaleSpecId = detail.productSkuId = detail.productSpecId = detail.activityId
    detail.saleSpecQuantity = 1
    detail.productPrice = {
      gatherOrderPrice: 0,
      price: detail.packagePrice,
      reducePrice: detail.reducePrice,
      sellPrice: detail.regularPrice,
      selfPickUpPrice: 0,
      selfPickUpReduceAmount: 0,
    }
  }
  detail.buyCount = detail.buyNum = this.data.addShopCartObj.count
  //订单限制起送金额
  if (detail.productPrice.price * detail.buyCount * detail.saleSpecQuantity < this.data.minBuyAmount && detail.saleMode != 2 && detail.saleMode != 6 && detail.saleMode != 8) {
    return $yjpToast.show({ text: `订单满${this.data.minBuyAmount}元起送,还差${(this.data.minBuyAmount - detail.productPrice.price * detail.buyCount * detail.saleSpecQuantity).toFixed(2)}元` })
  }
  let list = [detail]
  let decodelist = encodeURIComponent(JSON.stringify(list))
  /**
   * 独家包销产品购买(来源普通产品列表进入详情，仅限被当前用户包销的产品)，订单预查询sourceType = 16
   * 独家包销产品购买(来源包销产品列表进入详情)，订单预查询sourceType = 16
   **/
  if ((this.data.productDetail && this.data.productDetail.saleMode == 8 && this.data.productDetail.underwritingInfo.alreadyUnderwriting && this.data.productDetail.underwritingInfo.underwritingState == 2) || this.data.isUnderwriting){
    App.WxService.navigateTo(App.Constants.Route.orderSubmit, { productList: decodelist, needdecodeURI: true, isUnderwrite: true })
  }else{
    App.WxService.navigateTo(App.Constants.Route.orderSubmit, { productList: decodelist, needdecodeURI: true })
  }
  
}

/** *******************************************独家包销产品加入购物车******************************** */
/**
 * 产品加减框，数量减
 */
function onSubUnderwriteBuyNum(e) {
  const product = e.currentTarget.dataset.product
  const idx = e.currentTarget.dataset.idx
  let afterSubNum = (product.buyNum - 1) < product.minBuyNum ? 0 :
    (product.buyNum - 1) > product.maxBuyNum ? product.maxBuyNum :
      (product.buyNum - 1)
  let ratio = 1
  //由于拆包商品的个数不是商品购买个数，这里要转换
  let saleSpecQuantity = 1;
  if (product.saleSpecQuantity == product.specQuantity && product.saleSpecQuantity) {
      saleSpecQuantity = product.saleSpecQuantity;
  }       
  let price = product.price * (product.buyNum - afterSubNum) * saleSpecQuantity
  this.setData({
    [`contractUnderwriteList[` + idx + `].buyNum`]: afterSubNum,
    addToShopCartNum: this.data.addToShopCartNum - (product.buyNum - afterSubNum) * ratio,
    addToShopCartPrice: (this.data.addToShopCartPrice - price).toFixed(2)
  })
  AddToShopCartUtil.updateProductNumToStorage(product, afterSubNum, 'underwrite')
}
/**
 * 产品加减框，直接编辑数量
 */
function onInputUnderwriteBuyNum(e) {
  const product = e.currentTarget.dataset.product
  const idx = e.currentTarget.dataset.idx
  const originalBuyNum = product.buyNum
  let ratio = 1
  let inputNum = parseInt(e.detail.value) == 0 ? 0 : parseInt(e.detail.value) ? parseInt(e.detail.value) : product.minBuyNum * ratio
  inputNum = inputNum < product.minBuyNum * ratio ? product.minBuyNum * ratio : inputNum > product.maxBuyNum * ratio ? product.maxBuyNum * ratio : inputNum
  //由于拆包商品的个数不是商品购买个数，这里要转换
  let saleSpecQuantity = 1;
  if (product.saleSpecQuantity == product.specQuantity && product.saleSpecQuantity) {
    saleSpecQuantity = product.saleSpecQuantity;
  } 
  let price = product.price * (product.buyNum - inputNum / ratio) * saleSpecQuantity
  this.setData({
    [`contractUnderwriteList[` + idx + `].buyNum`]: inputNum / ratio,
    addToShopCartNum: this.data.addToShopCartNum - (product.buyNum - inputNum / ratio) * ratio,
    addToShopCartPrice: (this.data.addToShopCartPrice - price).toFixed(2)
  })
  AddToShopCartUtil.updateProductNumToStorage(product, inputNum / ratio, 'underwrite')
}
/**
 * 产品加减框，数量加
 */
function onAddUnderwriteBuyNum(e) {
  const product = e.currentTarget.dataset.product
  const idx = e.currentTarget.dataset.idx
  const list = e.currentTarget.dataset.list
  this.data.list = list
  let afterAddNum = (product.buyNum + 1) > product.maxBuyNum ? product.maxBuyNum :
    (product.buyNum + 1) < product.minBuyNum ? product.minBuyNum :
      (product.buyNum + 1)
  let ratio = 1
  //由于拆包商品的个数不是商品购买个数，这里要转换
  let saleSpecQuantity = 1;
  if (product.saleSpecQuantity == product.specQuantity && product.saleSpecQuantity) {
    saleSpecQuantity = product.saleSpecQuantity;
  }  
  let price = product.price * (product.buyNum - afterAddNum) * saleSpecQuantity
  this.setData({
    [`contractUnderwriteList[` + idx + `].buyNum`]: afterAddNum,
    addToShopCartNum: this.data.addToShopCartNum + (afterAddNum - product.buyNum) * ratio,
    addToShopCartPrice: (this.data.addToShopCartPrice - price).toFixed(2)
  })
  AddToShopCartUtil.updateProductNumToStorage(product, afterAddNum, 'underwrite')
}

module.exports = {
  onSubProductBuyNum, onAddProductBuyNum, onInputProductBuyNum, onGoToShopCart,recommendGoodAddToCart,
  onDetailSubProductBuyNum, onDetailAddProductBuyNum, onDetailInputProductBuyNum, onDetailInputingProductBuyNum, addToShopCart, goToOrderSubmit,
  onSubUnderwriteBuyNum, onInputUnderwriteBuyNum, onAddUnderwriteBuyNum
}