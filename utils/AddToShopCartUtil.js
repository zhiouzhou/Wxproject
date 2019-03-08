const App = getApp()
import  FunctionUtils  from '/functionUtils.js'

/**
 * 更新加入购物车数据
 *  productType: 普通商品(1),组合商品(2),大宗商品(3),限时惠商品(4);
 */
function updateProductNumToStorage(product, buyNum, underwrite) {
  if (buyNum > 0) addProductToStorage(product, buyNum, underwrite)
  else removeProductFromStorage(product, underwrite)
}
//当前列表是否包含商品
function includeProduct(productList, product){
  let sku = productList.find(item => {
    return product.productSkuId == item.productSkuId
  })
  return !!sku
}
//获取加入购物车的商品来源（subType=1:打折促销活动，subType=2限时惠活动，subType=3组合活动,subType=4凑单活动,subType=5拼团活动,subType=6为你推荐推荐产品,subType=7类目中的"我的货架"的商品编辑商品数量）
function getSubType(product){
  let promotionType = product.enjoyPromotions && product.enjoyPromotions[0]&&product.enjoyPromotions[0].promotionType||0
  let subType = 0
  if (promotionType == 3) {
    subType = 1
  }
  if (promotionType == 4) {
    subType = 2
  }
  if (promotionType == 5 || product.productType==2) {
    subType = 3
  }
  if (promotionType == 6) {
    subType = 4
  }
  if (promotionType == 8) {
    subType = 5
  }
  if (product.productFromCategory){
    subType = 7
  }
  return subType
}
//如果当前商品不在缓存购物车中，添加埋点数据,加入购物车
function addToCarTalkingData(storageObj,product){
  let addArr = []
  if (storageObj) {
    for (let key in storageObj) {
      for (let item of storageObj[key]) {
        addArr.push(item)
      }
    }
  }
  //当前商品不在缓存购物车中
  if (!includeProduct(addArr, product)) {
    //获取埋点加入购物车数据来源
    let subType = getSubType(product)
    let actionFromType =""
    //如果来源活动要加actionFromType，actionFromId
    if (subType in [1,2,3,4,5]){
      actionFromType = subType
    }
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '加入购物车', eventType: 701, actionFromType: actionFromType, actionId: product.productSkuId, subType: subType })
  }
}
/**
 * 修改加入购物车数据的数量
 */
