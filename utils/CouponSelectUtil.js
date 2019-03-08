
function canSelectCoupon(productList, couponGroups, selectCoupon, selectCouponList = []) {
  if (!selectCouponList || !selectCouponList.length) {
    //滤掉不适合当前优惠券组的商品
    productList = productList.filter(item => this.fitCoupon(item, selectCoupon))
    //第一张始终可选
    let totalCalcAmount = this.getTotalCalcAmount(productList)
    let diff = selectCoupon.amount - totalCalcAmount
    let desc = diff > 0 ? `您选择了优惠券${selectCoupon.amount}元，其中${(selectCoupon.amount - diff).toFixed(2)}元有效` : ``
    return { success: true, desc }
  } else if (!this.isInSameGroup(selectCoupon, selectCouponList[0], couponGroups)) {
    return { success: false, desc: `该优惠券不能和您已选的优惠券同时使用，您可以全部取消重新选择` }
  } else if (selectCouponList[0].couponTemplate.couponType == 1 || selectCouponList[0].couponTemplate.couponType == 2) {
    //抵用券(0)),打折券(1)),赠品券(2))
    return { success: false, desc: `该优惠券不能和您已选的优惠券同时使用，您可以全部取消重新选择` }
  } else {
    const firstSelectCoupon = selectCouponList[0]
    //滤掉不适合当前优惠券组的商品
    productList = productList.filter(item => this.fitCoupon(item, firstSelectCoupon))
    let totalCalcAmount = this.getTotalCalcAmount(productList)
    //已选优惠券累计启用金额
    let selectCouponAmountFrom = 0
    //已选优惠券累计减免金额
    let selectCouponAmount = 0
    for (let item of selectCouponList) {
      selectCouponAmountFrom += item.useOrderAmountFrom
      selectCouponAmount += item.amount
    }
    //是否还能继续用
    if (totalCalcAmount - selectCouponAmountFrom >= selectCoupon.useOrderAmountFrom) {
      //剩余金额大于等于选中额的启用金额
      if (totalCalcAmount - selectCouponAmount <= 0) {
        //剩余金额减到0了。不能使用0启用金额的券
        return { success: false, desc: `您的订单不满足优惠券使用条件请重新选择` }
      } else if (totalCalcAmount - selectCouponAmount < selectCoupon.amount) {
        //剩余金额未到0，但是使用该券会作废一部分
        let diff = selectCoupon.amount - (totalCalcAmount - selectCouponAmount)
        let desc = diff > 0 ? `您选择了优惠券${selectCoupon.amount}元，其中${(selectCoupon.amount - diff).toFixed(2)}元有效` : ``
        return { success: true, desc }
      } else {
        //正常使用
        return { success: true, desc: `` }
      }
    } else {
      return { success: false, desc: `您的订单不满足优惠券使用条件请重新选择` }
    }
  }
}
//获取优惠券详细减免金额或者赠品字符串
function getSelectCouponReduce(selectCouponList, productList) {
  //滤掉不适合当前优惠券组的商品
  productList = productList.filter(item => this.fitCoupon(item, selectCouponList[0]))
  let totalCalcAmount = this.getTotalCalcAmount(productList)
  let reduceNum = 0
  let reduceStr = ``
  if (!selectCouponList || !selectCouponList.length) {
    reduceNum = 0
  }
  //抵用券(0)),打折券(1)),赠品券(2))
  else if (selectCouponList[0].couponTemplate.couponType == 0) {
    for (let coupon of selectCouponList) {
      reduceNum += coupon.amount
    }
    reduceNum = reduceNum > totalCalcAmount ? totalCalcAmount : reduceNum
  }
  else if (selectCouponList[0].couponTemplate.couponType == 1) {
    reduceNum = (1 - selectCouponList[0].percent / 10) * totalCalcAmount
  }
  else if (selectCouponList[0].couponTemplate.couponType == 2) {
    reduceStr = selectCouponList[0].couponTemplate.name
  }
  return { reduceNum, reduceStr }
}
//判断两张券是不是在同一组
function isInSameGroup(selectCoupon, existCoupon, couponGroups) {
  let targetGroup = {}
  //找出已选的优惠券所在的位置
  for (let i = 0; i < couponGroups.length; i++) {
    for (let j = 0; j < couponGroups[i].coupons.length; j++) {
      if (existCoupon.couponId == couponGroups[i].coupons[j].couponId) {
        targetGroup = couponGroups[i]
        break;
      }
    }
  }
  return targetGroup.coupons.findIndex(item => item.couponId == selectCoupon.couponId) != -1
}
//获取参与计算订单总金额
function getTotalCalcAmount(productList) {
  let totalAmount = 0
  for (let product of productList) {
    totalAmount += product.productAmount
  }
  return totalAmount
}
//产品是否能用该券(打折券和赠品券已经排除。只针对抵用券)
function fitCoupon(product, coupon) {
  if (!product.isUseCoupon || !coupon) { return false }
  let blackList = []
  let whiteList = []
  //定向产品券(0 考虑白名单),定向品类券(1 考虑黑白名单),通用券(2 考虑黑名单)
  if (coupon.couponTemplate.couponUseType == 0) {
    whiteList = coupon.couponTemplate.useProductSpecIdList || []
    return whiteList.findIndex(item => item == product.productSpecId) != -1
  } else if (coupon.couponTemplate.couponUseType == 1) {
    whiteList = coupon.couponTemplate.useCategoryIdList || []
    blackList = coupon.couponTemplate.productSpecIdBlacklist || []
    let fit = false
    for (let categoryId of product.categoryIds) {
      if (whiteList.findIndex(item => item == categoryId) != -1) { fit = true; break; }
    }
    return fit && (blackList.findIndex(item => item == product.productSpecId) == -1)
  } else if (coupon.couponTemplate.couponUseType == 2) {
    blackList = coupon.couponTemplate.productSpecIdBlacklist || []
    return blackList.findIndex(item => item == product.productSpecId) == -1
  }
}
//将优惠券从已选择的列表里移除
function removeCouponFromSelectList(coupon, selectCouponList) {
  let index = selectCouponList.findIndex(item => item.couponId == coupon.couponId)
  if (index != -1) { selectCouponList.splice(index, 1) }
  return selectCouponList
}
//计算满足下一张券还差多少钱
function calcNeedAmmount(productList, coupon, selectCouponList) {
  let hasSelectAmount = 0
  for (let hasSelectCoupon of selectCouponList) {
    hasSelectAmount += hasSelectCoupon.useOrderAmountFrom
  }
  productList = productList.filter(item => item.isUseCoupon == true)
  let productAmount = 0
  for (let product of productList) {
    productAmount += product.productAmount
  }
  return coupon.useOrderAmountFrom - (productAmount - hasSelectAmount)
}
module.exports = {
  isInSameGroup, fitCoupon, getTotalCalcAmount,
  canSelectCoupon, getSelectCouponReduce, removeCouponFromSelectList,
  calcNeedAmmount
}