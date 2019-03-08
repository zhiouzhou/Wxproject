/**
 * 改造产品数据，添加字段的工具类
 */

import AddToShopCartUtil from './AddToShopCartUtil.js'
import DateUtil from './DateUtil.js'


const unlockSelfPickup = getApp().globalData.unlockSelfPickup

const productDisplay = {
  "displayAccumulation": false,
  "displayUnAccumulation": false,
  "displayAvailableBonus": true,
  "displayUnAvailableBonus": true,
  "displayUseCoupon": true,
  "displayNotUseCoupon": true,
  "displayAccumulationInfo": "参与累计",
  "unDisplayAccumulationInfo": "不参与累计",
  "displayAvailableBonusInfo": "可用红包",
  "unDisplayAvailableBonus": "不可用红包",
  "displayUseCouponInfo": "可用优惠券",

  "unDisplayUseCouponInfo": "不可用券"
};

/**
 * 重新构建产品模型(数组)
 */
function rebuildProducts(products, source, activityId = ``, isLargeCargo = false) {
  let newProductList = products.map(item => rebuildProduct(item, source, activityId, isLargeCargo))
  return newProductList
}
/**
 * 重新构建产品模型
 */
function rebuildProduct(product, source, activityId = ``, isLargeCargo = false) {
  // common 
  product = getCitySelfPickUp(product)
  product = getProductName(product)
  product = getProductionDate(product)
  product = getDisplayTagText(product)
  switch (source) {
    case `activityDetail`:
      product = rebuildActivityDetailProduct(product, activityId)
      break;
    case `compositeActivityList`:
      product = rebuildCompositeAtyProduct(product)
      break;
    case `compositeProductDetail`:
      product = rebuildCompositeProductDetail(product)
      break;
    case `productDetail`:
      product = rebuildProductDetail(product, activityId, isLargeCargo)
      break;
    case `productList`:
      product = rebuildProductList(product, activityId, isLargeCargo)
      break;
    case `exchange`:
      product = rebuildSwapProductList(product, activityId, isLargeCargo)
      break;
    case `shopCart`:
      product = rebuildShopCartList(product, activityId, isLargeCargo)
      break;
    case `underwrite`:
      product = rebuildUnderwriteList(product)
      break;
    case `dealerShop`:
      product = rebuildDealerShopList(product, activityId, isLargeCargo)
      break;
    default:
      break;
  }
  return product
}