function addProductToStorage(product, buyNum, underwrite) {
  let ProductStorage = wx.getStorageSync(`ProductStorage`) || {}
  //添加埋点数据
  addToCarTalkingData(ProductStorage, product)
  let addCartItem = {}
  //独家包销产品，productType为1，saleSpecId为skuid，sourceId为skuid
  if (underwrite == 'underwrite'){
    addCartItem = {
      count: buyNum,
      productSkuId: product.productSkuId,
      productType: 1,
      saleSpecId: product.productSkuId,
      sellingPrice: product.price,
      sellingPriceUnit: product.priceUnit,
      priceunit: product.priceUnit,
      saleSpecQuantity: 1,
      sourceId: product.productSkuId,
      productSaleSpecId: product.productSkuId,
      saleSpecQuantity: product.saleSpecQuantity,
      specQuantity: product.specQuantity,
      specName: product.productSpecName,
      imgUrl: product.productImgUrl,
      productName: product.productName,
      productPrice: {
        gatherOrderPrice: 0,
        price: product.price,
        reducePrice: product.reducePrice || 0,
        sellPrice: product.regularPrice || 0,
        selfPickUpPrice: 0,
        selfPickUpReduceAmount: 0,
      }       
    }
  }else{
    addCartItem = {
      count: buyNum,
      productSkuId: product.productSkuId,
      productType: product.productType,
      isUseCoupon: product.isUseCoupon,
      saleSpecId: product.productSaleSpecId,
      price: product.productPrice && product.productPrice.price || product.price,
      sellingPrice: product.mainPrice,
      sellingPriceUnit: product.priceunit,
      saleSpecQuantity: product.saleSpecQuantity,
      //来源ID,组合,限时惠为活动ID,其他为SKUID
      sourceId: product.sourceId,
      productPrice: {
        gatherOrderPrice: 0,
        price: product.price,
        reducePrice: product.productPrice && product.productPrice.reducePrice || product.reducePrice|| 0,
        sellPrice: product.regularPrice || 0,
        selfPickUpPrice: 0,
        selfPickUpReduceAmount: 0,
      }    
    }    
  }
  // 如果是经销商商品
  if (product.saleMode == 6) {
    //分为值为空或者空数组
    if (!ProductStorage[product.companyId] || !ProductStorage[product.companyId].length) {
      ProductStorage[product.companyId] = [addCartItem]
    } else {
      let hasExitProductIndex = ProductStorage[product.companyId].findIndex(item => item.productSkuId === product.productSkuId && item.sourceId === product.sourceId)
      if (hasExitProductIndex != -1) {
        ProductStorage[product.companyId][hasExitProductIndex].count = addCartItem.count
      } else {
        ProductStorage[product.companyId].push(addCartItem)
      }
    }
  } else if (product.productType == 1 || product.productType == 2) {//酒批普通商品(包括组合商品,合作商)
    if (!ProductStorage[`jiuPi`] || !ProductStorage[`jiuPi`].length) {
      ProductStorage[`jiuPi`] = [addCartItem]
    } else {
      let hasExitProductIndex = ProductStorage[`jiuPi`].findIndex(item => item.productSkuId === product.productSkuId && item.sourceId === product.sourceId)
      if (hasExitProductIndex != -1) {
        ProductStorage[`jiuPi`][hasExitProductIndex].count = addCartItem.count
      } else {
        ProductStorage[`jiuPi`].push(addCartItem)
      }
    }
  } else if (product.productType == 3) {//大宗商品
    if (!ProductStorage[`largeCargo`] || !ProductStorage[`largeCargo`].length) {
      ProductStorage[`largeCargo`] = [addCartItem]
    } else {
      let hasExitProductIndex = ProductStorage[`largeCargo`].findIndex(item => item.productSkuId === product.productSkuId && item.sourceId === product.sourceId)
      if (hasExitProductIndex != -1) {
        ProductStorage[`largeCargo`][hasExitProductIndex].count = addCartItem.count
      } else {
        ProductStorage[`largeCargo`].push(addCartItem)
      }
    }
  } else if (underwrite == 'underwrite'){//独家包销
    if (!ProductStorage[`underwrite`] || !ProductStorage[`underwrite`].length) {
      ProductStorage[`underwrite`] = [addCartItem]
    } else {
      let hasExitProductIndex = ProductStorage[`underwrite`].findIndex(item => item.productSkuId === product.productSkuId)
      if (hasExitProductIndex != -1) {
        ProductStorage[`underwrite`][hasExitProductIndex].count = addCartItem.count
      } else {
        ProductStorage[`underwrite`].push(addCartItem)
      }
    }
  } else {//限时惠商品
    if (!ProductStorage[`timeLimit`] || !ProductStorage[`timeLimit`].length) {
      ProductStorage[`timeLimit`] = [addCartItem]
    } else {
      let hasExitProductIndex = ProductStorage[`timeLimit`].findIndex(item => item.productSkuId === product.productSkuId && item.sourceId === product.sourceId)
      if (hasExitProductIndex != -1) {
        ProductStorage[`timeLimit`][hasExitProductIndex].count = addCartItem.count
      } else {
        ProductStorage[`timeLimit`].push(addCartItem)
      }
    }
  }
  wx.setStorageSync(`ProductStorage`, ProductStorage)
  
}
/**
 * 移除加入购物车数据
 */
function removeProductFromStorage(product) {
  let ProductStorage = wx.getStorageSync(`ProductStorage`) || {}
  for (let key in ProductStorage) {
    let targetProductIndex = ProductStorage[key].findIndex(item => item.productSkuId === product.productSkuId && item.sourceId === product.sourceId)
    if (targetProductIndex != -1) {
      ProductStorage[key].splice(targetProductIndex, 1)
      break
    }
  }
  wx.setStorageSync(`ProductStorage`, ProductStorage)
}
/**
 * 获取单个商品的加入购物车数量
 */
