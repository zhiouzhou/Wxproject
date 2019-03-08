//页面路由
const RouteConstants = {
  //登录
  login: `/pages/login/login`,
  bindPhone: `/pages/login/bindPhone`,
  findPassword: `/pages/login/findPassword`,
  multiDevice: `/pages/login/multiDevice`,
  guide: `/pages/login/guide`,
  //注册
  registerStepOne: `/pages/register/registerStepOne`,
  registerStepTwo: `/pages/register/registerStepTwo`,
  //五大页面
  homePage: `/pages/homePage/homePage`,
  category: `/pages/category/category`,
  shopCart: `/pages/shopCart/shopCart`,
  service: `/pages/service/service`,
  user: `/pages/user/user`,
  //活动
  atyDetail: `/pages/activity/activityDetail`, //活动详情
  atyList: `/pages/activity/activityList`, //活动列表
  comAtyList: `/pages/compositeActivity/compositeProductList`, //组合活动列表
  comAtyDetail: `/pages/compositeActivity/compositeProductDetail`, //组合商品详情
  proAndDis: `/pages/promoAndDiscount/promoAndDiscount`, //优惠特价
  //搜索
  search: `/pages/search/search`,
  //产品
  productList: `/pages/product/productList`,
  productDetail: `/pages/product/productDetail`,
  //订单
  orders: `/pages/user/orders/orders`,
  orderDetail: `/pages/user/orders/orderDetail`,
  orderTrack: `/pages/user/orders/orderTrack`, //流转信息分普通订单  和  退货单 
  orderValuation: `/pages/user/orders/orderValuation`, //订单评价
  orderValuationDetail: `/pages/user/orders/orderValuationDetail`, //订单评价详情
  //消息
  message: `/pages/message/message`,
  sHome: `/pages/message/sHome`,
  //签到
  signIn: `/pages/user/signIn/signIn`,
  //链接广告
  linkAd: `/pages/linkAd/linkAd`,
  //退货订单列表
  orderReturn: `/pages/user/orderReturn/orderReturn`,
  //退货单详情
  orderReturnDetail: `/pages/user/orderReturn/orderReturnDetail`,
  applyReturnOrderList: `/pages/user/applyReturnOrder/applyReturnOrderList`, //申请退货 -选择商品列表
  applyReturnOrder: `/pages/user/applyReturnOrder/applyReturnOrder`, //申请退货
  //订单提交
  orderSubmit: `/pages/shopCart/orderSubmit`,
  selectUserAddress: `/pages/shopCart/selectAddress/selectUserAddress`,
  selectSelfPickAddress: `/pages/shopCart/selectAddress/selectSelfPickAddress`,
  selectCoupons: `/pages/shopCart/selectAssets/selectCoupons`,
  selectBonus: `/pages/shopCart/selectAssets/selectBonus`,
  orderResultSuccess: `/pages/shopCart/orderResult/orderResultSuccess`,
  orderResultFail: `/pages/shopCart/orderResult/orderResultFail`,
  orderOnlinePaySuccess: `/pages/shopCart/orderResult/orderOnlinePaySuccess`,
  orderOnlinePayFail: `/pages/shopCart/orderResult/orderOnlinePayFail`,
  getMoreProduct: `/pages/shopCart/getMoreProduct/getMoreProduct`,
  orderGoodsList: `/pages/shopCart/orderGoodsList/orderGoodsList`,
  //经销商页面
  dealer: `/pages/dealer/dealer`,
  dealerList: `/pages/dealer/dealerList`,
  adventProductList: `/pages/adventProductPage/adventProductList`, //临期产品列表    参数bulk  ==1为大宗   ==2为临期
  adventProductCart: `/pages/adventProductPage/adventProductCart`, //临期产品购物车    参数bulk  ==1为大宗    ==2为临期
  adventProductDetail: `/pages/adventProductPage/adventProductDetail`, //参数bulk  ==1为大宗   ==2为临期 ；nearExpireId 临期请求detail;productSkuId 大宗请求detail 
  //我的页面
  myCollection: `/pages/user/myCollection/myCollection`,
  receiveAddress: `/pages/user/receiveAddress/receiveAddress`,
  addNewAddress: `/pages/user/receiveAddress/addNewAddress`,
  addUserAddress: `/pages/user/receiveAddress/addUserAddress`,

  manageAccount: `/pages/user/manageAccount/manageAccount`,
  changePassword: `/pages/user/changePassword/changePassword`,
  selectStreet: `/pages/user/receiveAddress/selectStreet`,
  myUnderwrite: `/pages/user/underwrite/underwrite`,
  groupBuyList: `/pages/user/groupBuying/groupBuyList`, //团购列表
  groupBuyDetail: `/pages/user/groupBuying/groupBuyDetail`,
  groupFrame: `/pages/user/groupBuying/groupFrame`, //团购空页面，嵌入h5团购公共页面
  //首页获取酒批城市列表
  onRelocate: `/pages/homePage/onRelocate`,
  //新增投诉



  // ************************************* 子模块****************************************
  //兑奖申请
  prizeApply: `/subModule/pages/prizeApply/prizeApply`,
  applyDetail: `/subModule/pages/prizeApply/applyDetail`,
  addApply: `/subModule/pages/prizeApply/addApply`,
  selectPrizeAddress: `/subModule/pages/prizeApply/selectPrizeAddress`,
  changeNumber: `/subModule/pages/prizeApply/changeNumber`,

  //帮我找货
  findGoods: `/subModule/pages/findGoods/findGoods`, //帮我找货
  findGoodsDetail: `/subModule/pages/findGoods/findGoodsDetail`, //找货详情
  addFindGoods: `/subModule/pages/findGoods/addFindGoods`, //新增找货

  //投诉建议
  complaints: `/subModule/pages/complaints/complaints`,
  addComplaint: `/subModule/pages/complaints/addComplaint`,
  selectOrder: `/subModule/pages/selectOrder/selectOrder`, //选择投诉订单
  complaintDetail: `/subModule/pages/complaints/complaintDetail`, //投诉详情
  evaluateComplaint: `/subModule/pages/complaints/evaluateComplaint`, //投诉评价

  //我的钱包
  myBonus: `/subModule/pages/myBonus/myBonus`,
  myCoin: `/subModule/pages/myCoin/myCoin`,
  myCoupon: `/subModule/pages/myCoupon/myCoupon`,
  myOddBalance: `/subModule/pages/myOddBalance/myOddBalance`,
  oddBalanceDetail: `/subModule/pages/myOddBalance/oddBalanceDetail`,

  //扫码新增产品
  scanAddGoods: `/subModule/pages/addGoods/addGoods`,

  //独家包销列表页面
  underwriteList: `/subModule/pages/underwriteList/underwriteList`,
  //独家包销产品申请页面
  underwriteApply: `/subModule/pages/underwriteApply/apply`,
  exchangeOne: `/subModule/pages/exchange/exchangeOne`, //it is exchange goods first step
  exchangeTwo: `/subModule/pages/exchange/exchangeTwo`, //退换货第二步
  exchangThree: `/subModule/pages/exchange/exchangeThree`, //退换货第三步
  exchangeSuccess: `/subModule/pages/exchangeSuccess/exchangeSuccess`, //换货申请成功
  exchangeFail: `/subModule/pages/exchangeSuccess/exchangeFail`, //换货申请失败
  //常购清单列表页
  alwaysBuyList: `/subModule/pages/alwaysBuyList/alwaysBuyList`,
  //优惠券适用产品
  couponProduct: `/subModule/pages/couponProduct/couponProduct`,
  mallAnswer: `/subModule/pages/mallAnswer/mallAnswer`, //易酒批答题
  //所有规则说明
  explain: `/subModule/pages/explain/explain`,
}
//验证码位数
const CodeNum = 6
//小程序AppId
const AppId = `wx8a391318258211d5`
//百度地图定位相关
const BaiduMapBaseUrl = `https://api.map.baidu.com/`
const BaiduMapAKCode = `iYRGlIjGOd27cGltN79L5aIm`
//腾讯地图定位key
const TencentMapKey = `W3TBZ-R4BL6-ZFWSF-EJVTD-UPL3H-CGFIR`
module.exports = {
  Route: RouteConstants,
  CodeNum,
  AppId,
  BaiduMapAKCode,
  BaiduMapBaseUrl,
  TencentMapKey,
}