//城市是否开启自提
function getCitySelfPickUp(product) {
  // product.citySelfPickUp = wx.getStorageSync(`appSetting`).unlockSelfPickup
  product.citySelfPickUp = unlockSelfPickup;
  return product
}
//产品促销提示
function getDisplayTagText(product) {
  // const productDisplay = wx.getStorageSync(`appSetting`) && wx.getStorageSync(`appSetting`).productDisplay
  product.accumulationText = false && product.isAccumulated && productDisplay.displayAccumulationInfo ? productDisplay.displayAccumulationInfo : ``
  product.unAccumulationText = false && !product.isAccumulated && productDisplay.unDisplayAccumulationInfo ? productDisplay.unDisplayAccumulationInfo : ``
  product.bonusText = true && product.isUseBonus && productDisplay.displayAvailableBonusInfo ? productDisplay.displayAvailableBonusInfo : ``
  product.unBonusText = true && !product.isUseBonus && productDisplay.unDisplayAvailableBonus ? productDisplay.unDisplayAvailableBonus : ``
  product.couponText = true && product.isUseCoupon && productDisplay.displayUseCouponInfo ? productDisplay.displayUseCouponInfo : ``
  product.unCouponText = true && !product.isUseCoupon && productDisplay.unDisplayUseCouponInfo ? productDisplay.unDisplayUseCouponInfo : ``
  return product
}
//产品名称
function getProductName(product) {
  if (product.saleMode == 8) {
    product.productName = product.productName
  } else {
    product.productName = product.saleMode == 2 && product.productName.indexOf(`【合作】`) == -1 ? `【合作】${product.productName}` : product.saleMode == 6 && product.productName.indexOf(`【经销商】`) == -1 ? `【经销商】${product.productName}` : product.stockState == 4 && product.productName.indexOf(`【预售】`) == -1 ? `【预售】${product.productName}` : product.productName
  }
  return product
}
//生产日期
function getProductionDate(product) {
  product.productionDate = DateUtil.getDateStr(product.productionDate)
  return product
}
//产品主要价格展示
function getMainPrice(product, price = -1) {
  product.mainPrice = price != -1 ? price :
    product.productPrice.priceDisplayType == 0 ? product.productPrice.price :
      product.productPrice.priceDisplayType == 1 ? product.productPrice.price :
        product.productPrice.priceDisplayType == 2 ? product.productPrice.gatherOrderPrice : ``
  return product
}
//获取会员价
function getLevelPrice(product) {
  const userLevelId = wx.getStorageSync(`userSetting`).userLevelId
  if (!product.userLevelPrices || !product.userLevelPrices.length) {
    product.levelPrice = ``
  } else {
    let userLevel = product.userLevelPrices.find(item => item.userLevelId == userLevelId)
    product.levelPrice = userLevel ? userLevel.userLevelPrice : ``
  }
  product.userLevelId = userLevelId
  return product
}
//处理产品标签
function processTags(product) {
  if (product.productTags && product.productTags.length) {
    for (let tag of product.productTags) {
      //限购
      if (tag.tagType == 1) {
        product.limitBuyTag = tag
        product.limitBuyCount = parseInt(tag.value)
      }
      //产品底部展示标签(数组)
      if (tag.tagType == 1 || tag.tagType == 2 || tag.tagType == 3 || tag.tagType == 4 || tag.tagType == 7 || tag.tagType == 97 || tag.tagType == 99) {
        if (product.showTags instanceof Array) { product.showTags.push(tag) } else { product.showTags = [tag] }
        if (tag.tagType == 99) { product.selfPickUpReduceTag = tag; product.selfPickUpReduce = parseInt(tag.value); }
      }
      //会员等级标签
      if (tag.tagType == 97) {
        product.levelNotice = tag.tagDetail
      }
      //商品详情，促销活动数组
      if (tag.tagType == 2 || tag.tagType == 3 || tag.tagType == 4 || tag.tagType == 5 || tag.tagType == 7 || tag.tagType == 8 || tag.tagType == 11 || tag.tagType == 18) {
        if (product.promotionTags instanceof Array) { product.promotionTags.push(tag) } else { product.promotionTags = [tag] }
      }
      //全场满减标签
      if (tag.tagType == 18) {
        product.globalReduceTag = tag
        product.globalReduceWatermark = wx.getStorageSync(`settingValue`).ProductDetailFullReduceWatermark
      }
      //优惠通知，特别提示 商品详情展示需要
      if (tag.tagType == 98) {
        product.specialNoticeTag = tag
      }
      //送红包  产品列表展示小图标需要
      if (tag.tagType == 2) {
        product.giftBonus = true
      }
      //产品满赠 产品列表展示小图标需要
      if (tag.tagType == 7 || tag.tagType == 11) {
        product.giftPresent = true
      }
      //经销商产品，店铺优惠券
      if (tag.tagType == 17) {
        product.shopCouponTag = tag
      }
    }
  }
  return product
}
//产品政策
function getProductDetailPolicy(product) {

  product.promotionTags = product.productTags
  if (product.policyList && product.policyList.length) {

    let tag = {}
    for (let i = 0; i < product.policyList.length; i++) {
      tag.tagName = `政策${i + 1}`
      tag.tagDetail = product.policyList[i]
      if (!product.promotionTags) {
        product.promotionTags = [];
      }
      product.promotionTags.push({
        tagName: tag.tagName,
        tagDetail: tag.tagDetail
      })
    }
  }
  return product
}
//产品信息
function getProductInfo(product) {
  if (product.productInfo && product.productInfo.length) {
    for (let item of product.productInfo) {
      for (let key in item) {
        if (product.productInfoArray instanceof Array) { product.productInfoArray.push({ key: key, value: item[key] }) } else { product.productInfoArray = [{ key: key, value: item[key] }] }
      }
    }
  }
  return product
}
//包装规格价格（整件，方便计算）
function getSpecPackagePrice(product, price = -1) {
  product.specPackagePrice = price != -1 ? price : product.mainPrice * product.saleSpecQuantity
  return product
}
//产品来源ID,组合,限时惠为活动ID,其他为SKUID
function getSourceId(product, activityId = ``) {
  product.sourceId =
    product.enjoyPromotions && product.enjoyPromotions.length &&
      (product.enjoyPromotions[0].promotionType == 4 || product.enjoyPromotions[0].promotionType == 5) ?
      activityId : product.productSkuId
  return product
}
//产品库存状态提示
function getStockText(product) {
  product.stockText =
    product.stockState == 2 ? `仅剩${product.storeCount}${product.storeUnit}` :
      product.stockState == 3 ? `已抢光` :
        product.stockState == 4 ? `预售${product.presaleStoreCount}${product.storeUnit}` : ``
  //独家包销产品通过storeCount判断库存
  if (product.saleMode == 8 && product.storeCount == 0){
    product.stockText = `已抢光`
  }
  return product
}
//商品详情产品库存状态提示
function getGoodsDetailStockText(product) {
  if (product.stockState == 2) {
    if (product.presaleStoreCount > 0 && product.isPresale) {
      //独家包销产品（从普通列表进入product.isUnderwriting为false，不显示预售库存）
      if (product.saleMode == 8 && !product.isUnderwriting){
        product.stockText = `${product.storeCount}${product.storeUnit}`
      }else{
        product.stockText = `${product.storeCount}${product.storeUnit}+预售${product.presaleStoreCount}${product.storeUnit}`
      }
    } else {
      product.stockText = `${product.storeCount}${product.storeUnit}`
    }
  } else if (product.stockState == 3) {
    product.stockText = `已抢光`
  } else if (product.stockState == 4) {
    product.stockText = `预售${product.presaleStoreCount}${product.storeUnit}`
  } else {
    product.stockText = ``
  }
  return product
}
//组合产品库存状态提示
function getComProductStockText(product) {
  product.stockText =
    product.stockState == 2 ? `仅剩${product.stockCount}${product.priceUnit}` :
      product.stockState == 3 ? `已抢光` :
        product.stockState == 4 ? `预售${product.stockCount}${product.priceUnit}` : ``
  return product
}
//productType:普通商品(1),组合商品(2),大宗商品(3),限时惠商品(4);
function getProductType(product, isLargeCargo = false) {
  product.productType = isLargeCargo ? 3 :
    product.enjoyPromotions && product.enjoyPromotions.length && product.enjoyPromotions[0].promotionType == 4 ? 4 :
      product.enjoyPromotions && product.enjoyPromotions.length && product.enjoyPromotions[0].promotionType == 5 ? 2 : 1
  return product
}
//产品购买数量,起购限购
function getBuyNum(product) {
  product.buyNum = AddToShopCartUtil.getSingleProductBuyNumFromStorage(product)
  return product
}
//起购
function getMinBuyNum(product) {
  if (product.minDeliverCount || product.minPurchaseNum) {
    product.hasMinBuy = true
  }
  product.minBuyNum = product.minDeliverCount || product.minPurchaseNum || 1
  return product
}
//限购
function getMaxBuyNum(product) {
  if (product.saleMode == 2) {
    //合作商不考虑限购
    product.maxBuyNum = 99999
  } else {
    //先取字段值，取不到则设置为默认值99999不影响计算限购
    let limitPurchaseNum = formatValue(product.limitPurchaseNum)
    let limitBuyCount = formatValue(product.limitBuyCount)
    let canSellStoreCount = formatValue(product.canSellStoreCount)
    let stockCount = formatValue(product.stockCount)
    let storeCount = formatValue(product.storeCount)
    //这几个有值且为0，则限购直接为0
    if (limitPurchaseNum == 0 || limitBuyCount == 0 || canSellStoreCount == 0) {
      product.maxBuyNum = 0
    } else {
      //有些地方没有canSellStoreCount或者stockCount这个字段,默认取了99999,不影响计算
      let stock = canSellStoreCount != 99999 ? canSellStoreCount :
        stockCount != 99999 ? stockCount :
          storeCount
      //考虑三个值，limitPurchaseNum是限购字段，limitBuyCount是productTags中的限购，stock是库存
      product.maxBuyNum = Math.min(limitPurchaseNum, limitBuyCount, stock)
    }
  }
  return product
}
//判断是否有值,有则返回该值,无则返回默认值（计算限购使用）
function formatValue(value) {
  if (value == undefined || value == null || value == ``) {
    return 99999
  } else {
    return parseInt(value)
  }
}
//活动状态
function getActivityTimeNotice(product, beginDate, endDate) {
  //组合活动产品列表，倒计时三天内才显示活动提示
  if (product.productSkuList && product.showCountdownTime === false){
    product.timeNotice = DateUtil.getActivityTimeNotice(beginDate, endDate, `timeNoticeNone`)
  }else{
    product.timeNotice = DateUtil.getActivityTimeNotice(beginDate, endDate)
  }
  return product
}

