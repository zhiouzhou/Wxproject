import Constants from './Constants.js'
import WxRequest from '../assets/plugins/wx-request/lib/index'
import versionConfig from '../version.config.js'
import StringUtil from './StringUtil.js'
import WxService from '../assets/plugins/wx-service/WxService'

class HttpService extends WxRequest {
  constructor(options) {
    super(options)
    this.interceptors.use({
      request(request) {
        request.header = request.header || {}
        request.header['content-type'] = 'application/json'
        if (request.data && request.data.formSubmit) {
          request.header['content-type'] = 'application/x-www-form-urlencoded'
        }
        return request
      },
      requestError(requestError) {
        wx.hideLoading()
        return Promise.reject(requestError)
      },
      response(response) {
        return response
      },
      responseError(responseError) {
        return Promise.reject(responseError)
      },
    })
    this.WxService = new WxService
    //100102009
  }

  //App启动执行
  onAppLaunch() {
    //初始化deviceId
    if (!wx.getStorageSync(`deviceId`)) {
      const deviceId = StringUtil.UUID()
      wx.setStorageSync(`deviceId`, deviceId)
    }
    //初始化业务地址
    return this.getApiUrl({
      appCode: versionConfig.appCode,
      appVersion: versionConfig.appVersion,
      isAuth: true
    })
      .then(data => {
        wx.setStorageSync(`businessUrl`, data.data[0])
        return this.getSystemSetting()
      })
      .then(data => {
        //初始化手机信息
        return this.WxService.getSystemInfo()
          .then(data => {
            getApp().globalData.systemInfo = data;
          })
      })
      .catch(e => { console.warn(e) })
  }
  //用户登录后，存储相关信息并获取用户相关的设置
  saveLoginInfo(loginInfo) {
    wx.setStorageSync('token', loginInfo.data.token)
    wx.setStorageSync('refreshToken', loginInfo.data.refreshToken)
    wx.setStorageSync('businessUrl', loginInfo.data.apiUrls[0])

    wx.setStorageSync('isVisitor', false)
    //登陆成功后，首页弹窗信息只显示一次
    getApp().globalData.firsrShowDialog = true
    getApp().globalData.profileBanners = []
    // 获取用户设置信息
    const getUserSettingPromise = this.postRequest(`UserInfo/GetUserSetting`, {
    }).then(data => wx.setStorageSync(`userSetting`, data.data))
    // 获取用户详情
    const getUserDetailPromise = this.postRequest(`UserInfo/GetUserDetail`, {
    }).then(data => {
      wx.setStorageSync(`userDetail`, data.data)
      let userDetail = {
        addressId: data.data.addressId,
        auditRejectionReason: data.data.auditRejectionReason,
        state: data.data.state,
        userDisplayClassId: data.data.userDisplayClassId,
        userId: data.data.userId,
        mobileNo: data.data.mobileNo,
        cityId: data.data.cityId
      }
      getApp().globalData.addressId = data.data.addressId;
      getApp().globalData.userDetail = userDetail;
    })
    const getUserAddress = this.postRequest(`Address/List`, { data: { datas: [0, 1, 2, 3] } })
      .then(data => {
        wx.setStorageSync(`userAddress`, data.data)
      })

    return this.all([getUserSettingPromise, getUserAddress, getUserDetailPromise])

      .catch(e => Promise.resolve(`getUserSettingAfterLogin error`))
  }
  //启动程序，初始化相关的设置
  getSystemSetting() {
    // 获取App注册相关配置信息
    const registerSettingPromise = this.postRequest(`Setting/RegisterSetting`, { data: { noToken: true } })
      .then(data => wx.setStorageSync(`registerSetting`, data.data))
    // 根据配置代码获取配置信息
    const getSettingValuePromise = this.postRequest(`Setting/GetSettingValue`, {
      data: {
        noToken: true,
        datas: [
          `OrderEvaluationButtonText`, //订单评价按钮文案
          `PageSize`,//分页大小
          `LargeCargoProductDesc`,//大宗商品描述
          `AwardExplain`,//兑奖说明
          `ProductDetailFullReduceWatermark`,//全场满减产品详情图片水印
          `ProductListFullReduceWatermark`,//全场满减产品列表图片水印
          `HelpDocURL`,//帮助中心 URL
          `FullReduceDescURL`,//全场立减描述信息 URL
          `MySignURL`,//我的签约 URL
          `PromotionCategoryName`,//优惠类目名称
          `CategoryProposeImgUrl`,//赚钱推荐类目
          `CategoryClearanceImgUrl`,//清仓区类目
          `CategoryDiscountImgUrl`,//打折专区类目
          `CategoryCompositeImgUrl`,//组合专区类目
          `CategoryGatherOrderImgUrl`,//凑单专区类目
          `CategoryTimeLimitImgUrl`,//限时专区类目
          `UnLoginPriceDesc`,//未登录查看价格描述
          `UnLoginBuyDesc`,//未登录购买描述
          `AuditRejectionPriceDesc`,//审核拒绝查看价格描述
          `AuditRejectionBuyDesc`,//审核拒绝购买描述
          `PendingAuditPriceDesc`,//待审核查看价格描述
          `PendingAuditBuyDesc`,//待审核购买描述
          `CouponCodeUseDescUrl`,//优惠码使用描述
          `ClearanceCategoryLabelId`,//清仓区标签 Id
          `AwardOrderServiceRemark`,//兑奖订单服务备注
          `MessageCenterUrl`,//消息中心          
          `ProductUnderwritingWatermark`,//独家包销产品水印图片
          `UnderwritingOrderSubmitDesc`, //独家包销订单提交描述
          `SecondPageUrl`,//二级主页url
          `GroupPurchaseURL`,//团购url
          `AnswerUrl`,//答题url
          `GroupPurchaseRuleURL`//拼团规则url
        ]
      }
    }).then(data => {
      wx.setStorageSync(`settingValue`, data.data)
      getApp().globalData.settingValue = data.data;
    })
    return this.all([registerSettingPromise, getSettingValuePromise]).catch(e => Promise.resolve(`getSystemSetting error`))
  }
  //自动登录(refreshToken),返回一个Promise.resolve()表示结果,每次自动登录都需要多设备验证
  autoLogin() {
    if (wx.getStorageSync(`refreshToken`)) {
      //有refreshToken的情况
      return this.postRequest(`user/refreshToken`, {
        data: {
          appCode: versionConfig.appCode,
          appVersion: versionConfig.appVersion,
          deviceId: wx.getStorageSync(`deviceId`),
          deviceType: versionConfig.deviceType,
          refreshToken: wx.getStorageSync(`refreshToken`),
          isAuth: true
        }
      }).then(data => {
        return this.saveLoginInfo(data)
      }).then(data => Promise.resolve(true))
        .catch(e => {
          // wx.setStorageSync('businessUrl', ``)
          return Promise.resolve(false)
        })
    } else if (wx.getStorageSync(`account`) && wx.getStorageSync(`password`)) {
      //老用户没有refreshToken但是有账号密码
      return this.postRequest(`user/login`, {
        data: {
          appCode: versionConfig.appCode,
          appVersion: versionConfig.appVersion,
          deviceId: wx.getStorageSync(`deviceId`),
          deviceType: versionConfig.deviceType,
          mobileNo: wx.getStorageSync(`account`),
          password: wx.getStorageSync(`password`),
          isAuth: true
        }
      }).then(data => {
        return this.saveLoginInfo(data)
      }).then(data => Promise.resolve(true))
        .catch(e => {
          return Promise.resolve(false)
        })
    } else {
      //从来没有登陆过
      return Promise.resolve(false)
    }
  }
  //刷新Token
  refreshToken() {
    return this.postRequest(`user/refreshToken`, {
      data: params,
    })
  }
  //获取用户信息统计
  getUserInfoCount(params) {
    return this.postRequest(`User/GetUserInfoCount`, {
      data: params,
    })
  }
  //账号密码登录
  userLogin(params) {
    return this.postRequest(`user/login`, {
      data: params,
    })
  }
  //账号验证码登录
  userLoginByCode(params) {
    return this.postRequest(`user/loginByCode`, {
      data: params,
    })
  }
  //检查是否需要多设备验证
  needValidate(params) {
    return this.postRequest(`MultiDevice/NeedValidate`, {
      data: params,
    })
  }
  // 校验当前用户是否可以登录
  validateLogin(params) {
    return this.postRequest(`UserAuthen/ValidateLogin`, {
      data: params,
    })
  }
  //验证多设备 
  multiDeviceValidate(params) {
    return this.postRequest(`MultiDevice/Validate`, {
      data: params,
    })
  }
  //会员发送验证码
  sendValidateCode(params) {
    return this.postRequest(`code/identifyingCode`, {
      data: params,
    })
  }
  //会员发送语音验证码
  sendVoiceValidateCode(params) {
    return this.postRequest(`code/voiceIdentifyingCode`, {
      data: params,
    })
  }
  //校验验证码
  codeValidate(params) {
    return this.postRequest(`Validatecode/Validate`, {
      data: params,
    })
  }
  //忘记密码
  forgetPassword(params) {
    return this.postRequest(`User/ForgetPassword`, {
      data: params,
    })
  }
  //获取API基地址
  getApiUrl(params) {
    return this.postRequest(`app/apiUrl`, {
      data: params,
    })
  }
  //检查手机号是否存在
  validateMobileNoIsExists(params) {
    return this.postRequest(`User/AccountIsExist`, {
      data: params,
    })
  }
  //OAuth登陆(小程序)
  loginOAuthWeApp(params) {
    return this.postRequest(`user/loginOAuthWeApp`, {
      data: params,
    })
  }
  //微信绑定手机
  weChatBind(params) {
    return this.postRequest(`User/WeChatBind`, {
      data: params,
    })
  }
  //通过百度地图获取标准的地址信息
  getBaiduLocation(params) {
    return this.getRequest(`geocoder/v2/`, {
      data: params,
    })
  }
  //注册
  register(params) {
    Object.assign(params, { noToken: true})
    return this.postRequest(`User/Register`, {
      data: params,
    })
  }
  //获取APP 引导页标签
  guideListTag(params) {
    return this.postRequest(`Guide/ListTag`, {
      data: params,
    })
  }
  //保存访客信息
  addUserInfo(params) {
    return this.postRequest(`Guide/AddUserInfo`, {
      data: params,
    })
  }
  //获取首页信息
  getPageInfo(params) {
    return this.postRequest(`HomePage/GetPageInfo`, {
      data: params,
    })
  }
  //获取热搜关键词
  getHotKeyWords(params) {
    return this.postRequest(`Setting/GetHotKeyWords`, {
      data: params,
    })
  }  //获取酒批城市列表
  getJiupiCity(params) {
    return this.postRequest(`City/ListJiupiCity`, {
      data: params,
    })
  }
  //获取热门城市
  getHotCity(params) {
    return this.postRequest(`City/ListHotCity`, {
      data: params,
    })
  }
  //获取活动详情
  getActivityDetail(params, promotionType) {
    const requestUrl =
      promotionType == 3 ? `Discount/GetPromotion` ://打折促销
        promotionType == 4 ? `Timelimit/GetPromotion` ://限时惠
          promotionType == 6 ? `GatherOrder/GetPromotion` ://凑单活动
            promotionType == 8 ? `ProductChoice/GetPromotion` ://产品精选
              ``
    return this.postRequest(requestUrl, {
      data: params,
    })
  }
  //获取组合商品列表
  getCompositeActivityList(params) {
    return this.postRequest(`CompositeProduct/QueryProductList`, {
      data: params,
    })
  }
  //获取组合商品详情
  getCompositeActivityDetail(params) {
    return this.postRequest(`Activity/GetCompositeProduct`, {
      data: params,
    })
  }
  //通过分享进入组合商品详情
  getCompositeActivityShareDetail(params) {
    return this.postRequest(`CompositeProduct/ShareDetail`, {
      data: params,
    })
  }
  //通过分享进入活动详情
  getActivityShareDetail(params, promotionType) {
    const requestUrl =
      promotionType == 3 ? `Discount/ShareDetail` ://打折促销
        promotionType == 4 ? `Timelimit/ShareDetail` ://限时惠
          promotionType == 6 ? `GatherOrder/ShareDetail` ://凑单活动
            promotionType == 8 ? `ProductChoice/ShareDetail` ://产品精选
              ``
    return this.postRequest(requestUrl, {
      data: params,
    })
  }
  //活动详情获取商品列表
  getActivityProduct(params, promotionType) {
    const requestUrl =
      promotionType == 3 ? `Discount/ListPromotionProduct` ://打折促销
        promotionType == 4 ? `Timelimit/ListPromotionProduct` ://限时惠
          promotionType == 6 ? `GatherOrder/ListPromotionProduct` ://凑单活动
            promotionType == 8 ? `ProductChoice/ListPromotionProduct` ://产品精选
              ``
    return this.postRequest(requestUrl, {
      data: params,
    })
  }
  //获取限时惠活动产品详情
  getTimeLimitProductDetail(params) {
    return this.postRequest(`Timelimit/GetPromotionProduct`, {
      data: params,
    })
  }
  //获取大宗  临期产品列表
  getLargeCargoProductList(params) {
    let reqUrl = '';
    let paramsData;
    if (params.bulk == 1) {
      paramsData = {//大宗
        addressId: params.addressId,
        brandIds: params.brandIds,
        categoryId: params.categoryId,
        currentPage: params.currentPage,
        firstCategoryId: params.firstCategoryId,
        isAscending: params.isAscending,
        pageSize: params.pageSize,
        saleModel: params.saleModel,
        searchKey: params.searchKey,
        sort: params.sort
      }
      reqUrl = `Product/ListLargeCargoProduct`
    } else {
      paramsData = {//临期
        addressId: params.addressId,
        currentPage: params.currentPage,
        pageSize: params.pageSize,
        data: {
          brandIds: params.brandIds,
          categoryId: params.categoryId,
          firstCategoryId: params.firstCategoryId,
          isAscending: params.isAscending,
          saleModel: params.saleModel,
          searchKey: params.searchKey,
          sort: params.sort
        }
      }
      reqUrl = `Product/ListNearExpireProduct`
    }
    return this.postRequest(reqUrl, {
      data: paramsData,
    })
  }
  //获取大宗 临期类目
  ListLargeCargoCategory(params) {
    let reqUrl = '';
    let paramsData = {
      data: {
        searchKey: params.searchKey,
        searchSource: params.searchSource
      }
    }
    if (params.bulk == 1) {
      reqUrl = `ProductCategory/ListLargeCargoCategory`
    } else {
      reqUrl = `ProductCategory/ListNearExpireCategory`
    }
    return this.postRequest(reqUrl, {
      data: paramsData,
    })
  }
  //获取大宗 临期品牌
  ListLargeCargoBrands(params) {
    let reqUrl = '';
    let paramsData = {
      data: {
        brandIds: params.brandIds,
        categoryIds: params.categoryId,
        firstCategoryId: params.firstCategoryId,
        saleModel: params.saleModel,
        searchKey: params.searchKey,
        searchSource: params.searchSource
      }
    }
    if (params.bulk == 1) {
      reqUrl = `Brand/ListLargeCargoBrands`
    } else {
      reqUrl = `Brand/ListNearExpireBrand`
    }
    return this.postRequest(reqUrl, {
      data: paramsData,
    })
  }
  //获取大宗 临期商品详情
  getLargeCargoProductDetail(params) {
    let reqUrl = '';
    if (params.bulk == 1) {
      reqUrl = `Product/GetLargeCargoProductDetail`
    } else {
      reqUrl = 'Product/NearExpireProductDetail'
    }
    return this.postRequest(reqUrl, {
      data: params,
    })
  }
  //获取独家包销商品详情
  getUnderwritingProductDetail(params) {
    return this.postRequest(`Underwriting/ProductDetail`, {
      data: params,
    })
  }
  //获取产品详情
  getProductDetail(params) {
    return this.postRequest(`Product/GetProductDetail`, {
      data: params,
    })
  }
  //可用优惠券产品列表
  getListCanUseCoupon(params) {
    return this.postRequest(`Product/ListCanUseCoupon`, {
      data: params,
    })
  }
  //获取分享产品详情
  getShareProductDetail(params) {
    return this.postRequest(`Product/ShareProductDetail`, {
      data: params,
    })
  }
  //获取凑单黑名单商品
  getBlackProductList(params) {
    return this.postRequest(`GatherOrder/QueryBlackProductSkuList`, {
      data: params,
    })
  }
  //批量新增购物车
  addShopCartList(params) {
    return this.postRequest(`ShopCar/AddShopCartList`, {
      data: params,
    })
  }
  //获取类目列表
  listCategory(params) {
    return this.postRequest(`ProductCategory/ListCategory`, {
      data: params,
    })
  }
  //获取产品搜索类目列表
  listSearchCategory(params) {
    return this.postRequest(`ProductCategory/ListSearchCategory`, {
      data: params,
    })
  }
  //新增到货通知
  saveArrivalNotice(params) {
    return this.postRequest(`ProductNotify/SaveArrivalNotice`, {
      data: params,
    })
  }
  //商品列表查询
  queryProductList(params) {
    return this.postRequest(`Product/QueryProductList`, {
      data: params,
    })
  }
  //凑单查询
  queryGatherProductList(params) {
    return this.postRequest(`GatherOrder/SearchProductList`, {
      data: params,
    })
  }
  //满减查询
  queryFullReduceProductList(params) {
    return this.postRequest(`Product/ListFullReduceProduct`, {
      data: params,
    })
  }
  //特价处理经销商
  querydelearSaleList(params) {
    return this.postRequest(`Product/ListShopNearExpire`, {
      data: params,
    })
  }
  //获取商品品牌列表
  queryProductBrands(params) {
    return this.postRequest(`Brand/QueryProductBrands`, {
      data: params,
    })
  }
  //获取订单列表
  queryOrders(params) {
    return this.postRequest(`Order/QueryOrders`, {
      data: params,
    })
  }
  //取消订单
  cancelOrder(params) {
    return this.postRequest(`Order/CancelOrder`, {
      data: params,
    })
  }
  //删除订单
  deleteOrder(params) {
    return this.postRequest(`Order/DeleteOrder`, {
      data: params,
    })
  }
  //删除退货订单
  deleteReturnOrder(params) {
    return this.postRequest(`ReturnOrder/DeleteOrder`, {
      data: params,
    })
  }
  //获取订单详情
  getOrderDetail(params) {
    return this.postRequest(`Order/GetOrderDetail`, {
      data: params,
    })
  }
  //获取拼团订单详情
  getGroupBuyOrderDetail(params) {
    return this.postRequest(`GroupPurchaseOrder/Detail`, {
      data: params,
    })
  }
  //订单评价
  orderValuation(params) {
    params.formSubmit = true;
    return this.postRequest(`Evaluation/Add`, {
      data: params,
    })
  }
  //评价订单详情
  valuationDetail(params) {
    return this.postRequest('Evaluation/DetailByOrderNo', {
      data: params,
    })
  }
  //获取消息列表
  getMessageList(params) {
    return this.postRequest(`Message/List`, {
      data: params,
    })
  }
  //获取活动列表
  queryActivitys(params) {
    return this.postRequest(`Promotion/ListPromotion`, {
      data: params,
    })
  }
  //活动进行中列表
  listOnline(params) {
    return this.postRequest(`Promotion/ListOnline`, {
      data: params,
    })
  }
  //赚钱精选商品列表
  queryProposeProducts(params) {
    return this.postRequest(`HomeProduct/QueryProposeProducts`, {
      data: params,
    })
  }
  //获取购物车统计信息
  getShopCartCount(params) {
    return this.postRequest(`ShopCar/GetShopCartCount`, {
      data: params,
    })
  }
  //获取购物车列表
  getShopCartList(params) {
    return this.postRequest(`ShopCart/List`, {
      data: params,
    })
  }
  //批量删除购物车
  removeShopCart(params) {
    return this.postRequest(`ShopCar/RemoveShopCart`, {
      data: params,
    })
  }
  //更新购物车
  updateShopCart(params) {
    return this.postRequest(`ShopCar/UpdateShopCart`, {
      data: params,
    })
  }
  //订单预查询 
  prepareOrder(params) {
    return this.postRequest(`OrderSubmit/PrepareOrder`, {
      data: params,
    })
  }
  //订单提交
  orderSubmit(params) {
    return this.postRequest(`OrderSubmit/Submit`, {
      data: params,
    })
  }
  //订单轮询
  orderPolling(params) {
    return this.postRequest(`OrderSubmit/PollingOrder`, {
      data: params,
    })
  }
  //微信支付轮询
  onlinePayPolling(params) {
    return this.postRequest(`Pay/Polling`, {
      data: params,
    })
  }
  //转换订单支付方式
  changeOrderPayType(params) {
    return this.postRequest(`Order/ChangeOrderPayType`, {
      data: params,
    })
  }
  //微信小程序支付
  weChatAppPay(params) {
    return this.postRequest(`Pay/WeChatAppPay`, {
      data: params,
    })
  }
  //获取赠品券赠品列表
  queryGiftProducts(params) {
    return this.postRequest(`Coupon/QueryGiftProducts`, {
      data: params,
    })
  }
  //获取优惠码详情
  getCouponCodeDetail(params) {
    return this.postRequest(`CouponCode/Detail`, {
      data: params,
    })
  }
  //获取可换货订单列表
  getCanSwapOrders(params) {
    return this.postRequest(`Order/ListCanSwapOrder`, {
      data: params,
    })
  }
  //查询退货单列表
  queryReturnOrders(params) {
    return this.postRequest(`ReturnOrder/QueryReturnOrders`, {
      data: params,
    })
  }
  //获取退货单详情
  getReturnOrderDetail(params) {
    return this.postRequest(`ReturnOrder/GetReturnOrderDetail`, {
      data: params,
    })
  }
  //查询换货单列表
  querySwapOrders(params) {
    return this.postRequest(`SwapOrder/List`, {
      data: params,
    })
  }
  //获取换货单详情
  getSwapOrderDetail(params) {
    return this.postRequest(`SwapOrder/Detail`, {
      data: params,
    })
  }
  //获取退换货总数量
  getOrderCount(params) {
    return this.postRequest(`User/GetUserInfoCount`, {
      data: params,
    })
  }
  //获取城市下仓库列表(自提)
  queryWarehouseList(params) {
    return this.postRequest(`Warehouse/QueryWarehouseList`, {
      data: params,
    })
  }
  //获取收藏店铺列表
  getFavoriteDealerShopList(params) {
    return this.postRequest(`Shop/ListFavoriteShop`, {
      data: params,
    })
  }
  //获取店铺列表
  getDealerShopList(params) {
    return this.postRequest(`Shop/ListShop`, {
      data: params,
    })
  }
  //获取店铺详情
  getDealerShopDetail(params) {
    return this.postRequest(`Shop/GetShopDetail`, {
      data: params,
    })
  }
  //收藏店铺
  favoriteDealerShop(params) {
    return this.postRequest(`Shop/Favorite`, {
      data: params,
    })
  }
  //取消收藏店铺
  unfavoriteDealerShop(params) {
    return this.postRequest(`Shop/UnFavorite`, {
      data: params,
    })
  }
  //获取店铺内优惠券领取活动
  listShopCouponReceive(params) {
    return this.postRequest(`CouponReceive/ListShopCouponReceive`, {
      data: params,
    })
  }
  //获取店铺内优惠券
  receiveCoupon(params) {
    return this.postRequest(`CouponReceive/ReceiveCoupon`, {
      data: params,
    })
  }
  //获取店铺内产品列表
  getDealerShopProducts(params) {
    return this.postRequest(`ShopProduct/ListProduct`, {
      data: params,
    })
  }
  //申请购买
  applyBuyProduct(params) {
    return this.postRequest(`ShopProduct/ApplyBuyProduct`, {
      data: params,
    })
  }
  //取消退货
  cancelReturnOrder(params) {
    return this.postRequest(`ReturnOrder/CancelReturnOrder`, {
      data: params,
    })
  }
  //新增退货单
  addReturnOrder(params) {
    return this.postRequest(`ReturnOrder/AddReturnOrder`, {
      data: params,
    })
  }
  //获取订单流转信息
  getOrderTraceList(params) {
    let url = '';
    if (params.types == 1) {
      url = 'ReturnOrder/GeOrderTraceList' //获取退货订单 物流
    } else {
      url = 'Order/GeOrderTraceList' //获取普通订单 物流
    }
    return this.postRequest(url, {
      data: params,
    })
  }
  //获取用户红包列表
  myBonusDetail(params) {
    return this.postRequest(`Bonus/QueryUserBonus`, {
      data: params,
    })
  }
  //酒币详情
  myCoinDetail(params) {
    return this.postRequest(`User/QueryWineScoreDetails`, {
      data: params,
    })
  }
  //获取优惠券列表
  myCoupon(params) { 
    return this.postRequest(`Coupon/ListUserCoupon`, {
      data: params,
    })
  }
  //获取优惠券统计数量
  couponNum(params) {
    return this.postRequest(`Coupon/GetCouponCount`, {
      data: params,
    })
  }
  //零头结余详情
  myOddBalance(params) {
    return this.postRequest(`User/QueryOddBalanceList`, {
      data: params,
    })
  }
  //获取兑奖申请列表
  awardOrderList(params) {
    return this.postRequest(`AwardOrder/List`, {
      data: params,
    })
  }
  //新增兑奖申请
  addApply(params) {
    return this.postRequest(`AwardOrder/Add`, {
      data: params,
    })
  }
  //修改兑奖申请
  changeNumber(params) {
    return this.postRequest(`AwardOrder/Modify`, {
      data: params,
    })
  }
  //取消申请
  cancelApply(params) {
    return this.postRequest(`AwardOrder/Cancel`, {
      data: params,
    })
  }
  //删除申请
  deleteApply(params) {
    return this.postRequest(`AwardOrder/Delete`, {
      data: params
    })
  }
  //兑奖申请详情
  applyDetail(params) {
    return this.postRequest(`AwardOrder/GetDetail`, {
      data: params
    })
  }
  //获取收藏列表
  queryUserFavorites(params) {
    return this.postRequest(`User/QueryUserFavorites`, {
      data: params
    })
  }
  //添加收藏
  addUserFavorites(params) {
    return this.postRequest(`UserFavorite/Add`, {
      data: params
    })
  }
  //取消收藏
  removeUserFavorites(params) {
    return this.postRequest(`UserFavorite/Remove`, {
      data: params
    })
  }
  //修改密码
  changePassword(params) {
    return this.postRequest(`UserInfo/ChangePassword`, {
      data: params
    })
  }
  //获取用户的收货地址
  getReceiveAddressList(params) {
    return this.postRequest(`Address/List`, {
      data: params,
    })
  }
  //设置默认地址
  setAddressDefault(params) {
    return this.postRequest(`UserAddress/SetDefaultAddress`, {
      data: params,
    })
  }
  //修改地址
  editAddress(params) {
    return this.postRequest(`Address/Edit`, {
      data: params,
    })
  }
  //新增地址
  addAddress(params) {
    return this.postRequest(`Address/Add`, {
      data: params,
    })
  }
  //新增地址(无需审核)
  addAddressWithoutAudit(params) {
    return this.postRequest(`Address/AddEnable`, {
      data: params,
    })
  }
  //删除地址
  deleteAddress(params) {
    return this.postRequest(`UserAddress/DeleteAddress`, {
      data: params,
    })
  }
  //获取酒批城市数据
  getCityList() {
    return this.postRequest(`City/ListCity`)
  }
  //获取区域街道信息
  getStreetList(province, city) {
    return this.postRequest(`City/ListStreet`, {
      data: {
        data: {
          city: city,
          province: province
        }
      }
    })
  }
  //获取投诉建议列表
  getComplaintsList(currentPage, pageSize) {
    return this.postRequest(`Complaint/List`, {
      data: {
        currentPage,
        pageSize
      }
    })
  }
  //获取投诉类型
  queryComplaintType() {
    return this.postRequest(`Complaint/ListComplaintType`)
  }
  //获取可投诉订单
  queryComplaintOrders(currentPage, pageSize) {
    return this.postRequest(`Order/ListComplaintOrder`, {
      data: {
        currentPage,
        pageSize
      }
    })
  }
  //新增投诉建议
  addComplaint(params) {
    return this.postRequest(`Complaint/Add`, {
      data: {
        complaintContent: params.complaintContent,
        complaintType: params.complaintType,
        linkman: params.linkman,
        orderNo: params.orderNo || '',
        telephoneNo: params.telephoneNo,
        formSubmit: true
      }
    })
  }
  //获取投诉详情
  getComplaintDetail(id) {
    return this.postRequest(`Complaint/Detail`, {
      data: {
        data: id
      }
    })
  }
  //获取投诉理由
  getReasons() {
    return this.postRequest(`Complaint/DissatisfactionReason`)
  }
  //投诉结果评价
  evaluateComplaint(params) {
    return this.postRequest(`Complaint/Evaluate`, {
      data: {
        data: {
          complaintId: params.complaintId,
          dissatisfactionReason: params.dissatisfactionReason,
          remark: params.remark || '',
          serviceEvaluate: params.serviceEvaluate
        }
      }
    })
  }
  //找货列表
  queryFindGoodsList(currentPage, pageSize) {
    return this.postRequest(`FindGoods/List`, {
      data: {
        currentPage,
        pageSize
      }
    })
  }
  //找货详情
  queryFindGoodsDetail(findGoodsId) {
    return this.postRequest(`FindGoods/Detail`, {
      data: {
        data: findGoodsId
      }
    })
  }
  //新增找货
  addFindGoods(params) {
    return this.postRequest(`FindGoods/Add`, {
      data: {
        findGoodsRemarks: params.findGoodsRemarks,
        productName: params.productName,
        formSubmit: true
      }

    })
  }
  //新增投诉建议upload上传文件接口
  uploadFile(url, params = {}, urlPath) {
    let formData = {
      deviceType: 5,
      addressId: getApp().globalData.addressId
    }
    Object.assign(formData, params)
    return new Promise(function (resolve, reject) {
      wx.uploadFile({
        url: url,
        filePath: urlPath || '',
        name: "file",
        header: {
          "token": wx.getStorageSync(`token`) || '',
          "Content-Type": "multipart/form-data"
        },
        formData: formData,
        success(data) {
          data.data = JSON.parse(data.data)
          resolve(data)
        },
        fail(data) {
          data.data = JSON.parse(data.data)
          reject(data)
        }
      })
    })
  }
  //获取我的包销列表（合约列表）
  myUnderwriteListContract(params) {
    return this.postRequest(`ProductUnderwriting/ListContract`, {
      data: params,
    })
  }
  //获取包销产品列表
  getUnderwriteList(params) {
    return this.postRequest(`ProductUnderwriting/ListProduct`, {
      data: params,
    })
  }
  //获取包销品牌列表
  getUnderwriteBrand(params) {
    return this.postRequest(`Brand/ListUnderwritingBrand`, {
      data: params,
    })
  }
  //获取包销类目列表
  getUnderwriteCategory(params) {
    return this.postRequest(`ProductCategory/ListUnderwriting`, {
      data: params,
    })
  }
  //获取关注的包销产品列表
  getUnderwriteFavorite(params) {
    return this.postRequest(`ProductUnderwriting/ListFavoriteProduct`, {
      data: params,
    })
  }
  //申请独家包销产品
  applyUnderwrite(params) {
    return this.postRequest(`ProductUnderwriting/Apply`, {
      data: params,
    })
  }
  //获取用户签到配置信息
  getSignInDetail(params) {
    return this.postRequest(`SignIn/GetSignInDetail`, {
      data: params,
    })
  }
  //获取再次购买商品
  getBuyAgainList(orderNO) {
    return this.postRequest(`Order/ListOrderProduct`, {
      data: {
        orderNO
      }
    })
  }
  //获取字典配置信息
  getDictionary(params) {
    return this.postRequest(`Setting/GetDictionaryValue`, {
      data: params
    })
  }
  //通过配置代码获取配置字典
  getSwapDicectionary(params) {
    //接口描述 换货原因：SwapOrderReason，取消换货原因：CancelSwapOrderReason
    return this.postRequest(`Setting/ListDictionary`, {
      data: {
        datas: params
      }
    })
  }
  //提交换货单
  submitSwapOrder(params) {
    return this.postRequest('SwapOrder/Submit', {
      data: params
    })
  }
  //获取常购清单产品列表
  getAlwaysBuyList(params) {
    return this.postRequest(`UserProduct/ListAlwaysBuyProduct`, {
      data: params,
    })
  }
  //获取订单最低起送金额
  getOrderMinBuyAmount(params) {
    return this.postRequest(`Order/GetMinDeliveryAmount`, {
      data: params,
    })
  }
  //获取团购活动列表
  getGroupPurchaseList(params) {
    return this.postRequest('GroupPurchase/List', {
      data: params
    })
  }
  //获取团购活动详情
  getGroupPurchaseDetail(params) {
    return this.postRequest('GroupPurchase/Detail', {
      data: params
    })
  }
  //获取分享团购活动详情
  getShareGroupPurchaseDetail(params) {
    return this.postRequest('GroupPurchase/ShareDetail', {

      data: params
    })
  }
  //获取拼团订单列表
  getGroupBuyList(params) {
    return this.postRequest(`GroupPurchaseOrder/List`, {
      data: params
    })
  }
  //获取二级主页类目信息
  getSecondPageCategory(params) {
    return this.postRequest('ProductCategory/SecondPageCategory', {
      data: params
    })
  }
  //获取二级主页广告
  getSecondHomeBanner(params) {
    return this.postRequest('HomePage/ListSecondHomeBanner', {
      data: params
    })
  }
  //获取子类目列表
  getListSonCategory(params) {
    return this.postRequest('ProductCategory/ListSonCategory', {
      data: params
    })
  }
  //获取退货原因
  getReturnOrderReasons(params) {
    return this.postRequest('Setting/GetReturnOrderReasons', {
      data: params
    })
  }
  //获取首页弹窗信息
  getGainPopupInfo(params) {
    return this.postRequest('Popup/GainPopupInfo', {
      data: params
    })
  }
  //获取配送弹窗详情
  getDeliveryPopupInfo(params) {
    return this.postRequest('Popup/DeliveryPopup', {
      data: params
    })
  }  
  //获取订单优惠券领取活动列表
  getorderCoupons(params) {
    return this.postRequest('CouponReceive/ListOrderCouponReceive', {
      data: params
    })
  }
  //领取订单优惠券
  receiveOrderCoupon(params) {
    return this.postRequest('CouponReceive/ReceiveOrderCoupon', {
      data: params
    })
  }
  //新版为您推荐 
  ListProductRecommend(params){
    return this.postRequest('UserProduct/ListProductRecommend', {
      data: params
    })
  }
  //获取可使用优惠券的商品
  getCouponGoods(params) {
    return this.postRequest('Coupon/QueryUseCouponProducts', {
      data: params
    })
  }
  //获取活动列表
  getActivityLists(params){
    return this.postRequest('Activity/QueryActivitys', {
      data: params
    })
  }
  //获取推荐搜索关键字
  ListSearchKeyRecommend(params){
    return this.postRequest('Product/ListSearchKeyRecommend', {
      data: params
    })
  }
  //扫码产品条码
  onScanProduct(params) {
    return this.postRequest(`Myshelf/ScanBarCode`, {
      data: params
    })
  }
  //上传图片
  uploadPic(params){
    return this.postRequest(`File/UploadFile`, {
      data: params
    })
  }
  //扫码添加无sku产品
  addOnScanProduct(params) {
    return this.postRequest(`Myshelf/AddNoskuProduct`, {
      data: params
    })
  }
//根据一批产品id查询产品详情
  listMyShelfProductByProductIds(params){
    return this.postRequest('Myshelf/listMyShelfProductByProductIds', {
      data: params
    })
  }
  //获取用户货架产品简要信息      Myshelf/listMyProductBrief
  listMyProductBrief(params){
	  return this.postRequest('Myshelf/listMyProductBrief', {
	      data: params
	  }) 
  }
  //获取文件上传授权信息
  FileAuthorization(params) {
    return this.postRequest('File/Authorization', {
      data: params
    })
  }
  //新增文章引流记录
  WeChatArticleAdd(params){
    return this.postRequest('WeChatArticle/Add', {
      data: params
    })
  }
}

export default HttpService