/**
 * 改造产品数据，添加字段的工具类
 */
//import   from './AddToShopCartUtil.js'
import DateUtil from '../../utils/DateUtil.js'

var unlockSelfPickup = getApp().globalData.unlockSelfPickup;
var productDisplay = {"displayAccumulation":false,
		   "displayUnAccumulation":false,
		   "displayAvailableBonus":true,
		   "displayUnAvailableBonus":true,
		   "displayUseCoupon":true,
		   "displayNotUseCoupon":true,
		   "displayAccumulationInfo":"参与累计",
		   "unDisplayAccumulationInfo":"不参与累计",
		   "displayAvailableBonusInfo":"可用红包",
		   "unDisplayAvailableBonus":"不可用红包",
		   "displayUseCouponInfo":"可用优惠券",
		   "unDisplayUseCouponInfo":"不可用券"};

function initProductBuyNum(productStorageDate,product){

	if(!productStorageDate.length){
		return 0;
	}
	let count = 0;	
  product.nearExpireId = product.nearExpireId || ''
	for(let item of productStorageDate){
    item.nearExpireId = item.nearExpireId || ''
    if (item.productSkuId == product.productSkuId && item.productSaleSpecId == product.productSaleSpecId && item.nearExpireId == product.nearExpireId){
			count = item.buyNum
		}
	}
	return count;
}
		   
//处理产品标签
function processTags(product) {
  if (product.productTags && product.productTags.length) {
    for (let tag of product.productTags) {
      //优惠通知，特别提示 商品详情展示需要
      if (tag.tagType == 98) {
        product.specialNoticeTag = tag
       }
      //限购
      if (tag.tagType == 1) {
        product.limitBuyTag = tag
        product.limitBuyCount = parseInt(tag.value)
      }
    }
  }
  return product
}

//产品库存状态提示
function getStockText(product) {
  
  product.stockText =
    product.stockState == 2 ? `仅剩${product.storeCount}${product.storeUnit}` :
      product.stockState == 3 ? `已抢光` :
        product.stockState == 4 ? `预售${product.presaleStoreCount}${product.storeUnit}` : ``
  return product
}



//構建productlist 
function transformProductList(productStorageDate,productList){
	//
	for(let product of productList){
		product.citySelfPickUp = unlockSelfPickup;
    product.productionDate = product.productionDate ? DateUtil.getDateStr(product.productionDate) : '';
		//產品價格展示   ？
		product.mainPrice = product.productPrice ? product.productPrice.price : product.price;
		 //如果是合作商产品，最小为1，最大为无穷
  
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
		if(product.minPurchaseNum){
				product.minBuyNum = product.minPurchaseNum;
		}else{
				product.minBuyNum = 1;
		}
		product.buyNum = initProductBuyNum(productStorageDate,product);	
		product= getStockText(product);	
	}	
	return productList;
}

module.exports = {
	transformProductList : transformProductList
}