/**
 * 活动详情产品
 */
function rebuildActivityDetailProduct(product, activityId = ``) {
  product = getMainPrice(product)
  product = getSpecPackagePrice(product)
  product = getSourceId(product, activityId)
  product = getStockText(product)
  product = processTags(product)
  product = getProductType(product)
  product = getBuyNum(product)
  product = getMinBuyNum(product)
  product = getMaxBuyNum(product)
  return product
}
/**
 * 组合商品列表
 */
function rebuildCompositeAtyProduct(product) {
  product.sourceId = product.productSkuId = product.productSaleSpecId = product.activityId
  product.saleSpecQuantity = 1
  product.priceunit = product.priceUnit
  product.isAccumulated = product.isJoinCouponExciting
  product = getMainPrice(product, product.packagePrice)
  product = getSpecPackagePrice(product, product.packagePrice)
  product = getComProductStockText(product)
  product = processTags(product)
  product = getProductType(product)
  product = getBuyNum(product)
  product = getMinBuyNum(product)
  product = getMaxBuyNum(product)
  product = getActivityTimeNotice(product, product.beginDate, product.endDate)
  return product
}
/**
 * 组合商品详情
 */
function rebuildCompositeProductDetail(product) {
  product = rebuildCompositeAtyProduct(product)
  //详情的购买数量不从缓存取
  const levelTag = product.productTags && product.productTags.find(item => item.tagType === 97)
  //组合活动详情促销活动只展示下面的标签
  product.showTags = product.productTags && product.productTags.filter(item => item.tagType == 2 || item.tagType == 4 || item.tagType == 5 || item.tagType == 10)
  product.levelNotice = levelTag ? levelTag.tagDetail : ``
  product.buyNum = product.minBuyNum
  if (product.enjoyPromotions==null || product.enjoyPromotions.length==0){
    product.enjoyPromotions =[];
    product.enjoyPromotions[0] = { promotionType:5}
  }
  return product
}
/**
 * 商品详情
 */
