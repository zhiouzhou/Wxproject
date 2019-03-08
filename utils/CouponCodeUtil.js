//    joinMode	起用条件    0 - 按产品购买金额；1 - 按产品购买件数
// couponCodeType	优惠码类型	number	0- 抵用码；1 - 打折码；2 - 赠品码; 3 - 特价码

import DateUtil from 'DateUtil.js'
//获取优惠码的满足或者不满足状态提示(订单提交页面)
function getCodeFit(couponCodeDetail, product = undefined, orderProductCount = 0, orderProductAmount = 0) {
  let data = this.processProduct(product)
  let saleUnit = ``
  let minUnit = ``
  let productSkuId = ``
  let productSaleSpecId = ``
  let saleSpecQuantity = 1
  let productBuyAmount = orderProductAmount
  let productBuyCount = orderProductCount
  if (data.productExsit) {
    saleUnit = product.saleUnit
    minUnit = product.minUnit
    productSkuId = product.productSkuId
    productSaleSpecId = product.productSaleSpecId
    saleSpecQuantity = product.saleSpecQuantity
  }
  //按金额
  if (couponCodeDetail.joinMode == 0) {
    let prefix = `该优惠码定向产品【${couponCodeDetail.productName}】`
    let middle = ``
    //这里不能把购满提出来，因为订单内没有该产品的时候取不到单位
    if (couponCodeDetail.couponCodeType == 0) {
      middle = `，购满该产品${couponCodeDetail.minBuyAmount}元可减${couponCodeDetail.couponAmount}元`
    } else if (couponCodeDetail.couponCodeType == 1) {
      middle = `，购满该产品${couponCodeDetail.minBuyAmount}元可打${couponCodeDetail.percent * 10}折`
    } else if (couponCodeDetail.couponCodeType == 2) {
      middle = `，购满该产品${couponCodeDetail.minBuyAmount}元可赠本品${couponCodeDetail.giveCount}${couponCodeDetail.giveUnit}`
    } else if (couponCodeDetail.couponCodeType == 3) {
      let notice = !couponCodeDetail.limitPurchaseNum ? `` : `（注：最多${productSkuId == productSaleSpecId ? couponCodeDetail.limitPurchaseNum : couponCodeDetail.limitPurchaseNum * saleSpecQuantity}${productSkuId == productSaleSpecId ? saleUnit : minUnit}享特价）`
      middle = `，购满该产品${couponCodeDetail.minBuyAmount}元本品可享特价${couponCodeDetail.specialPrice}元/${couponCodeDetail.specialPriceUnit}${notice}`
    }

    let suffix = ``
    let diff = 0
    let success = false
    if (product == undefined) {
      middle = ``
      suffix = `，当前订单无此产品，是否继续添加商品？`
      success = false
    } else if (productBuyAmount < couponCodeDetail.minBuyAmount) {
      diff = (couponCodeDetail.minBuyAmount - productBuyAmount).toFixed(2)
      suffix = `，再购${diff}元该产品可用，是否继续添加商品？`
      success = false
    } else if (productBuyAmount >= couponCodeDetail.minBuyAmount) {
      suffix = `，将于${DateUtil.getDateStr(couponCodeDetail.expireTime)}过期。`
      success = true
    }
    //打折券有最高优惠金额
    if (success && couponCodeDetail.couponCodeType == 1) {
      middle = middle + `，已省${(Math.min((1 - couponCodeDetail.percent) * productBuyAmount, couponCodeDetail.maxDiscountAmount)).toFixed(2)}元`
    }
    return { success, desc: `${prefix}${middle}${suffix}` }
  }
  //按件数
  else if (couponCodeDetail.joinMode == 1) {
    let prefix = `该优惠码定向产品【${couponCodeDetail.productName}】`
    let middle = ``
    //这里不能把购满提出来，因为订单内没有该产品的时候取不到单位
    if (couponCodeDetail.couponCodeType == 0) {
      middle = `，购满该产品${couponCodeDetail.minBuyCount}${saleUnit}可减${couponCodeDetail.couponAmount}元`
    } else if (couponCodeDetail.couponCodeType == 1) {
      middle = `，购满该产品${couponCodeDetail.minBuyCount}${saleUnit}可打${couponCodeDetail.percent * 10}折`
    } else if (couponCodeDetail.couponCodeType == 2) {
      middle = `，购满该产品${couponCodeDetail.minBuyCount}${saleUnit}可赠本品${couponCodeDetail.giveCount}${couponCodeDetail.giveUnit}`
    } else if (couponCodeDetail.couponCodeType == 3) {
      let notice = !couponCodeDetail.limitPurchaseNum ? `` : `（注：最多${productSkuId == productSaleSpecId ? couponCodeDetail.limitPurchaseNum : couponCodeDetail.limitPurchaseNum * saleSpecQuantity}${productSkuId == productSaleSpecId ? saleUnit : minUnit}享特价）`
      middle = `，购满该产品${couponCodeDetail.minBuyCount}${saleUnit}本品可享特价${couponCodeDetail.specialPrice}元/${couponCodeDetail.specialPriceUnit}${notice}`
    }

    let suffix = ``
    let diff = 0
    let success = false
    if (product == undefined) {
      middle = ``
      suffix = `，当前订单无此产品，是否继续添加商品？`
      success = false
    } else if (productBuyCount < couponCodeDetail.minBuyCount) {
      diff = couponCodeDetail.minBuyCount - productBuyCount
      suffix = `，再购${diff}${saleUnit}该产品可用，是否继续添加商品？`
      success = false
    } else if (productBuyCount >= couponCodeDetail.minBuyCount) {
      suffix = `，将于${DateUtil.getDateStr(couponCodeDetail.expireTime)}过期。`
      success = true
    }
    //打折券有最高优惠金额
    if (success && couponCodeDetail.couponCodeType == 1) {
      middle = middle + `,已省${(Math.min((1 - couponCodeDetail.percent) * productBuyAmount, couponCodeDetail.maxDiscountAmount)).toFixed(2)}元`
    }
    return { success, desc: `${prefix}${middle}${suffix}` }
  }
}