function getSingleProductBuyNumFromStorage(product) {
  let ProductStorage = wx.getStorageSync(`ProductStorage`) || {}
  //很多情况下是空的，所以直接返回0加快速度
  if (!Object.keys(ProductStorage).length) return 0
  let count = 0
  for (let key in ProductStorage) {
    let targetProduct = ProductStorage[key].find(item => item.productSkuId === product.productSkuId && item.sourceId === product.sourceId)
    if (targetProduct) {
      count = targetProduct.count
      break
    }
  }
  return count
}
/**
 * 获取当前购物车所有商品的加入购物车总数
 */
function getAddToShopCartNumFromStorage(keyword) {
  let ProductStorage = wx.getStorageSync(`ProductStorage`) || {}
  let arr = []
  switch (keyword) {
    //大宗
    case `largeCargo`:
      arr = ProductStorage[`largeCargo`]
      break;
    //不包括大宗和独家包销
    case `exceptLargeCargo`:
      for (let key in ProductStorage) {
        if (ProductStorage[key] && ProductStorage[key].length && key != `largeCargo` && key != `underwrite`) {
          arr = arr.concat(ProductStorage[key])
        }
      }
      break;
    //独家包销产品
    case `underwrite`:
      arr = ProductStorage[`underwrite`]
      break;      
    //单个经销商
    default:
      arr = ProductStorage[keyword]
      break;
  }
  if (!arr || !arr.length) {
    return 0
  } else {
    let count = 0
    for (let item of arr) {
      count += item.productSkuId == item.saleSpecId ? item.count : item.count * item.saleSpecQuantity
    }
    return count
  }
}
/********************列表优惠卷提示 开始********************/
/*升序*/
function ascend(useOrderAmountFrom) {
  return function (a, b) {
    let value1 = a[useOrderAmountFrom]
    let value2 = b[useOrderAmountFrom]
    return value1 - value2
  }
}
/**
 * 商品金额正好小于和大于当前优惠卷金额的优惠卷
 */
function getdxyCoupon(currentProductMoney, riseCoupon) {
  let coupon = { x:{}, d:{} }
  for (let i = 0; i < riseCoupon.length; i++) {
    if (currentProductMoney >= riseCoupon[i].useOrderAmountFrom) {
      coupon.x = riseCoupon[i]
    }
  }
  for (let i = 0; i < riseCoupon.length; i++) {
    if (currentProductMoney < riseCoupon[i].useOrderAmountFrom) {
      coupon.d = riseCoupon[i]
      break
    }
  }
  return coupon
}
/**
 * 
 * 限时惠商品起送提示
 */
function getUserSendPrompt(currentProductMoney) {
  currentProductMoney = currentProductMoney > 0 ? currentProductMoney : 0
  let prompt =""
  //TP2-958
  let qsMoney = App.globalData.appSetting && App.globalData.appSetting.minBuyAmount || 0
  //如果当前商品金额小于订单起送金额，直接给出起送提示
  let cha = (currentProductMoney * 1000 - qsMoney * 1000) / 1000
  if (cha < 0) {
    prompt = "自营产品购满" + qsMoney + "元起送，还差" + Math.abs(cha) + "元"
  }
  //如果大于等于起购金额，给出提示已享受起送条件
  if (cha >= 0 && qsMoney > 0) {
    prompt = "已享受起送条件"
  }
  return prompt
}
/**
 * 列表中获取当前商品金额应该给出的优惠卷提示
 */