function rebuildProductDetail(product, activityId = ``, isLargeCargo = false) {
  product = getMainPrice(product)
  product = getSpecPackagePrice(product)
  product = getSourceId(product, activityId)
  product = getGoodsDetailStockText(product)
  product = processTags(product)
  product = getProductDetailPolicy(product)
  product = getProductInfo(product)
  product = getProductType(product, isLargeCargo)
  product = getMinBuyNum(product)
  product = getMaxBuyNum(product)
  //详情的购买数量不从缓存取
  product.buyNum = product.minBuyNum
  //独家包销产品
  if (product.saleMode == 8) {
    product = underwriteWatermark(product)
  }
  return product
}
/**
 * 商品列表
 */
function rebuildProductList(product, activityId = ``, isLargeCargo = false) {
  if (product.saleMode == 8) {
    //product = getUnderWriteMode(product)
    product = underwriteWatermark(product)
  }
  product = getMainPrice(product)
  product = getLevelPrice(product)
  product = getSpecPackagePrice(product)
  product = getSourceId(product, activityId)
  product = getStockText(product)
  product = processTags(product)
  product = getProductType(product, isLargeCargo)
  product = getBuyNum(product)
  product = getMinBuyNum(product)
  product = getMaxBuyNum(product)
  return product
}
/**
 * 退换货列表
 */
