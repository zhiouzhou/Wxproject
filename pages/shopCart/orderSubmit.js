// pages/shopCart/orderSubmit.js
const App = getApp()
import { StringUtil, CouponCodeUtil, CouponSelectUtil, WxPayUtil, DateUtil, FunctionUtils } from '../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog } from '../../components/yjp.js'
let QQMapWX = require('./../../assets/plugins/wxSDK/qqmap-wx-jssdk.min.js')
let qqmapsdk
Page({
  data: {
    productList: [],//购买商品列表
    customGiftProducts: [],//合作商自定义赠品列表
    wareHouseList: [],//自提仓库列表
    userAddress: [],//用户收货地址列表
    useBonusIds: [],//使用的红包列表
    useCouponIds: [],//使用的优惠券列表
    selectCouponList: [],//已选的优惠券列表
    selectBonusList: [],//已选的优惠券列表
    couponReduceNotice: { reduceNum: 0, reduceStr: `` },//使用优惠券
    couponCodeDetail: {},//优惠码详情
    couponCodeCantUseReason: ``,//优惠码不能使用的原因
    bonusReduce: 0,//使用红包
    couponCode: ``,//优惠码
    hadAutoSelectCoupon: false,//是否已经自动选择过优惠券了
    couponCodeReduceAmount: 0,//优惠码优惠金额
    remark: ``,//防止多次预查询，保存remark
    currentWareHouse: undefined,//当前自提仓库
    currentAddress: undefined,//当前送货地址
    canSelfPickUp: false,//是否能够自提
    deliveryModeShowType: 0,//展示易久批配送和仓库自提(0),仅展示易久批配送(1),仅展示仓库自提(2)
    currentDeliveryMode: -1,//选中的配送方式,酒批配送(0),合作商配送(1),配送商配送(2),第三方配送(3),客户自提(4),总部物流(5),区域代配送(6),
    currentPayType: -1,//选中的支付方式,货到付款(0),微信支付(1),支付宝支付(2),银联支付(3),连连支付(5),易酒贷(6),已在线支付(10),线下转账(11),经销商收款(12),
    couponGiftCount: 0,//赠品券的赠品数量
    needCheckAddress: false,//是否需要校正地址
    currentLocation: null,//当前定位的地址
    isSuggestAddress: false,
    initing: true,
    underwriteTipShow: true
  },
  onLoad: function (options) {

    wx.showLoading({ title: '加载中' })
    //产品相关
    let productList = []
    //传过来的商品必须放在数组里面，必需的属性有buyCount,productSaleSpecId,productSkuId,sourceId
    //包含特殊符号，这里需要转码
    if (options.needdecodeURI) {
      productList = JSON.parse(decodeURIComponent(options.productList))
    } else {
      productList = JSON.parse(options.productList)
    }
    //优惠码，需要计算数量，防止为空
    for (let product of productList) {
      //马上进货组件加减框没有buycount属性
      product.buyNum = product.buyNum || product.buyCount
      product.buyCount = product.buyNum
      if (product.imgsUrl && product.imgsUrl.length==0){
        product.imgsUrl[0] ='/assets/images/defaul_product.png'
      }
    }
    const LargeCargoOrderTitle = App.globalData.settingValue.LargeCargoOrderTitle || "充值特价订单"
    const UnderwritingOrderSubmitDesc = App.globalData.settingValue.UnderwritingOrderSubmitDesc || `本品为总仓发货产品，必须线上支付，且下单后不能取消`
    const isLargeCargo = options.cartType == `1`
    const fromShoppingCar = options.fromShoppingCar == `true`
    const canBackShopCart = options.canBackShopCart == `true`
    const istemporary = options.cartType == `0`
    const isSup = productList[0].saleMode == 2
    const isDealer = productList[0].saleMode == 6
    const isGroupBuy = options.isGroupBuy == `true`
    const isUnderwrite = options.isUnderwrite == `true`
    //隐藏优惠码
    const isCouponCodeValid = productList.some(item => item.productType != 4 && item.productType != 2) && !istemporary && !isDealer && !isLargeCargo && !isGroupBuy
    //是否通过自提下单进来的
    const isSelfPickUp = options.isSelfPickUp == `true`
    const groupPurchaseId = options.grouponGroupId||``
    const oddBalanceMode = App.globalData.appSetting.oddBalanceMode || 0

    this.setData({
      productList, fromShoppingCar, canBackShopCart, isLargeCargo, istemporary, isSup, isDealer, isGroupBuy, oddBalanceMode, isCouponCodeValid, LargeCargoOrderTitle, isUnderwrite, UnderwritingOrderSubmitDesc, groupPurchaseId
    })
    this.getAddressInfo(isSelfPickUp)
    this.getPrepareParams()
    this.prepareOrder()
  },
  //是否需要校正地址
  isNeedCheckAddress(currentAddress) {
    //是否全局配置可以校正
    let globalNeedCheckAddress = App.globalData.appSetting.addressNeedCheck
    //是否当前选中的收货地址能够校正
    let currentAddressNeedCheck = currentAddress.needCheck
    if (!globalNeedCheckAddress || !currentAddressNeedCheck) {
      this.setData({ needCheckAddress: false, currentLocation: null })
      return
    }
    if (!qqmapsdk) {
      qqmapsdk = new QQMapWX({
        key: App.Constants.TencentMapKey
      })
    }
    App.WxService.getLocation()
      .then(data => {
        let obj = {
          location: {
            latitude: data.latitude,
            longitude: data.longitude
          }
        }
        return new Promise((resolve, reject) => {
          obj.success = (res) => resolve(res)
          obj.fail = (res) => reject(res)
          qqmapsdk.reverseGeocoder(obj)
        })
      })
      .then((currentLocation) => {
        //定位的地址的省市区和当前选中的收货地址是否一致
        let isSameArea =
          currentLocation.result.address_component.province == currentAddress.province &&
          currentLocation.result.address_component.city == currentAddress.city &&
          currentLocation.result.address_component.district == currentAddress.county

        //是否需要校正地址,如果有建议地址，则初始化为建议地址
        let needCheckAddress = isSameArea && globalNeedCheckAddress && currentAddressNeedCheck
        this.setData({ needCheckAddress, isSuggestAddress: needCheckAddress, currentLocation: needCheckAddress ? currentLocation.result : null })
      })
      .catch(e => this.setData({ needCheckAddress: false, currentLocation: null }))
  },
  //编辑建议地址
  onEditSuggestAddress() {
    let { currentLocation, currentAddress } = this.data
    App.WxService.navigateTo(App.Constants.Route.addUserAddress, { currentLocation, currentAddress, source: `orderSubmit` })
  },
  //切换初始地址和建议地址
  onSwitchSuggestAddress(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({ isSuggestAddress: tag == `suggestAddress` })
  },
  //添加商品后重新预查询
  onAddProduct(products, source) {
    let { productList, couponCodeDetail } = this.data
    for (let newProduct of products) {
      newProduct.buyCount = newProduct.buyNum
      let productIndex = productList.findIndex(item => item.productSkuId == newProduct.productSkuId && item.sourceId == newProduct.sourceId)
      if (productIndex != -1) {
        productList[productIndex].buyCount += newProduct.buyCount
        productList[productIndex].buyNum = productList[productIndex].buyCount
      }
      else { productList.push(newProduct) }
    }
    //这里如果是优惠券添加商品，要再走一遍自动选券逻辑
    this.setData({ productList, hadAutoSelectCoupon: source != `coupon` }, () => {
      if (source == `coupon`) {
        this.getPrepareParams()
        this.prepareOrder()
      } else if (source == `couponCode`) {
        //回来以后刷新优惠码下面的提示
        this.processCouponCodeDetail(couponCodeDetail)
      }
    })
  },
  //地址自提相关信息
  getAddressInfo(isSelfPickUp = false) {
    this.getWareHouseList()
    let userAddress = wx.getStorageSync(`userAddress`) || []
    let userState = wx.getStorageSync(`userDetail`).state
    //待审核用户能进入此页面证明开通了开放注册，待审核地址也可以选
    userAddress = userAddress.filter(item => userState == 0 ? (item.state == 0 || item.state == 1) : (item.state == 1))
    //没有可用地址的话就返回上一页
    if (!userAddress.length) {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        dialogData: { text: `您还没有可以下单的地址` },
        canDismiss: false, hiddenCancel: true,
        onConfirm: () => {
          App.WxService.navigateBack()
        }
      })
      return
    }
    let currentAddress = userAddress.find(item => item.addressId == App.globalData.addressId)
    //防止用户没有默认地址
    if (currentAddress == undefined) { currentAddress = userAddress[0] }
    //能否自提
    let canSelfPickUp = this.getCanSelfPickUp(currentAddress)
    this.setData({ userAddress, currentAddress, canSelfPickUp, currentDeliveryMode: canSelfPickUp && isSelfPickUp ? 4 : 0 })
    //校正地址
    this.isNeedCheckAddress(currentAddress)
    this.getDeliveryModeShowType(currentAddress)
  },
  //获取订单预查询参数
  getPrepareParams() {
    let orders = []//订单数组
    let itemList = []//订单项数组
    let { productList, isLargeCargo, isSup, isDealer, isGroupBuy, couponCode, istemporary, isUnderwrite, groupPurchaseId } = this.data
    if (isSup) {
      //合作商需要拆单
      orders = this.getSupPrepareParams(productList)
    } else if (isDealer) {
      //经销商一次只能有一家提交
      for (let product of productList) {
        let itemObj = {
          buyCount: product.buyCount,
          productSaleSpecId: product.productSaleSpecId || ``,
          productSkuId: product.productSkuId || ``,
          sourceId: product.sourceId || ``,
          sourceType: 0, // 普通商品(0), 产品满赠(1), 订单满赠(2), 订单加价购(3), 限时惠(4), 组合活动商品(5), 优惠券赠送商品(6), 凑单商品(7), 预售商品(8), 团购商品(9), 大宗商品(10);
        }
        itemList.push(itemObj)
      }
      let order = {
        companyId: productList[0].companyId,
        classify: 0,//	普通(0),限时惠(1),预售(2),团购(3),
        itemList: itemList,
        orderType: 2//	酒批订单(0), 合作商订单(1),入驻商订单(2)
      }
      orders.push(order)
    } else if (isUnderwrite) {
      //独家包销产品
      for (let product of productList) {
        let itemObj = {
          buyCount: product.buyCount,
          productSaleSpecId: product.productSaleSpecId || product.productSkuId,
          productSkuId: product.productSkuId || ``,
          sourceId: product.sourceId || product.productSkuId,
          sourceType: product.sourceType == 16 ? 16 : product.sourceType == 8 ? 8 : 16,
        }
        itemList.push(itemObj)
      }
      let order = {
        companyId: productList[0].companyId,
        classify: 0,//	普通(0),限时惠(1),预售(2),团购(3),
        itemList: itemList,
        couponCodes: couponCode ? [couponCode] : [],
        orderType: 0//	酒批订单(0), 合作商订单(1),入驻商订单(2)
      }
      orders.push(order)
    } else {
      //酒批订单
      //全预售商品
      let allPresaleOrder = productList.every(item => item.stockState == 4)
      //全限时惠商品
      let allTimeLimitOrder = productList.every(item => item.productType == 4)
      for (let product of productList) {
        let itemObj = {
          buyCount: product.buyCount,
          productSaleSpecId: product.productSaleSpecId || ``,
          productSkuId: product.productSkuId || ``,
          sourceId: product.sourceId || product.productSkuId,//组合商品无sourceId
          sourceType: isLargeCargo ? 10 : product.stockState == 4 || product.saleMode == 8 ? 8 :
            product.enjoyPromotions && product.enjoyPromotions.length && product.enjoyPromotions[0].promotionType == 4 ? 4 :
              product.enjoyPromotions && product.enjoyPromotions.length && product.enjoyPromotions[0].promotionType == 5 ? 5 : 0,
        }
        //团购
        if (isGroupBuy) {
          itemObj.sourceType = 9
          itemObj.sourceId = product.promotionId
        }
        //临期
        if (istemporary) {
          itemObj.sourceType = 14
          itemObj.sourceId = product.nearExpireId || product.sourceId
        }
        itemList.push(itemObj)
      }
      let order = {
        classify: isGroupBuy ? 3 : allPresaleOrder ? 2 : allTimeLimitOrder ? 1 : 0,//	普通(0),限时惠(1),预售(2),团购(3),
        itemList: itemList,
        couponCodes: couponCode ? [couponCode] : [],
        orderType: 0//	酒批订单(0), 合作商订单(1),入驻商订单(2)
      }
      if (isGroupBuy) {
        order.grouponGroupId = groupPurchaseId
      }
      orders.push(order)
    }
    this.setData({ PrepareParams: { datas: orders } })
  },
  //获取合作商预查询参数
  getSupPrepareParams(productList) {
    let orders = []//订单数组
    let map = {}
    //按合作商分组，存入map，合作商companyId为键，产品数组为值
    for (let product of productList) {
      if (!map[product.companyId]) {
        map[product.companyId] = [product]
      } else {
        map[product.companyId].push(product)
      }
    }
    for (let key in map) {
      let itemList = []//订单项数组
      //每个合作商一个订单
      for (let product of map[key]) {
        let itemObj = {
          buyCount: product.buyCount,
          productSaleSpecId: product.productSaleSpecId || ``,
          productSkuId: product.productSkuId || ``,
          sourceId: product.sourceId || ``,
          sourceType: 0, // 普通商品(0), 产品满赠(1), 订单满赠(2), 订单加价购(3), 限时惠(4), 组合活动商品(5), 优惠券赠送商品(6), 凑单商品(7), 预售商品(8), 团购商品(9), 大宗商品(10);
        }
        itemList.push(itemObj)
      }
      let order = {
        classify: 0,//	普通(0),限时惠(1),预售(2),团购(3),
        companyId: key,
        itemList: itemList,
        orderType: 1//	酒批订单(0), 合作商订单(1),入驻商订单(2)
      }
      orders.push(order)
    }
    return orders
  },
  //订单预查询
  prepareOrder() {
    let that = this
    let param = that.data.PrepareParams
    // FunctionUtils.bindNomalTalkingDataEvent("订单预查询情况分析", {})
    param.deviceType = 5
    param.addressId = App.globalData.addressId
    wx.request({
      url: wx.getStorageSync(`businessUrl`) + `OrderSubmit/PrepareOrder`,
      data: param,
      header: { token: wx.getStorageSync(`token`), chartset: `utf-8` },
      method: `POST`,
      success(res) {
        if (res.data.success) {
          that.setData({ orders: that.reuildOrders(res.data.data) })

          //自动选券只执行一次，使用优惠码会导致多次预查询,大宗以及临期,不用执行
          if (!that.data.hadAutoSelectCoupon && !that.data.isSup && !that.data.isLargeCargo && !that.data.istemporary && !that.data.isGroupBuy) {
            that.autoSelectCoupons()
          }
          that.reCalcPrice(that.data.currentPayType)
          that.setData({ initing: false })
        } else {
          $yjpDialog.open({
            dialogType: `defaultText`,
            title: `温馨提示`,
            dialogData: { text: res.data.desc },
            canDismiss: false, hiddenCancel: true,
            confirmText: `返回上一页`,
            onConfirm: () => App.WxService.navigateBack()
          })
        }
      },
      fail() {
        $yjpDialog.open({
          dialogType: `defaultText`,
          title: `温馨提示`,
          dialogData: { text: `网络错误，请重试` },
          canDismiss: false, hiddenCancel: true,
          confirmText: `返回上一页`,
          onConfirm: () => App.WxService.navigateBack()
        })
      },
      complete() {
        wx.hideLoading()
      }
    })
    // return App.HttpService.prepareOrder(this.data.PrepareParams)
    //   .then(data => {
    //     this.setData({ orders: this.reuildOrders(data.data) })
    //     this.autoSelectCoupons()
    //     this.reCalcPrice()
    //     this.setData({ initing: false })
    //     wx.hideLoading()
    //   })
    //   .catch(e => {
    // wx.hideLoading()
    // $yjpDialog.open({
    //   dialogType: `defaultText`,
    //   title: `温馨提示`,
    //   dialogData: { text: res.data.desc },
    //   canDismiss: false, hiddenCancel: true,
    //   confirmText: `返回上一页`,
    //   onConfirm: () => App.WxService.navigateBack()
    // })
    //   })
  },
  //处理预查询返回的订单
  reuildOrders(orders) {
    let { isSup, isDealer, productList } = this.data
    if (!orders || !orders.length) {
      return []
    } else if (isSup) {
      return this.processSupPrepareOrders(orders)
    } else {
      return this.processJiupiPrepareOrders(orders)
    }
  },
  //处理合作商预查询订单
  processSupPrepareOrders(orders) {
    let { productList } = this.data
    let totalCount = 0
    let supTotalPayableAmount = 0
    for (let order of orders) {
      //把产品的原始数据放到分别放到相应的order里面
      order.orderProductList = []
      order.totalCount = 0
      order.giftTotalCount = 0
      for (let item of productList) {
        if (item.companyId == order.companyId) {
          order.orderProductList.push(item)
          order.totalCount += item.buyCount
        }
      }
      //处理合作商的赠品，分为普通赠品和自定义赠品，区分方式是自定义赠品没有skuId
      if (order.fullGiftProducts && order.fullGiftProducts.length) {
        order.customGiftProducts = []
        for (let gift of order.fullGiftProducts) {
          if (!gift.productSkuId) {
            order.customGiftProducts.push(gift)
          }
        }
        //从fullGiftProducts中移除自定义赠品
        order.fullGiftProducts = order.fullGiftProducts.filter(item => item.productSkuId != null && item.productSkuId != undefined && item.productSkuId != ``)
      }
      //单个订单赠品总数量
      for (let gift of order.fullGiftProducts) {
        order.giftTotalCount += gift.buyCount
      }
      //总数量
      for (let product of order.productItems) {
        totalCount += product.buyCount
      }
      //总金额
      supTotalPayableAmount += order.payableAmount
    }
    //设置预查询的总金额和总数量
    this.setData({ totalCount, supTotalPayableAmount })
    return orders
  },
  //处理酒批预查询订单
  processJiupiPrepareOrders(orders) {
    let { productList, remark, currentPayType } = this.data
    let order = orders[0]
    //原来传入的产品的原始数据
    order.orderProductList = productList
    order.totalCount = 0
    //总数量
    for (let product of productList) {
      order.totalCount += (product.productSkuId == product.productSaleSpecId ? product.buyCount : product.buyCount * product.saleSpecQuantity)
    }
    //赠品总数量
    order.giftTotalCount = 0
    for (let gift of order.fullGiftProducts) {
      order.giftTotalCount += gift.buyCount
    }
    order.payTypes = this.getPayType(order.payTypes)
    //获取保存的remark
    order.remark = remark
    //支付方式默认选择第一条，先取页面保存的值，为-1代表是第一次进，则取第一个  //设置底部栏的总数量
    this.setData({
      currentPayType: currentPayType = -1 ? order.payTypes[0] : currentPayType
      , totalCount: order.totalCount
    })
    return [order]
  },
  //处理支付方式
  getPayType(originalPayTypes) {
    // 只要是临期，大宗，独家报销，只能微信支付，如果是普通商品购买，后台返回了（余额，连连支付，微信支付）中的一种 我这边就显示微信支付，其他情况如果后台什么支付方式都没返回，我这边默认货到付款
    let { isUnderwrite, istemporary, isLargeCargo, isGroupBuy } = this.data
    if (isUnderwrite || istemporary || isLargeCargo || isGroupBuy) {
      return [1]
    } else {
      // 1 2 3 5 13为在线支付方式,统一处理为微信支付
      // let hasOnlinePay = originalPayTypes.findIndex(item => item == 1 || item == 2 || item == 3 || item == 5 || item == 13) != -1
      // 订单支付方式，先做一遍过滤
      originalPayTypes = originalPayTypes.filter(item => item == 0 || item == 11 || item == 12)
      // if (hasOnlinePay) { originalPayTypes.push(1) }
      // 过滤完之后没有支付方式，则手动加入一条货到付款的支付方式
      if (!originalPayTypes.length) {
        originalPayTypes.splice(0, 0, 0)
      }
      return originalPayTypes
    }
  },
  //添加赠品券赠品
  onAddCouponGift(coupon, isAutoSelect = false) {
    let { currentAddress, orders } = this.data
    let fullGiftProducts = orders[0].fullGiftProducts || []
    App.HttpService.queryGiftProducts({ addressId: currentAddress.addressId, templateId: coupon.couponTemplate.templateId })
      .then(data => {
        let couponGiftCount = 0
        //查询赠品券赠品成功返回数据且都有库存
        if (data.data && data.data.length
          && data.data.every(gift => gift.stockState != 3 && gift.stockState != 4)) {
          for (let gift of data.data) {
            gift.isFromCoupon = true
            gift.sourceDesc = `赠品来源于赠品券`
            gift.giftUnit = gift.saleUnit
            couponGiftCount += gift.buyCount
            //兼容赠品清单
            gift.productPrice = {}
            gift.productPrice.price = 0
            fullGiftProducts.push(gift)
          }
        } else {
          //没有查询到赠品券赠品相关数据
          this.giftCouponDialogShow(isAutoSelect)
        }
        this.setData({ [`orders[0].fullGiftProducts`]: fullGiftProducts, couponGiftCount })
      })
  },
  //赠品券库存不足提示
  giftCouponDialogShow(isAutoSelect = false) {
    if (!isAutoSelect) {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `提示`,
        dialogData: { text: `该赠品券赠品库存不足` },
        hiddenCancel: true,
      })
    }
    this.setData({ selectCouponList: [], couponReduceNotice: { reduceNum: 0, reduceStr: `` } })
  },
  //移除赠品券赠品
  onRemoveCouponGift() {
    let { orders } = this.data
    let fullGiftProducts = orders[0].fullGiftProducts || []
    fullGiftProducts = fullGiftProducts.filter(item => !item.isFromCoupon)
    this.setData({ [`orders[0].fullGiftProducts`]: fullGiftProducts, couponGiftCount: 0 })
  },
  //自动选择优惠券和提示下一张优惠券
  autoSelectCoupons() {
    /**
     * 1.有多组可用优惠券，正常流程
     * 2.没有可用通用券，但是有可用赠品券和打折券
     * 3.有多组不可用优惠券，所有抵用券不可用
     */
    let order = this.data.orders[0]
    let couponGroups = order.couponGroups || []
    let productList = order.productItems || []
    //将优惠券排序(排序先按大类型再按小类型再按金额排序)
    let sortCouponGroups = this.getSortedCoupons(couponGroups)
    //没有优惠券直接返回
    if (!sortCouponGroups.length) return
    //确定哪几张可以用
    let moreCouponNum = 0
    let selectCoupons = []
    // 先看有没有可选的可用优惠券
    if (sortCouponGroups[0].coupons.length != 0) {
      let firstCoupon = sortCouponGroups[0].coupons[0]
      //如果第一位的分组是打折券或者赠品券，则选择一张
      if (firstCoupon.couponTemplate.couponType == 1 || firstCoupon.couponTemplate.couponType == 2) {
        moreCouponNum = 1
        selectCoupons.push(firstCoupon)
      } else {
        //通用券可以选择多张,每选一张便更新一次选中优惠券数组
        for (let coupon of sortCouponGroups[0].coupons) {
          let selectResult = CouponSelectUtil.canSelectCoupon(productList, sortCouponGroups, coupon, selectCoupons)
          //该优惠券可以选中并且没有提示（浪费金额的提示）
          if (selectResult.success && !selectResult.desc) {
            moreCouponNum++
            selectCoupons.push(coupon)
          } else {
            break;
          }
        }
        //自动选券是抵用券且该分组下还有可用券未使用,提示下一张券,目前只考虑通用抵用券
        if (moreCouponNum < sortCouponGroups[0].coupons.length && sortCouponGroups[0].coupons[0].couponUseType == 2) {
          //还剩的数量为剩余的可用优惠券数量加上不可用的优惠券数量
          let couponRemainNum = sortCouponGroups[0].coupons.length - moreCouponNum + sortCouponGroups[0].unuseableCoupons.length
          this.onNoticeNextCoupon(productList, sortCouponGroups[0].coupons[moreCouponNum], selectCoupons, couponRemainNum)
        } else if (moreCouponNum >= sortCouponGroups[0].coupons.length && sortCouponGroups[0].unuseableCoupons.length != 0) {
          let couponRemainNum = sortCouponGroups[0].unuseableCoupons.length
          this.onNoticeNextCoupon(productList, sortCouponGroups[0].unuseableCoupons[0], selectCoupons, couponRemainNum)
        }
      }
      let couponReduceNotice = CouponSelectUtil.getSelectCouponReduce(selectCoupons, productList)
      this.setData({ couponReduceNotice, selectCouponList: selectCoupons, hadAutoSelectCoupon: true })
      if (selectCoupons[0].couponTemplate.couponType == 2) {
        this.onAddCouponGift(selectCoupons[0], true)
      }
    } else {
      //全部分组都为不可选且有不可用通用抵用券,目前只考虑通用抵用券
      if (sortCouponGroups[0].unuseableCoupons[0].couponTemplate.couponType == 0 && sortCouponGroups[0].unuseableCoupons[0].couponTemplate.couponUseType == 2) {
        this.onNoticeNextCoupon(productList, sortCouponGroups[0].unuseableCoupons[0], selectCoupons, sortCouponGroups[0].unuseableCoupons.length)
      }
      this.setData({ hadAutoSelectCoupon: true })
    }
  },
  //提示下一张券
  onNoticeNextCoupon(productList, coupon, selectCouponList, couponRemainNum) {
    let { isUnderwrite } = this.data
    let needAmount = CouponSelectUtil.calcNeedAmmount(productList, coupon, selectCouponList)
    //优惠券可能有上限金额，减出来会是负数，直接return
    if (needAmount < 0 || isUnderwrite) return
    $yjpDialog.open({
      dialogType: `defaultText`, title: `温馨提示`,
      dialogData: { text: `您有一张${coupon.amount}元的优惠券还未使用，再购买${parseFloat(needAmount).toFixed(2)}元即可使用该优惠券。是否继续添加商品？` },
      cancelText: `继续结算`, confirmText: `去添加商品`,
      onConfirm: () => {
        App.WxService.navigateTo(App.Constants.Route.getMoreProduct, {
          source: `coupon`, couponAmountFrom: coupon.useOrderAmountFrom, couponAmount: coupon.amount
        })
      }
    })
  },
  //将优惠券排序
  getSortedCoupons(couponGroups) {
    if (!couponGroups || !couponGroups.length) return []
    // couponGroups = couponGroups.filter(group => group.coupons.length != 0)
    //先将每个分组的可用不可用优惠券按金额排序
    for (let group of couponGroups) {
      group.coupons.sort((a, b) => {
        if (a.couponTemplate.couponType == 1) {
          return b.percent - a.percent
        } else return b.amount - a.amount
      })
      //去掉不可用券组中因为时间不在有效期内的优惠券或者使用金额不在范围内的优惠券
      group.unuseableCoupons = group.unuseableCoupons.filter(item => !this.couponOutOfTime(item))
      group.unuseableCoupons.sort((a, b) => {
        if (a.useOrderAmountFrom == b.useOrderAmountFrom) {
          return b.amount - a.amount
        } else return a.useOrderAmountFrom - b.useOrderAmountFrom
      })
    }
    couponGroups.sort((a, b) => this.couponGroupsSortFunc(a, b))
    //去掉时间超过的不可用券后该分组可能一张券都没有了
    couponGroups = couponGroups.filter(item => item.coupons.length || item.unuseableCoupons.length)
    return couponGroups
  },
  //优惠券超过使用时间限制
  couponOutOfTime(coupon) {
    return coupon.canNotUseReason == `当前不在该券可使用时间范围内`
  },
  //优惠券按大类型分组
  couponGroupsSortFunc(a, b) {
    a.hasUseableCoupon = a.coupons.length != 0
    b.hasUseableCoupon = b.coupons.length != 0
    let aCalcList = a.hasUseableCoupon ? a.coupons : a.unuseableCoupons
    let bCalcList = b.hasUseableCoupon ? b.coupons : b.unuseableCoupons
    let aCouponType = aCalcList[0].couponTemplate.couponType
    let bCouponType = bCalcList[0].couponTemplate.couponType
    let aCouponUseType = aCalcList[0].couponTemplate.couponUseType
    let bCouponUseType = bCalcList[0].couponTemplate.couponUseType
    if (a.hasUseableCoupon != b.hasUseableCoupon) {
      //两个分组一个有可用，一个没可用
      return a.hasUseableCoupon ? -1 : 1
    }
    else if (aCouponType == bCouponType && aCouponType == 0) {
      //抵用券
      if (aCouponUseType == bCouponUseType) {
        return bCalcList[0].amount - aCalcList[0].amount
      }
      else return bCouponUseType - aCouponUseType
    } else if (aCouponType == bCouponType && aCouponType == 1) {
      //打折券
      if (aCouponUseType == bCouponUseType) {
        return bCalcList[0].percent - aCalcList[0].percent
      }
      else return bCouponUseType - aCouponUseType
    }
    else return aCouponType - bCouponType
  },
  //计算价格(传这个值的原因是切换支付方式会导致是否要抹零变化)
  reCalcPrice(currentPayType) {
    let { orders, productList, couponReduceNotice, bonusReduce, currentDeliveryMode, isDealer, oddBalanceMode } = this.data
    //订单总价
    let orderAmount = orders[0].orderAmount
    //产品立减
    let productReduceAmount = orders[0].productReduceAmount
    //订单满减
    let reduceAmount = orders[0].reduceAmount
    //使用优惠券
    let couponReduce = couponReduceNotice.reduceNum
    //使用优惠码
    let couponCodeReduceAmount = orders[0].couponCodeReduceAmount
    //自提优惠
    let selfPickUpReduceAmount = 0
    //历次未收
    let lastOddBalanceAmount = orders[0].lastOddBalanceAmount || 0
    //计算自提优惠金额
    for (let product of productList) {
      selfPickUpReduceAmount += (product.productPrice.selfPickUpReduceAmount || 0) * (product.saleSpecQuantity || 1) * product.buyCount
    }
    //优惠金额
    let discountAmount = productReduceAmount + reduceAmount + (currentDeliveryMode == 4 ? selfPickUpReduceAmount : 0) + couponReduce + bonusReduce + couponCodeReduceAmount
    //最大可用红包金额(红包金额必须放在计算零头之前，不然会有影响)
    let totalBonusAmount = 0
    if (orders[0].bonusList && orders[0].bonusList.length) {
      for (let bonus of orders[0].bonusList) {
        totalBonusAmount += bonus.amount
      }
    }
    let maxAmount = Math.min(totalBonusAmount, orderAmount - discountAmount + bonusReduce, orders[0].useableBonusAmount)
    //计算零头结余
    let oddBalanceAmount = 0
    //实付款
    let payAmount = 0
    if (oddBalanceMode == 0 && !isDealer && currentPayType != 1) {
      //开启了零头结余
      let tempAmount = parseFloat((orderAmount - discountAmount + lastOddBalanceAmount).toFixed(2))
      oddBalanceAmount = tempAmount % 1
      payAmount = tempAmount - oddBalanceAmount
    } else {
      //不开启零头结余，即使返回了历次未收也不要参与计算
      payAmount = orderAmount - discountAmount
    }
    //防止支付金额小于0
    payAmount = payAmount < 0 ? 0 : payAmount

    this.setData({ selfPickUpReduceAmount, oddBalanceAmount, discountAmount, payAmount, totalPayableAmount: payAmount, maxAmount, lastOddBalanceAmount })

  },
  //订单留言
  onRemarkInputBlur(e) {
    let remark = e.detail.value
    let orderNo = e.currentTarget.dataset.orderNo
    let orderIndex = this.data.orders.findIndex(item => item.orderNo == orderNo)
    //多次预查询会把remark刷掉，保存在全局
    this.setData({ [`orders[${orderIndex}].remark`]: remark, remark })
  },
  //获取自提时间提示
  getSelfPickTimeNotice(allPresaleOrder, allNotPresaleOrder) {
    let selfPickTimeNotice = allPresaleOrder ? `预售商品到货后短信通知` :
      allNotPresaleOrder ? `下单后24小时内有效，逾期将自动取消订单` :
        `下单后24小时内有效，逾期将自动取消订单(预售商品到货后短信通知)`
    this.setData({ selfPickTimeNotice })
  },
  //是否可以自提
  getCanSelfPickUp(address) {
    let { isGroupBuy } = this.data
    if (!address || isGroupBuy) return false
    else return !!(address.deliveryMode != 1 && App.globalData.appSetting.unlockSelfPickup)
  },
  //自提仓库列表
  getWareHouseList() {
    return App.HttpService.queryWarehouseList()
      .then(data => {
        if (data.data && data.data.length) {
          let currentWareHouse = data.data.find(item => item.defaultWarehouse == true) || data.data[0]
          this.setData({ wareHouseList: data.data, currentWareHouse })
        }
      })
  },
  //选择收货地址
  onSelectUserAddress() {
    let { userAddress, currentAddress } = this.data
    App.WxService.navigateTo(App.Constants.Route.selectUserAddress, { userAddress, selectAddress: currentAddress })
  },
  //查看商品清单列表
  goToOrderGoodsList(e) {
    const tag = e.currentTarget.dataset.tag
    //tag:product商品清单，fullgift赠品清单
    let productList;
    if (tag == "product") {
      productList = this.data.productList
    } else {
      productList = this.data.orders[0].fullGiftProducts
    }
    let productDataList = JSON.stringify(productList);
    let list = encodeURIComponent(productDataList)
    App.WxService.navigateTo(App.Constants.Route.orderGoodsList, { productList: list, tag, needdecodeURI: true })
  },
  //重新选择配送方式，当选择的地址是仅配送或者仅自提的话，配送方式也要相应的变化
  getDeliveryModeShowType(address) {
    //先获取城市是否可以自提
    let { canSelfPickUp, currentDeliveryMode, isDealer, isLargeCargo, productList } = this.data
    //自提和配送的展示方式，跟地址的deliveryMode相一致,currentDeliveryMode:当前选中的配送方式，0或者4
    let deliveryModeShowType = 0
    // 0 - 可配送可自提， 1 - 可配送 ，2 - 可自提
    if (canSelfPickUp && !isDealer && !isLargeCargo) {
      currentDeliveryMode = address.deliveryMode == 1 ? 0 : address.deliveryMode == 2 ? 4 : this.data.currentDeliveryMode
      deliveryModeShowType = address.deliveryMode
      //全预售商品
      let allPresaleOrder = productList.every(item => item.stockState == 4)
      //全部不预售
      let allNotPresaleOrder = productList.every(item => item.stockState != 4)
      this.getSelfPickTimeNotice(allPresaleOrder, allNotPresaleOrder)
    } else {
      deliveryModeShowType = 1
      currentDeliveryMode = 0
    }
    this.setData({ deliveryModeShowType, currentDeliveryMode })
  },
  //选择自提地址
  onSelectWareHouse() {
    let { wareHouseList, currentWareHouse } = this.data
    App.WxService.navigateTo(App.Constants.Route.selectSelfPickAddress, { wareHouseList, selectAddress: currentWareHouse })
  },
  //选择配送方式
  onSelectDeliveryType(e) {
    const currentDeliveryMode = parseInt(e.currentTarget.dataset.tag)
    this.setData({ currentDeliveryMode }, () => this.reCalcPrice())
  },
  //选择支付方式
  onSelectPayType(e) {
    //在线支付不能抹零
    const currentPayType = parseInt(e.currentTarget.dataset.tag)
    this.setData({ currentPayType }, () => this.reCalcPrice(currentPayType))
  },
  //经销商优惠券弹出的时候初始化勾选状态
  initDealerCoupon(selectCouponList, couponGroups) {
    for (let coupon of couponGroups[0].coupons) {
      coupon.select = selectCouponList.findIndex(item => item.couponId == coupon.couponId) != -1
    }
    this.setData({ [`$yjp.dialog.dialogData.couponGroups`]: couponGroups })
  },
  //勾选经销商优惠券
  onSelectDealerCoupon(e) {
    let coupon = e.currentTarget.dataset.coupon
    let dialogData = this.data.$yjp.dialog.dialogData
    let { couponGroups, selectCouponList, productList } = dialogData
    const originalSelect = dialogData.selectCouponList.findIndex(item => item.couponId == coupon.couponId) != -1
    //取消选中
    if (originalSelect) {
      for (let group of couponGroups) {
        let couponIndex = group.coupons.findIndex(item => item.couponId == coupon.couponId)
        if (couponIndex != -1) {
          group.coupons[couponIndex].select = false
          selectCouponList = CouponSelectUtil.removeCouponFromSelectList(group.coupons[couponIndex], selectCouponList)
          break
        }
      }
    } else {
      //选中
      let selectResult = CouponSelectUtil.canSelectCoupon(productList, couponGroups, coupon, selectCouponList)
      if (selectResult.success) {
        for (let group of couponGroups) {
          let couponIndex = group.coupons.findIndex(item => item.couponId == coupon.couponId)
          if (couponIndex != -1) {
            group.coupons[couponIndex].select = true
            selectCouponList.push(group.coupons[couponIndex])
            break
          }
        }
        if (selectResult.desc) {
          $yjpToast.show({ text: selectResult.desc })
        }
      } else {
        $yjpToast.show({ text: selectResult.desc })
      }
    }
    dialogData.couponGroups = couponGroups
    dialogData.selectCouponList = selectCouponList
    let couponReduceNotice = CouponSelectUtil.getSelectCouponReduce(selectCouponList, productList) //优惠金额
    this.setData({ [`$yjp.dialog.dialogData`]: dialogData, selectCouponList, couponReduceNotice })
  },
  //去选择优惠券
  onSelectCoupons() {
    let { selectCouponList, couponReduceNotice, couponCodeNotice, isDealer } = this.data
    let order = this.data.orders[0]
    //经销商用券需要弹框，酒批商品直接去选券页面
    if (isDealer) {
      $yjpDialog.open({
        halfWindowDialogType: `useDealerCoupons`, title: `使用经销商优惠券`,
        dialogData: {
          selectCouponList,
          couponGroups: order.couponGroups,
          productList: order.productItems,
        }
      })
      this.initDealerCoupon(selectCouponList, order.couponGroups)
    } else {
      //通过下面的提示是否为空字符串去看是否使用了优惠码
      if (couponCodeNotice) {
        $yjpDialog.open({
          dialogType: `defaultText`, title: `温馨提示`,
          dialogData: { text: `无法同时使用优惠券和优惠码，如果想使用优惠券，请点击重新输入清除所选优惠码` },
          hiddenCancel: true, confirmText: `知道了`,
        })
      } else {
        App.WxService.navigateTo(App.Constants.Route.selectCoupons, {
          selectCouponList, couponReduceNotice,
          couponGroups: order.couponGroups,
          productList: order.productItems
        })
      }
    }
  },
  //去选择红包
  onSelectBonus() {
    let { selectBonusList, orders, maxAmount, couponReduceNotice } = this.data
    // let couponReduceAmount = couponReduceNotice.reduceNum || 0
    // maxAmount = Math.max(maxAmount - couponReduceAmount, 0)
    //判断商品的可以用优惠卷金额与可用红包金额是否相同
    if (orders && orders[0].productItems) {
      let couponsMoney = 0
      let bounsMoney = 0
      for (let product of orders[0].productItems) {
        if (product.isUseBonus) {
          bounsMoney = bounsMoney + product.productAmount
        }
        if (product.isUseCoupon) {
          couponsMoney = couponsMoney + product.productAmount
        }
      }
      //说明此时商品中都可用红包和优惠卷的商品是一样的（即商品为都可用红包优惠卷，都不可用红包不可用优惠卷）
      if (couponReduceNotice && couponsMoney == bounsMoney) {
        maxAmount = Math.max(couponsMoney - couponReduceNotice.reduceNum, 0)
      }
    }
    App.WxService.navigateTo(App.Constants.Route.selectBonus, { selectBonusList, bonusList: orders[0].bonusList, maxAmount })
  },
  //输入优惠码
  onInputCouponCode(e) {
    let inputValue = e.detail.value
    inputValue = inputValue.toLocaleUpperCase()
    this.setData({ couponCode: inputValue })
    if (inputValue.length != 6) return
    if (!StringUtil.checkCouponCode(inputValue)) {
      $yjpToast.show({ text: `优惠码由字母、数字组成` })
      this.resetCouponCode()
    } else {
      this.setData({ couponCodeNotice: ``, couponCodeCantUseReason: `` })
      this.getCouponCodeDetail(inputValue)
    }
  },
  //重置优惠码
  resetCouponCode() {
    this.setData({ couponCodeDetail: {}, couponCode: ``, couponCodeNotice: ``, couponCodeCantUseReason: `` })
    this.getPrepareParams()
    this.prepareOrder()
  },
  //获取优惠码详情
  getCouponCodeDetail(couponCode) {
    App.HttpService.getCouponCodeDetail({ data: couponCode })
      .then(data => {
        //优惠券和优惠码不能同时使用，如果优惠码可用，但是已经选过优惠券了，则弹框提示
        if (this.data.selectCouponList && this.data.selectCouponList.length) {
          $yjpDialog.open({
            dialogType: `defaultText`, title: `温馨提示`, canDismiss: false,
            dialogData: { text: `该优惠码不能与优惠券同时使用，是否使用该优惠码？` },
            cancelText: `放弃使用`, confirmText: `确定使用`,
            onCancel: () => { this.resetCouponCode() },
            onConfirm: () => {
              this.setData({ couponCodeDetail: data.data })
              this.processCouponCodeDetail(data.data)
            }
          })
        } else {
          this.setData({ couponCodeDetail: data.data })
          this.processCouponCodeDetail(data.data)
        }
      })
      .catch(e => {
        this.setData({ couponCodeCantUseReason: e })
      })
  },
  //处理优惠码详情
  processCouponCodeDetail(couponCodeDetail) {
    let { productList, isUnderwrite } = this.data
    //产品列表有该定向产品且该产品没有参加限时惠
    let product = productList.find(item => item.productSkuId == couponCodeDetail.productSkuId && item.productSkuId == item.sourceId)
    let buyAmount = !product ? 0 : (product.productPrice.price - product.productPrice.reducePrice) * product.saleSpecQuantity * product.buyCount
    let buyCount = !product ? 0 : product.buyCount
    let codeFitResult = CouponCodeUtil.getCodeFit(couponCodeDetail, product, buyCount, buyAmount)
    if (codeFitResult.success) {
      this.setData({ couponCodeNotice: codeFitResult.desc, couponReduceNotice: { reduceNum: 0, reduceStr: `` }, selectCouponList: [] })
      // 使用优惠码要清除掉优惠券，包括赠品券
      this.onRemoveCouponGift()
      this.getPrepareParams()
      this.prepareOrder()
    } else if (isUnderwrite) {
      //TODO : 要是独家包销商品，优惠码提示需要弹框添加商品时，不弹框，直接显示该优惠码不符合使用条件
      this.setData({ couponCodeCantUseReason: `该优惠码不符合使用条件` })
    } else {
      let hasBuyInfo = this.getCouponCodeHasBuyInfo(couponCodeDetail.productSkuId)
      $yjpDialog.open({
        title: '温馨提示', dialogType: `defaultText`,
        dialogData: { text: codeFitResult.desc },
        cancelText: `取消`, confirmText: `去添加商品`,
        canDismiss: false,
        onConfirm: () => {
          App.WxService.navigateTo(App.Constants.Route.getMoreProduct, {
            productSkuId: couponCodeDetail.productSkuId,
            source: `couponCode`, couponCodeDetail,
            productBuyAmount: hasBuyInfo.productBuyAmount,
            productBuyCount: hasBuyInfo.productBuyCount,
          })
        },
        onCancel: `resetCouponCode`
      })
    }
  },
  //已购买对应的优惠码商品
  getCouponCodeHasBuyInfo(productSkuId) {
    let { productList } = this.data
    let product = productList.find(item => item.productSkuId == productSkuId && item.productSkuId == item.sourceId)
    let productBuyAmount = 0
    let productBuyCount = 0
    if (product != undefined) {
      productBuyAmount = (product.productPrice.price - product.productPrice.reducePrice) * product.saleSpecQuantity * product.buyCount || 0
      productBuyCount = product.buyCount || 0
    }
    return { productBuyAmount, productBuyCount }
  },
  //获取订单提交的参数
  getOrderSubmitParams() {
    let { orders, productList, selectCouponList, selectBonusList, couponCode, couponCodeNotice,
      isSuggestAddress, currentLocation, currentAddress, currentWareHouse, currentDeliveryMode, currentPayType, fromShoppingCar,
      isSup, isDealer, isLargeCargo, isGroupBuy, istemporary, isUnderwrite, groupPurchaseId } = this.data
    //多个订单提交参数
    let submitOrdersParams = []
    for (let order of orders) {
      //单个订单提交参数
      let submitOrderParams = {}
      //订单明细(经销商合作商商品不会有组合商品拆分的情况出现，所以直接取orders里返回的productItems)
      let itemList = []
      if (isSup || isDealer) {
        for (let product of order.productItems) {
          let itemObj = {}
          itemObj.buyCount = product.buyCount
          itemObj.productSaleSpecId = itemObj.sourceId = itemObj.productSkuId = product.productSkuId
          itemObj.sourceType = product.sourceType
          itemList.push(itemObj)
        }
      } else if (isUnderwrite) {
        for (let product of order.productItems) {
          let itemObj = {}
          itemObj.buyCount = product.buyCount
          itemObj.productSaleSpecId = product.productSaleSpecId || product.productSkuId,
            itemObj.productSkuId = product.productSkuId || ``,
            itemObj.sourceId = product.sourceId || product.productSkuId,
            itemObj.sourceType = 16
          itemList.push(itemObj)
        }
      } else {
        for (let product of productList) {
          let itemObj = {}
          itemObj.buyCount = product.buyCount
          itemObj.productSaleSpecId = product.productSaleSpecId || ``
          itemObj.productSkuId = product.productSkuId || ``
          itemObj.sourceId = product.sourceId || product.productSkuId//组合商品无sourceId
          itemObj.sourceType = isLargeCargo ? 10 : product.stockState == 4 || product.saleMode == 8 ? 8 :
            product.enjoyPromotions && product.enjoyPromotions.length && product.enjoyPromotions[0].promotionType == 4 ? 4 :
              product.enjoyPromotions && product.enjoyPromotions.length && product.enjoyPromotions[0].promotionType == 5 ? 5 : 0
          //临期
          if (istemporary) {
            itemObj.sourceType = 14
            itemObj.sourceId = product.nearExpireId || product.sourceId
          }
          //临期
          if (isGroupBuy) {
            itemObj.sourceType = 9
            itemObj.sourceId = product.promotionId
          }
          itemList.push(itemObj)
        }
      }
      //红包优惠券id列表
      selectBonusList = selectBonusList.map(item => item.bonusId)
      selectCouponList = selectCouponList.map(item => item.couponId)
      //单个订单提交参数
      submitOrderParams = {
        addressId: isSuggestAddress && currentLocation.addressId ? currentLocation.addressId :
          !isSuggestAddress && currentAddress.addressId ? currentAddress.addressId : ``,
        classify: order.classify,
        companyId: order.companyId || ``,
        //通过下面的提示是否为空字符串去看是否使用了优惠码
        couponCodes: couponCodeNotice && couponCode ? [couponCode] : [],
        deliveryMode: currentDeliveryMode,
        fromShoppingCar,
        itemList,
        latitude: 0,
        longitude: 0,
        orderNo: order.orderNo,
        orderType: order.orderType,
        payType: isSup ? 0 : isDealer ? 0 : currentPayType,
        selfWarehouseId: currentDeliveryMode == 4 ? currentWareHouse.warehouseId : ``,
        useBonusIds: selectBonusList,
        useCouponIds: selectCouponList,
        userRemark: order.remark,
      }
      if (isGroupBuy) {
        submitOrderParams.grouponGroupId = groupPurchaseId
      }
      submitOrdersParams.push(submitOrderParams)
    }
    return submitOrdersParams
  },
  //清除临期或者特价预售商品缓存
  cleanLargeCargoOrtemporary() {
    //只有从购物车进来提交的要清缓存
    if (this.data.fromShoppingCar) {
      let productStorageKey = '';
      if (this.data.isLargeCargo) {
        productStorageKey = 'bulkProductData'
      }
      if (this.data.istemporary) {
        productStorageKey = 'adventProductData'
      }
      if (!productStorageKey) {
        return;
      }
      let list = this.data.productList;
      let bulkProductData = wx.getStorageSync(productStorageKey)
      let idx = [];
      for (var i = 0, len = bulkProductData.length; i < len; i++) {
        for (var j = 0, leng = list.length; j < leng; j++) {
          if (bulkProductData[i].productSkuId == list[j].productSkuId && bulkProductData[i].productSaleSpecId == list[j].productSaleSpecId && bulkProductData[i].nearExpireId == list[j].nearExpireId) {
            idx.push(i);
          }
        }
      }
      for (let item of idx) {
        bulkProductData.splice(item, 1)
      }
      if (!bulkProductData.length) {
        wx.removeStorage({
          key: productStorageKey
        })
      } else {
        wx.setStorage({
          key: productStorageKey,
          data: bulkProductData
        })
      }

    }
  },
  //确认提交订单
  confirmSubmit() {
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '购买分析-去结算', eventType: 505, actionId: 0 })
    let { isSuggestAddress, currentLocation, currentAddress } = this.data
    if (!currentLocation && !currentAddress) {
      $yjpToast.show({ text: `请选择收货地址` })
      return false
    }
    let submitParams = this.getOrderSubmitParams()
    //如果选择的是建议地址，且建议地址的id为空，则需要先提交收货地址再去提交订单
    if (isSuggestAddress && !currentLocation.addressId) {
      let { province, city, street } = currentLocation.address_component
      let county = currentLocation.address_component.district
      return App.HttpService.addAddressWithoutAudit({
        data: {
          province, city, county, street,
          detailAddress: currentLocation.address_component.detailAddress || currentLocation.formatted_addresses.recommend,
          houseNumber: currentLocation.address_component.houseNumber || ``,
          fromLocation: true,
          locationAddress: currentLocation.address_component.detailAddress || currentLocation.formatted_addresses.recommend,
          latitude: currentLocation.location.lat,
          longitude: currentLocation.location.lng,
          defaultAddress: currentAddress.defaultAddress,
          mobileNo: currentAddress.mobileNo,
          contact: currentAddress.contact,
          sourceAddressId: currentAddress.addressId
        }
      })
        .then(data => {
          App.globalData.addressId = data.data
          for (let order of submitParams) {
            order.addressId = data.data
          }
          return this.requestSubmitOrder(submitParams)
        })
        .catch(e => $yjpToast.show({ text: e }))
    } else {
      return this.requestSubmitOrder(submitParams)
    }
  },
  //发起提交订单请求
  requestSubmitOrder(submitParams) {
    let { totalPayableAmount, supTotalPayableAmount, currentDeliveryMode, currentPayType, isSup, istemporary, isLargeCargo, isGroupBuy, canBackShopCart, lastOddBalanceAmount, isDealer } = this.data
    let amount = isSup ? supTotalPayableAmount : totalPayableAmount
    if (this.data.submiting) return
    wx.showLoading({ title: '提交中', mask: true })
    this.setData({ submiting: true })
    let orderNOs = []
    //独家包销产品下单成功后，清除独家包销产品本地缓存
    let isUnderwrite = false
    if (this.data.isUnderwrite) {
      isUnderwrite = true
    }
    //易酒批订单
    let isYjpOrder = false
    if (submitParams[0].orderType == 0){
      isYjpOrder = true
    }
    return App.HttpService.orderSubmit({ datas: submitParams })
      //判断是否是微信支付，是的话发起支付,否则将提交订单的结果传到下一个方法
      .then(data => {
        //独家包销产品下单成功后，清除独家包销产品本地缓存
        if (isUnderwrite) {
          let storageObj = wx.getStorageSync(`ProductStorage`)
          if (storageObj) {
            for (let key in storageObj) {
              if (key == `underwrite`) {
                storageObj[`underwrite`] = []
              }
            }
            wx.setStorageSync(`ProductStorage`, storageObj)
          }
        }
        if (currentPayType == 1) {
          //微信支付成功，跳转到微信支付成功页面，失败跳转到微信支付失败页面
          orderNOs = data.data
          return WxPayUtil.onRequestPayment(data.data)
            .catch(e => Promise.reject(`微信支付失败`))
        } else {
          return Promise.resolve(data)
        }
      })
      //订单提交成功跳转
      .then(data => {
        if (currentPayType == 1) {
          //订单提交成功且微信支付
          let placeOrderTime = wx.getStorageSync(`serviceTime`)
          App.WxService.redirectTo(App.Constants.Route.orderOnlinePaySuccess, { data, totalPayableAmount: amount, currentDeliveryMode, currentPayType, placeOrderTime, istemporary, isLargeCargo, canBackShopCart, isGroupBuy, orderNOs: JSON.stringify(orderNOs), isYjpOrder })
          this.cleanLargeCargoOrtemporary()
        } else {
          //订单提交成功且非微信支付
          let placeOrderTime = wx.getStorageSync(`serviceTime`)
          WxPayUtil.outOrderPolling(data.data).then(function (it) {
            // return Promise.resolve(data)
            App.WxService.redirectTo(App.Constants.Route.orderResultSuccess, { data, totalPayableAmount: amount, currentDeliveryMode, currentPayType, placeOrderTime, istemporary, isLargeCargo, canBackShopCart, isYjpOrder })
          })
          

        }
      })
      //订单提交失败跳转
      .catch(e => {
        if (currentPayType == 1 && e == `微信支付失败`) {
          //订单提交失败且微信支付
          let placeOrderTime = wx.getStorageSync(`serviceTime`)
          App.WxService.redirectTo(App.Constants.Route.orderOnlinePayFail, { data: `微信支付失败`, totalPayableAmount: amount, currentDeliveryMode, currentPayType, orderNOs: JSON.stringify(orderNOs), placeOrderTime, canChangePayType: !istemporary && !isLargeCargo && !isUnderwrite && !isGroupBuy, istemporary, isLargeCargo, canBackShopCart, lastOddBalanceAmount, isDealer })
        } else {
          //订单提交失败且非微信支付
          let placeOrderTime = wx.getStorageSync(`serviceTime`)
          App.WxService.redirectTo(App.Constants.Route.orderResultFail, { data: e, totalPayableAmount: amount, currentDeliveryMode, currentPayType, submitParams: JSON.stringify(submitParams), placeOrderTime, istemporary, isLargeCargo, canBackShopCart })
        }
      })
  },
  //关闭包销产品购买提示
  closeUnderwriteTip() {
    this.setData({ underwriteTipShow: false })
  }
}) 