function getUserCouponPrompt(currentProductMoney, canUseCouponMoney) {
  currentProductMoney = currentProductMoney > 0 ? currentProductMoney:0
  //TP2-958
  let qsMoney = App.globalData.appSetting&&App.globalData.appSetting.minBuyAmount||0
  //如果当前商品金额小于订单起送金额，直接给出起送提示
  let cha = (currentProductMoney * 1000 - qsMoney* 1000) / 1000
  if (cha<0) {
    return "自营产品购满" + qsMoney + "元起送，还差" + Math.abs(cha) + "元"
  }
  let prompt = ""
  //当前商品总额
  let myCouponData = wx.getStorageSync("myCouponData")
  let myCoupons = []
  myCoupons = myCouponData.data;
  //可用劵通过启用金额升序排列
  let riseCoupon = myCoupons.sort(ascend('useOrderAmountFrom'))

  //分别找到优惠券启用金额刚刚大于和小于商品总额的优惠卷
  let dxyCoupon = getdxyCoupon(canUseCouponMoney, riseCoupon)
  if (!dxyCoupon.x.amount && dxyCoupon.d.amount){
    let nextBuyfirst = (dxyCoupon.d.useOrderAmountFrom * 1000 - canUseCouponMoney * 1000) / 1000
    prompt = "再购自营商品" + nextBuyfirst + "元，立享满" + dxyCoupon.d.useOrderAmountFrom + "减" + dxyCoupon.d.amount
  }else{
    if (dxyCoupon.x.amount) {
      prompt = "已享满" + dxyCoupon.x.useOrderAmountFrom + "减" + dxyCoupon.x.amount
    }
    if (dxyCoupon.x.amount && dxyCoupon.d.amount) {
      prompt = prompt + ","
    }
    if (dxyCoupon.d.amount) {
      let nextBuy = (dxyCoupon.d.useOrderAmountFrom * 1000 - canUseCouponMoney * 1000) / 1000
      prompt = prompt + "再购" + nextBuy + "元，立享满" + dxyCoupon.d.useOrderAmountFrom + "减" + dxyCoupon.d.amount
    }
    //如果没有优惠券提示，同时大于等于起购金额，给出提示已享受起送条件
    if (!prompt && cha >= 0 && qsMoney > 0) {
      return "已享受起送条件"
    }
  }
 
  return prompt
}
/**
 * 购物车中获取当前商品金额应该给出的优惠卷提示以及即将被用到的优惠卷
 */
function getUserCouponPromptForCart(currentProductMoney) {
  let prompt = ""
  //当前商品总额
  let myCouponData = wx.getStorageSync("myCouponData")
  let myCoupons = []
  myCoupons = myCouponData.data;
  //可用劵通过启用金额升序排列
  let riseCoupon = myCoupons.sort(ascend('useOrderAmountFrom'))
  let wiiUseCoupon ={}
  //分别找到优惠券启用金额刚刚大于和小于商品总额的优惠卷
  let dxyCoupon = getdxyCoupon(currentProductMoney, riseCoupon)
  //如果购买金额未达到优惠券启用金额
  if (!dxyCoupon.x.amount && dxyCoupon.d.amount){
    let nb = (dxyCoupon.d.useOrderAmountFrom*1000 - currentProductMoney*1000)/1000
    prompt = "购买自营商品，用券可享满" + dxyCoupon.d.useOrderAmountFrom + "减" + dxyCoupon.d.amount+",还差"+
      nb+"元"
    wiiUseCoupon.canUse = false
  }else{
    if (dxyCoupon.x.amount) {
      prompt = "已享满" + dxyCoupon.x.useOrderAmountFrom + "减" + dxyCoupon.x.amount
      wiiUseCoupon.canUse = true
    }
    if (dxyCoupon.x.amount && dxyCoupon.d.amount) {
      prompt = prompt + ","
    }
    if (dxyCoupon.d.amount) {
      let nextBuy = (dxyCoupon.d.useOrderAmountFrom * 1000 - currentProductMoney * 1000) / 1000
      prompt = prompt + "再购" + nextBuy + "元，立享满" + dxyCoupon.d.useOrderAmountFrom + "减" + dxyCoupon.d.amount
      wiiUseCoupon.canUse = true
    }
  }
  //如果没有大于的优惠卷，返回小于的
  if (dxyCoupon.d.amount){
    wiiUseCoupon.useOrderAmountFrom = dxyCoupon.d.useOrderAmountFrom
    wiiUseCoupon.amount = dxyCoupon.d.amount 
  }
  if (!dxyCoupon.d.amount && dxyCoupon.x.amount){
    wiiUseCoupon.useOrderAmountFrom = dxyCoupon.x.useOrderAmountFrom
    wiiUseCoupon.amount = dxyCoupon.x.amount
  }
  return {prompt, wiiUseCoupon}
}
/**
 * 第一次打开列表时获取当前购物车所有商品的加入购物车金额(只考虑酒批自营和可用优惠卷的)，和提示
 */