function rebuildSwapProductList(product, activityId = ``, isLargeCargo = false) {
  product = getMainPrice(product)
  product = getLevelPrice(product)
  product = getSpecPackagePrice(product)
  product = getSourceId(product, activityId)
  product = getStockText(product)
  product = processTags(product)
  product = getProductType(product, isLargeCargo)
  product = getMinBuyNum(product)
  product = getMaxBuyNum(product)
  //详情的购买数量不从缓存取
  product.buyNum = 0
  return product
}
/**
 * 购物车
 */
function rebuildShopCartList(product) {
  product = getStockText(product)
  product = processTags(product)
  product = getMinBuyNum(product)
  product = getMaxBuyNum(product)
  //购物车中限时惠产品未开始的话，需要时间提示
  product = getActivityTimeNotice(product, product.beginDate, product.endDate)
  return product
}

/**
 * 包销产品列表
 * 
 */
function rebuildUnderwriteList(product) {
  product = getBuyNum(product)
  product = underwriteWatermark(product)
  return product
}
/*
 * 经销商店铺
 */
function rebuildDealerShopList(product, activityId = ``, isLargeCargo = false) {
  product = getMainPrice(product)
  product = getSourceId(product, activityId)
  product = getStockText(product)
  product = processTags(product)
  product = getProductType(product, isLargeCargo)
  product = getBuyNum(product)
  product = getMinBuyNum(product)
  product = getMaxBuyNum(product)
  return product
}
/*
 * 独家包销产品
 */
function getUnderWriteMode(product) {
  let underwriteCanBuy = false
  if ((product.underwritingInfo.alreadyUnderwriting && (product.underwritingInfo.underwritingState == 2 || product.underwritingInfo.underwritingState == 1)) || (!product.underwritingInfo.alreadyUnderwriting && product.underwritingInfo.underwritingState == 1)) {
    underwriteCanBuy = true
  } else {
    underwriteCanBuy = false
  }
  const underwriteObj = {
    productImgUrl: product.imgUrl,
    productName: product.productName,
    productSkuId: product.productSkuId,
    productSpecName: product.specName,
    underwritingDesc: `全年包销数量${product.underwritingInfo.minimumYearly}${product.saleUnit}起`,
    price: product.productPrice.minPrice,
    maxPrice: product.productPrice.maxPrice,
    priceUnit: product.priceunit,
    underwriteCanBuy: underwriteCanBuy
  }
  Object.assign(product.underwritingInfo, underwriteObj)
  return product
}
/*
 * 独家包销产品水印
 */
function underwriteWatermark(product) {
  product.productUnderwritingWatermark = wx.getStorageSync(`settingValue`).ProductUnderwritingWatermark
  return product
}

module.exports = {
  rebuildProduct, rebuildProducts
}