//获取优惠码的满足或者不满足状态顶部提示(添加商品页面)
function getCodeShortNotice(couponCodeDetail, product = undefined, orderProductCount = 0, orderProductAmount = 0) {
  let data = this.processProduct(product)
  let saleUnit = ``
  let minUnit = ``
  let productSkuId = ``
  let productSaleSpecId = ``
  let saleSpecQuantity = 1
  let productBuyAmount = orderProductAmount
  let productBuyCount = orderProductCount
  if (data.productExsit) {
    saleUnit = product.saleUnit
    minUnit = product.minUnit
    productSkuId = product.productSkuId
    productSaleSpecId = product.productSaleSpecId
    saleSpecQuantity = product.saleSpecQuantity
    productBuyAmount += data.productBuyAmount
    productBuyCount += data.productBuyCount
  }
  //按金额
  if (couponCodeDetail.joinMode == 0) {
    //金额未满足
    if (productBuyAmount < couponCodeDetail.minBuyAmount) {
      let diff = (couponCodeDetail.minBuyAmount - productBuyAmount).toFixed(2)
      let prefix = `购买以下商品满${couponCodeDetail.minBuyAmount}元，`
      let suffix = `，还差${diff}元`
      let middle = ``
      if (couponCodeDetail.couponCodeType == 0) {
        middle = `可减${couponCodeDetail.couponAmount}元`
      } else if (couponCodeDetail.couponCodeType == 1) {
        middle = `本品可打${couponCodeDetail.percent * 10}折，可减${(couponCodeDetail.minBuyAmount * (1 - couponCodeDetail.percent)).toFixed(2)}元`
      } else if (couponCodeDetail.couponCodeType == 2) {
        middle = `送本品${couponCodeDetail.giveCount}${couponCodeDetail.giveUnit}`
      } else if (couponCodeDetail.couponCodeType == 3) {
        //特价码没有按金额的
      }
      return { success: false, desc: `${prefix}${middle}${suffix}` }
    }
    //金额已满足
    else {
      let prefix = `已购满${couponCodeDetail.minBuyAmount}元，`
      let middle = ``
      if (couponCodeDetail.couponCodeType == 0) {
        middle = `已减${couponCodeDetail.couponAmount}元`
      } else if (couponCodeDetail.couponCodeType == 1) {
        middle = `已减${(Math.min(productBuyAmount * (1 - couponCodeDetail.percent), couponCodeDetail.maxDiscountAmount)).toFixed(2)}元`
      } else if (couponCodeDetail.couponCodeType == 2) {
        middle = `已获得赠品`
      } else if (couponCodeDetail.couponCodeType == 3) {
        //特价码没有按金额的
      }
      return { success: true, desc: `${prefix}${middle}` }
    }
  }
  //按件数
  else if (couponCodeDetail.joinMode == 1) {
    //件数未满足
    if (productBuyCount < couponCodeDetail.minBuyCount) {
      let diff = couponCodeDetail.minBuyCount - productBuyCount
      let prefix = `购买以下商品满${productSkuId == productSaleSpecId ? couponCodeDetail.minBuyCount : couponCodeDetail.minBuyCount * saleSpecQuantity}${productSkuId == productSaleSpecId ? saleUnit : minUnit}，`
      let suffix = `，还差${productSkuId == productSaleSpecId ? diff : diff * saleSpecQuantity}${productSkuId == productSaleSpecId ? saleUnit : minUnit}`
      let middle = ``
      if (couponCodeDetail.couponCodeType == 0) {
        middle = `可减${couponCodeDetail.couponAmount}元`
      } else if (couponCodeDetail.couponCodeType == 1) {
        middle = `本品可打${couponCodeDetail.percent * 10}折`
      } else if (couponCodeDetail.couponCodeType == 2) {
        middle = `送本品${couponCodeDetail.giveCount}${couponCodeDetail.giveUnit}`
      } else if (couponCodeDetail.couponCodeType == 3) {
        let notice = !couponCodeDetail.limitPurchaseNum ? `` :
          `（注：最多${productSkuId == productSaleSpecId ? couponCodeDetail.limitPurchaseNum : couponCodeDetail.limitPurchaseNum * saleSpecQuantity}${productSkuId == productSaleSpecId ? saleUnit : minUnit}享特价）`
        //成本码不显示注
        middle = `本品可享特价${couponCodeDetail.specialPrice}元/${couponCodeDetail.specialPriceUnit}${notice}`
      }
      return { success: false, desc: `${prefix}${middle}${suffix}` }
    }
    //件数已满足
    else {
      let prefix = `已购满${productSkuId == productSaleSpecId ? couponCodeDetail.minBuyCount : couponCodeDetail.minBuyCount * saleSpecQuantity}${productSkuId == productSaleSpecId ? saleUnit : minUnit}，`
      let middle = ``
      if (couponCodeDetail.couponCodeType == 0) {
        middle = `已减${couponCodeDetail.couponAmount}元`
      } else if (couponCodeDetail.couponCodeType == 1) {
        middle = `已减${(Math.min(productBuyAmount * (1 - couponCodeDetail.percent), couponCodeDetail.maxDiscountAmount)).toFixed(2)}元`
      } else if (couponCodeDetail.couponCodeType == 2) {
        middle = `已获得赠品`
      } else if (couponCodeDetail.couponCodeType == 3) {
        let specialPriceCouponCodeReduceAmount = this.getSpecialPriceCouponCodeReduceAmount(couponCodeDetail, product, productBuyCount)
        let notice = !couponCodeDetail.limitPurchaseNum ? `` :
          `（注：最多${productSkuId == productSaleSpecId ? couponCodeDetail.limitPurchaseNum : couponCodeDetail.limitPurchaseNum * saleSpecQuantity}${productSkuId == productSaleSpecId ? saleUnit : minUnit}享特价）`
        middle = `已享特价${couponCodeDetail.specialPrice}元/${couponCodeDetail.specialPriceUnit}${notice}，已减${(specialPriceCouponCodeReduceAmount).toFixed(2)}元`
      }
      return { success: true, desc: `${prefix}${middle}` }
    }
  }
}
//特价码优惠金额
function getSpecialPriceCouponCodeReduceAmount(couponCodeDetail, product, productBuyCount) {
  let finalFitCount = Math.min(productBuyCount, couponCodeDetail.limitPurchaseNum ? couponCodeDetail.limitPurchaseNum : 99999)
  let finalReducePrice = 0
  //产品的每个销售单位的价格(不考虑立减)
  let saleSpecAmount = product.productPrice.price * product.saleSpecQuantity
  //特价码为大单位
  if (couponCodeDetail.specialPriceUnit == product.saleUnit) {
    finalReducePrice = (saleSpecAmount - couponCodeDetail.specialPrice) * finalFitCount
  } else {
    finalReducePrice = (saleSpecAmount - couponCodeDetail.specialPrice * product.specQuantity) * finalFitCount
  }
  return finalReducePrice
}
//使用优惠码，产品不满足条件的提示对话框内文本(添加商品页面)
function getCodeUnfitDialogNotice(couponCodeDetail, product = undefined, orderProductCount = 0, orderProductAmount = 0) {
  let data = this.processProduct(product)
  let saleUnit = ``
  let minUnit = ``
  let productSkuId = ``
  let productSaleSpecId = ``
  let saleSpecQuantity = 1
  let productBuyAmount = orderProductAmount
  let productBuyCount = orderProductCount
  if (data.productExsit) {
    saleUnit = product.saleUnit
    minUnit = product.minUnit
    productSkuId = product.productSkuId
    productSaleSpecId = product.productSaleSpecId
    saleSpecQuantity = product.saleSpecQuantity
    productBuyAmount += data.productBuyAmount
    productBuyCount += data.productBuyCount
  }
  let a = `当前优惠码购满`
  let b = couponCodeDetail.joinMode == 0 ? `${couponCodeDetail.minBuyAmount}元` : couponCodeDetail.joinMode == 1 ? `${couponCodeDetail.minBuyCount}${saleUnit}` : ``
  let c = ``
  if (couponCodeDetail.couponCodeType == 0) {
    c = `可减${couponCodeDetail.couponAmount}元`
  } else if (couponCodeDetail.couponCodeType == 1) {
    c = `本品可打${couponCodeDetail.percent * 10}折`
  } else if (couponCodeDetail.couponCodeType == 2) {
    c = `送本品${couponCodeDetail.giveCount}${couponCodeDetail.giveUnit}`
  } else if (couponCodeDetail.couponCodeType == 3) {
    c = `本品可享特价${couponCodeDetail.specialPrice}元/${couponCodeDetail.specialPriceUnit}`
  }
  let d = `，否则将不能使用。`
  let e = `当前已选` + (couponCodeDetail.joinMode == 0 ? `${productBuyAmount}元` : couponCodeDetail.joinMode == 1 ? `${productSkuId == productSaleSpecId ? productBuyCount : productBuyCount * saleSpecQuantity}${productSkuId == productSaleSpecId ? saleUnit : minUnit}` : ``)
  let f = `，还差` + (couponCodeDetail.joinMode == 0 ? `${(couponCodeDetail.minBuyAmount - productBuyAmount).toFixed(2)}元` : couponCodeDetail.joinMode == 1 ? `${productSkuId == productSaleSpecId ? (couponCodeDetail.minBuyCount - productBuyCount) : (couponCodeDetail.minBuyCount - productBuyCount) * saleSpecQuantity}${productSkuId == productSaleSpecId ? saleUnit : minUnit}` : ``)
  let g = `，是否继续添加商品？`
  return `${a}${b}${c}${d}${e}${f}${g}`
}

function processProduct(product) {
  if (product == undefined) {
    return { productExsit: false, productBuyAmount: 0, productBuyCount: 0 }
  } else {
    product.buyCount = product.buyNum
    let productBuyAmount = (product.productPrice.price - product.productPrice.reducePrice) * product.saleSpecQuantity * product.buyCount || 0
    let productBuyCount = product.buyCount || 0
    return { productExsit: true, productBuyAmount, productBuyCount }
  }
}

module.exports = {
  getCodeFit, getCodeShortNotice, getCodeUnfitDialogNotice,
  processProduct, getSpecialPriceCouponCodeReduceAmount
}