function getUserCouponMoneyforDefault(){
  let ProductStorage = wx.getStorageSync(`ProductStorage`) || {}
  let arr = ProductStorage[`jiuPi`]
  //当前可用金额
  let CurrentProductMoney = 0;
  if (arr && arr.length > 0) {
    let price = 0
    let ratio = 1
    for (let item of arr) {
      if (item.isUseCoupon){
        item.price = item.price || item.sellingPrice
        ratio = item.productSkuId === item.productSaleSpecId ? 1 : item.saleSpecQuantity
        let reductMoney = item.productPrice && item.productPrice.reducePrice || 0
        price += (item.price - reductMoney) * item.count * ratio
      }
    }
    CurrentProductMoney = parseFloat(price).toFixed(2)
  }
  return CurrentProductMoney
}
/**
 * 第一次打开列表时获取当前购物车所有商品的加入购物车金额(只考虑酒批自营,限时惠)，和提示
 */
function getUserMoneyforDefault() {
  let ProductStorage = wx.getStorageSync(`ProductStorage`) || {}
  let arr = ProductStorage[`jiuPi`]

  let timeLimit = ProductStorage[`timeLimit`]
  //当前可用金额
  let CurrentProductMoney = 0;
  if (arr && arr.length > 0) {
    let price = 0
    let ratio = 1
    for (let item of arr) {
        item.price = item.price || item.sellingPrice
        ratio = item.productSkuId === item.productSaleSpecId ? 1 : item.saleSpecQuantity
        let reductMoney = item.productPrice && item.productPrice.reducePrice || 0
       price += (item.price - reductMoney) * item.count * ratio
    }
    CurrentProductMoney = parseFloat(price).toFixed(2)
  }
  if (timeLimit && timeLimit.length > 0) {
    let price = 0
    let ratio = 1
    for (let item of timeLimit) {
      item.price = item.price || item.sellingPrice
      ratio = item.productSkuId === item.productSaleSpecId ? 1 : item.saleSpecQuantity
      price += item.price * item.count * ratio
    }
    CurrentProductMoney = parseFloat(price).toFixed(2)
  }
  return CurrentProductMoney
}
/********************列表优惠卷提示 结束********************/





/**
 * 获取当前购物车所有商品的加入购物车金额,返回一个金额字符串
 */
function getAddToShopCartPriceFromStorage(keyword) {
  let ProductStorage = wx.getStorageSync(`ProductStorage`) || {}
  let arr = []
  switch (keyword) {
    //大宗
    case `largeCargo`:

      arr = ProductStorage[`largeCargo`]
      break;
    //不包括大宗，独家包销
    case `exceptLargeCargo`:
      for (let key in ProductStorage) {
        if (ProductStorage[key] && ProductStorage[key].length && key != `largeCargo` && key != `underwrite`) {
          arr = arr.concat(ProductStorage[key])
        }
      }
      break;
    //独家包销产品
    case `underwrite`:
      arr = ProductStorage[`underwrite`]
      break;
    //单个经销商
    default:
      arr = ProductStorage[keyword]
      break;
  }
  if (!arr || !arr.length) {
    return `0.00`
  } else {
    let price = 0
    let ratio = 1
    for (let item of arr) {
      if (keyword == `underwrite`){
        //独家包销产品
        if (item.saleSpecQuantity == item.specQuantity && item.saleSpecQuantity) {
          ratio = item.saleSpecQuantity;
        }
      }else{
        ratio = item.productSkuId === item.productSaleSpecId ? 1 : item.saleSpecQuantity
      }
      let reductMoney = item.productPrice && item.productPrice.reducePrice || 0
      price += (item.price - reductMoney) * item.count * ratio
    }
    // let price = arr.reduce((accumulator, item) => accumulator +
    //   item.productSkuId === item.productSaleSpecId ? item.sellingPrice * item.count : item.sellingPrice * item.saleSpecQuantity * item.count, 0)
    return parseFloat(price).toFixed(2)
  }
}

/**
 * 独家包销产品
 */

module.exports = {
  updateProductNumToStorage,
  addProductToStorage,
  removeProductFromStorage,
  getSingleProductBuyNumFromStorage,
  getAddToShopCartNumFromStorage,
  getAddToShopCartPriceFromStorage,
  getUserCouponMoneyforDefault,
  getUserMoneyforDefault,
  getUserCouponPrompt,
  getUserSendPrompt,
  getUserCouponPromptForCart
}