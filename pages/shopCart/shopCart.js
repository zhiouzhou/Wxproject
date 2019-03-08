// pages/shopCart/shopCart.js
const App = getApp()
import { ProductUtil, DateUtil, FunctionUtils } from '../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog, DealerReceiveCouponsJs } from '../../components/yjp.js'
import AddToShopCartUtil from '../../utils/AddToShopCartUtil.js'
import { onlyRecommendInit, ListProductRecommend, loadMoreRecommendList } from '../../components/recommendListFn.js'

let isRun = true;
Page({
  data: {
    isEmpty: false,
    isFirstEntry: true,
    selectStateList: [],
    globalSelect: false,
    editing: false,//编辑 
    productList: [],
    invalidProductList: [],
    noticeTags: [{ show: false, keyWord: `限购` }, { show: false, keyWord: `降价` }, { show: false, keyWord: `凑单` }, { show: false, keyWord: `自提` }, { show: false, keyWord: `优惠` }],
    cityPickUp: false,
    canBackShopCart: false,//是否能返回购物车（有未提交的商品或者有多个组）
    scrollPosition: ``,
    joinAfterReduceIndex: 0,//购物车降价的产品，点击跳转到第几个对应的产品
    limitBuyIndex: 0,//限制购买的产品，点击跳转到第几个对应的产品
    minBuyAmount: 0,//订单起送金额
    recommendList: [],//为您推荐list 
    recommendType:2
  },
  onLoad: function (options) {
    Object.assign(this, DealerReceiveCouponsJs)
    const isVisitor = wx.getStorageSync(`isVisitor`)
    //游客模式直接去登陆
    if (isVisitor) {
      App.WxService.reLaunch(App.Constants.Route.login)
      return
    }
    const userState = App.globalData.userDetail.state
    const auditRejectionReason = App.globalData.userDetail.auditRejectionReason || ``
    const systemInfo = App.globalData.systemInfo
    const settingValue = App.globalData.settingValue
    //游客模式提示
    const UnLoginPriceDesc = settingValue.UnLoginPriceDesc || `登录后查看价格`
    const PendingAuditPriceDesc = settingValue.PendingAuditPriceDesc || `审核通过后可以查看价格`
    const hiddenPriceText = isVisitor ? UnLoginPriceDesc : App.globalData.userDetail.state != 1 ? PendingAuditPriceDesc : ``//隐藏价格提示
   
    this.setData({
      userState, auditRejectionReason, hiddenPriceText,
      windowHeight: (systemInfo.windowHeight - (systemInfo.windowWidth / 750 * 178)),
      windowWidth: systemInfo.windowWidth
    })
  },
  onShow: function () {
    //切换地址会导致下面的自提按钮隐藏
    const userAddress = wx.getStorageSync(`userAddress`) || []
    let address = userAddress.find(item => item.addressId == App.globalData.addressId)
    let deliveryMode = 0
    if (address) { deliveryMode = address.deliveryMode }
    let cityPickUp = App.globalData.appSetting.unlockSelfPickup || false
    this.setData({ canSelfPickUp: deliveryMode != 1 && cityPickUp })
    this.addStorageShopCart()
    //获取订单起送金额接口
    App.HttpService.getOrderMinBuyAmount()
      .then(data => {
        App.globalData.orderMinBuyAmount = data.data || 0
        const minBuyAmount = App.globalData.orderMinBuyAmount >= 0 ? App.globalData.orderMinBuyAmount : App.globalData.appSetting.minBuyAmount
        this.setData({ minBuyAmount })
    })
    this.getUserCouponData()
    // wx.showTabBar({})
  },
  onHide() {
    let selectStateList = []
    let { productList } = this.data
    productList.forEach(item => {
      if (item.select) {
        selectStateList.push(item.shopCartId)
      }
    })
    this.setData({ selectStateList })
  },
  //把缓存的购物车数据上传(先上传再请求购物车数据)
  addStorageShopCart() {
    let addArr = []
    let newProductStorage = {}
    let storageObj = wx.getStorageSync(`ProductStorage`)
    if (storageObj) {
      /**
       * 处理缓存购物车会把所有的ProductStorage缓存都处理掉
       * ProductStorage对象中独家包销的数据也会被清除掉，此时做个过滤，不处理独家包销缓存购物车数据
       * */
      for (let key in storageObj) {
        if (key == `underwrite`) {
          newProductStorage[`underwrite`] = storageObj[key]
        } else {
          for (let item of storageObj[key]) {
            addArr.push(item)
          }
        }
      }
    }
    if (!addArr || !addArr.length) {
      this.getShopCartData()
    } else {
      App.HttpService.addShopCartList({ datas: addArr })
        .then(data => {
          this.getShopCartData()
          wx.setStorageSync(`ProductStorage`, {})
          if (newProductStorage[`underwrite`]) {
            wx.setStorageSync(`ProductStorage`, newProductStorage)
          }
        })
        .catch(e => {
          $yjpToast.show({ text: e })
          this.getShopCartData()
        })
    }
  },
  //获取购物车数据
  getShopCartData(notInitSelectState = false) {
    if (!this.data.productList.length && !this.data.invalidProductList.length) {
      wx.showLoading({
        title: '加载中',
        mask: true
      })
    }

    App.HttpService.getShopCartList()
      .then(data => {
        // console.time()
        this.rebuildShopCartList(data, notInitSelectState)
        this.processGatherOderInfo()
        let reCalcPriceData = this.reCalcPrice(this.data.productList);
        this.setData(reCalcPriceData, function (e) {
          onlyRecommendInit(this)
          ListProductRecommend(this)
          wx.hideLoading()
          // console.timeEnd();
        })

      })
      .catch(e => {
        wx.hideLoading()
      })
  },
  //处理购物车数据
  rebuildShopCartList(data, notInitSelectState) {
    let { selectStateList } = this.data
    let rawData = data.data || undefined
    //数据为空
    if (!rawData || !rawData.groupList || !rawData.groupList.length) {
      this.setData({ invalidProductList: [], productList: [], isEmpty: true })
      return
    }
    let invalidProductList = this.sortGroupList(rawData.groupList).invalidProductList
    let productList = this.sortGroupList(rawData.groupList).productList
    let cutPriceNum = 0//加入购物车降价的产品数量
    let productBelowLimitCount = 0//低于购买限制的产品数量
    let productOverLimitCount = 0//超出购买限制的产品数量
    let jiuCoinLimitCount = 0//酒币不足的商品数量
    for (let product of productList) {
      if (!notInitSelectState) {
        product.select = (selectStateList.findIndex(item => item == product.shopCartId) != -1 && product.canSelect)
      }
      if (product.viewType == 'product') {
        product.productPrice.joinAfterReduceAmount > 0 ? cutPriceNum++ : {}
        product.cantSelectReason == `最大库存低于起购数量` || product.cantSelectReason == `购买数量低于起购数量` ? productBelowLimitCount++ : {}
        product.cantSelectReason == `购买数量超过可买数量` ? productOverLimitCount++ : {}
        product.spendWineScore * product.buyCount > rawData.wineScoreAmount ? jiuCoinLimitCount++ : {}
      }
    }
    this.setData({
      gatherOrder: rawData.gatherOrder||{},
      invalidProductList, productList,
      isEmpty:  !productList.length,
      cutPriceNum, productBelowLimitCount, productOverLimitCount, jiuCoinLimitCount,
      globalSelect: false
    })
    this.initSelectState()
    this.updateAllGroupSelect()

  },
  //更新选中状态
  initSelectState() {
    let { selectStateList, productList, isFirstEntry } = this.data
    let selectArr = {}
    if (isFirstEntry) {
      for (let i = 0; i < productList.length; i++) {
        if (productList[i].canSelect) {
          selectArr[`productList[${i}].select`] = true
          selectStateList.push(productList[i].shopCartId)
        }
      }
      let stateList = { isFirstEntry: false, selectStateList }
      let setData = FunctionUtils.combineArguments(selectArr, stateList)
      this.setData(setData)
    }
  },
  //更新顶部的提示
  updateNoticeTagsShow(hasGather, isAllGatherSuccess, selfPickUpReduce, jiupiUseCouponPrompt) {
    let { noticeTags, cutPriceNum, productBelowLimitCount, productOverLimitCount, jiuCoinLimitCount } = this.data
    for (let item of noticeTags) {
      if (item.keyWord == `限购`) {
        item.show = (productBelowLimitCount != 0) || (productOverLimitCount != 0) || (jiuCoinLimitCount != 0)
      } else if (item.keyWord == `降价`) {
        item.show = cutPriceNum != 0
      } else if (item.keyWord == `凑单`) {
        item.show = hasGather && !isAllGatherSuccess
      } else if (item.keyWord == `自提`) {
        item.show = selfPickUpReduce != 0 && this.data.canSelfPickUp
      } else if (item.keyWord == `优惠`){
        item.show = !!jiupiUseCouponPrompt
      }
    }
    return noticeTags
  },
  //购物车数据分类
  sortGroupList(groupList) {
    let invalidProductList = []
    let productList = []
    //分组有数据，且第一组是酒批的产品，则加入易酒批的主分组
    if (groupList[0].groupType == 0) {
      productList.push({
        groupId: `jiuPi`, groupName: `易久批`, companyId: ``,
        viewType: `group`, saleMode: 1, shopCartId: `jiuPi`,
        isSubGroup: false,
        select: false, canSelect: true
      })
    }
    let hasFullReduce = groupList.findIndex(item => item.groupType == 0 && item.discountVO) != -1
    for (let group of groupList) {
      //失效商品组
      if (group.groupType == 3) {
        for (let product of group.productSkus) {
          invalidProductList.push(product)
        }
      } else if (group.groupType == 1) {
        let groupItem = this.getGroupItem(group, hasFullReduce)
        if (groupItem) { productList.push(groupItem) }
        productList.push(...this.getRebuildProducts(group))
      } else if (group.groupType == 4) {
        //去掉限时惠产品（暂时用不上）
      } else {
        let groupItem = this.getGroupItem(group, hasFullReduce)
        if (groupItem) { productList.push(groupItem) }
        productList.push(...this.getRebuildProducts(group))
      }
    }
    return { invalidProductList, productList }
  },
  //获取分组标题
  getGroupItem(group, hasFullReduce) {
    if (group.groupType == 0) {
      if (hasFullReduce) {
        return {
          groupId: `jiuPi`, groupName: `易久批`, companyId: ``,
          viewType: `group`, saleMode: 1, shopCartId: group.discountVO ? group.discountVO.discountId : `nodiscount`,
          isSubGroup: true, discountVO: group.discountVO,
          select: false, canSelect: true
        }
      }
    } else if (group.groupType == 1) {
      //判断经销商是否有优惠券可以领
      let hasCoupon = group.productSkus[0].productTags.findIndex((tag) => tag.tagType == 17) >= 0
      return {
        groupId: group.companyId, groupName: group.companyName, companyId: group.companyId,
        viewType: `group`, saleMode: 6, hasCoupon, shopCartId: group.companyId,
        isSubGroup: false,
        select: false, canSelect: true
      }
    } else if (group.groupType == 2) {
      return {
        groupId: group.companyId, groupName: group.companyName, companyId: group.companyId,
        viewType: `group`, saleMode: 2, shopCartId: group.companyId,
        isSubGroup: false,
        select: false, canSelect: true
      }
    }
  },
  //获取重构的产品
  getRebuildProducts(group) {
    for (let product of group.productSkus) {
      product = ProductUtil.rebuildProduct(product, `shopCart`)
      product.discountVO = group.discountVO
      if (product.discountVO) {
        product.showCornerImg = true
        product.cornerImgUrl = App.globalData.settingValue.ProductListFullReduceWatermark
      } else if (product.saleMode == 8) {
        product.showCornerImg = true
        product.cornerImgUrl = App.globalData.settingValue.ProductUnderwritingWatermark
      } else {
        product.showCornerImg = product.enjoyPromotions && product.enjoyPromotions.length
        product.cornerImgUrl = product.enjoyPromotions && product.enjoyPromotions.length ? product.enjoyPromotions[0].promotionWatermark : ``
      }
      product.viewType = `product`
      //酒批商品有可能会有companyId
      product.groupId = product.saleMode == 2 || product.saleMode == 6 ? group.companyId : `jiuPi`
      const canSelectResult = this.getCanSelect(product)
      product.canSelect = canSelectResult.canSelect
      product.cantSelectReason = canSelectResult.reason
      product.select = false
      product.groupName = group.companyName
    }
    return group.productSkus
  },
  //商品是否可以点击
  getCanSelect(product) {
    //超出当日限购或者不足，或者需要重新进货，这三种情况没有加入失效列表
    if (product.saleMode == 6 && !product.productPrice.price && product.productPrice.lastBuyPrice)
      return { canSelect: false, reason: '价格已过期' }
    else if (product.saleMode == 6 && !product.productPrice.price && !product.productPrice.lastBuyPrice)
      return { canSelect: false, reason: `请申请进货` }
    else if (product.timeNotice == `活动未开始` || product.timeNotice == `活动已结束`)
      return { canSelect: false, reason: product.timeNotice }
    else if (product.limitBuyTag && product.limitBuyCount == 0)
      return { canSelect: false, reason: product.limitBuyTag.tagDetail }
    else if (product.minBuyNum > product.maxBuyNum && product.canSellStoreCount != 0)
      return { canSelect: false, reason: '最大库存低于起购数量' }
    else if (!product.enjoyUserLevelDiscount)
      return { canSelect: false, reason: '会员等级不够，不能购买' }
    else if (product.minBuyNum > product.buyCount && product.canSellStoreCount != 0)
      return { canSelect: true, reason: '购买数量低于起购数量' }
    else if (product.buyCount > product.maxBuyNum && product.canSellStoreCount != 0)
      return { canSelect: true, reason: '购买数量超过可买数量' }
    else if (product.stockState == 2 && product.buyCount > product.canSellStoreCount && product.canSellStoreCount == 0) {
      //针对于库存紧张但是返回的canSellStoreCount却为0
      return { canSelect: false, reason: '购买数量超过可买数量' }
    } else
      return { canSelect: true }
  },
  //处理凑单信息
  processGatherOderInfo() {
    //吧凑单的金额放入产品中
    let { productList, gatherOrder } = this.data
    if (!productList.length || !gatherOrder) return
    if (!gatherOrder.items || !gatherOrder.items.length) return
    for (let item of gatherOrder.items) {
      let productIndex = productList.findIndex(product => product.productSkuId == item.productSkuId)
      if (productIndex != -1) {
        this.setData({ [`productList[${productIndex}].orderAmount`]: item.orderAmount })
      }
    }
  },
  //重新计算价格
  reCalcPrice(productList) {
    if (!this.data.productList.length) return
    //是否有未选中的商品，订单提交结果页面跳转购物车需要
    let hasNotSelectProduct = !!productList.filter(item => item.viewType == `product` && !item.select).length
    //是否有多个分组(多个合作商视为一个分组)
    let groupList = productList.filter(item => item.viewType == `group`)
    let hasMultiGroup = groupList.length > 1 && groupList.some(item => item.saleMode != 2)
    //选中的产品列表
    let selectList = productList.filter(item => item.viewType == `product` && item.select)
    //选中的酒批商品列表
    let jiupiSelectList = productList.filter(item => item.viewType == `product` && item.select && item.saleMode != 2 && item.saleMode != 6)
    //凑单相关信息
    let gatherResult = this.getGatherResult(selectList)
    // 满减相关信息
    let discountMap = this.getDiscountMap()
    //将满减信息反映到子分组上
    let totalDiscountReduce = this.updateDiscountReduceAmount(discountMap)
    //自提相关信息
    let selfPickUpReduce = this.getSelfPickUpReduce(selectList)
    // 所有选择的商品的总价，立减，总数信息
    let totalAmount = 0
    let productReduce = 0
    let selectedCount = 0
    for (let product of selectList) {
      let price = this.getProductPrice(product)
      let reduce = this.getProductReduce(product)
      totalAmount += price
      productReduce += reduce
      selectedCount += product.productSkuId == product.productSaleSpecId ? product.buyCount : product.buyCount * product.saleSpecQuantity
    }
    productReduce = productReduce + totalDiscountReduce
    //酒批商品的总价，立减（用于计算起送金额）
    let jiupiTotalAmount = 0
    let jiupiProductReduce = 0
    
    for (let product of jiupiSelectList) {
      let price = this.getProductPrice(product)
      let reduce = this.getProductReduce(product)
      jiupiTotalAmount += price
      jiupiProductReduce += reduce
    }
    let jiupiUseCoupon = this.getJiupiCanUseCoupon(jiupiSelectList)
    //这里需要取当前计算过程中的值，取this.data的值会造成不一致
    let noticeTags = this.updateNoticeTagsShow(gatherResult.hasGather, gatherResult.isAllGatherSuccess, selfPickUpReduce, jiupiUseCoupon.jiupiUseCouponPrompt.prompt)
    return {
      noticeTags,
      selectedCount, selfPickUpReduce,
      productReduce,
      totalDiscountReduce,
      canBackShopCart: hasNotSelectProduct || hasMultiGroup,
      payAmount: totalAmount - productReduce,//支付总金额，减去了凑单,会员立减，商品立减的优惠金额
      jiupiPayAmount: jiupiTotalAmount - jiupiProductReduce,//酒批商品的支付总金额，减去了凑单,会员立减，商品立减的优惠金额
      //凑单相关信息
      hasGather: gatherResult.hasGather,
      isAllGatherSuccess: gatherResult.isAllGatherSuccess,
      halfGatherNoticeData: gatherResult.halfGatherNoticeData,
      //全部凑单完毕还差另购金额
      allGatherNeedAmount: gatherResult.allGatherNeedAmount,
      //全部凑单完成能优惠多少钱
      allGatherReduce: gatherResult.allGatherReduce,
      //凑单优惠了多少钱
      gatherReduce: gatherResult.gatherReduce,
      //凑单完毕需要的另购总额
      extraBuyTotalNeedAmount: gatherResult.extraBuyTotalNeedAmount,
      //已经参与另购的商品总额
      extraBuyAmount: gatherResult.extraBuyAmount,
      jiupiUseCouponPrompt: jiupiUseCoupon.jiupiUseCouponPrompt.prompt,
      wiiUseCoupon: jiupiUseCoupon.jiupiUseCouponPrompt.wiiUseCoupon,
      jiupiCanUseCouponAmount: jiupiUseCoupon.jiupiCanUseCouponAmount
    }
  },
  //购物车中久批商品对应的优惠卷提示
  getJiupiCanUseCoupon(jiupiSelectList){
    //久批商品可用优惠卷的金额
    let jiupiCanUseCouponAmount = 0
    //久批商品对应的优惠卷提示
    for (let product of jiupiSelectList) {
      let price = this.getProductPrice(product)
      let reduce = this.getProductReduce(product)
      if (product.isUseCoupon) {
        jiupiCanUseCouponAmount = jiupiCanUseCouponAmount + (price * 1000 - reduce*1000)/1000
      }
    }
    jiupiCanUseCouponAmount = parseFloat(jiupiCanUseCouponAmount).toFixed(2)
    let jiupiUseCouponPrompt = AddToShopCartUtil.getUserCouponPromptForCart(jiupiCanUseCouponAmount)
    return { jiupiUseCouponPrompt, jiupiCanUseCouponAmount}
  },
  //取得当前购物车的凑单相关数据
  getGatherResult(productList) {
    let extraBuyTotalNeedAmount = 0//另购满多少凑单完毕
    let allGatherNeedAmount = 0//全部凑单完毕还差多少钱
    let gatherReduce = 0//凑单优惠了多少钱
    let allGatherReduce = 0//全部凑单完成能优惠多少钱
    let extraBuyAmount = 0//已经参与另购的商品总额
    let hasGather = false//是否触发了凑单
    let isAllGatherSuccess = false//是否凑单成功

    /****商品分组****/
    let gatherList = [] //勾选的参与凑单商品
    let otherList = []//选择的商品中不属于凑单商品的列表
    let gatherOtherList = []//满足另购的商品列表
    for (let product of productList) {
      if (product.saleMode != 2 && product.saleMode != 6 && product.productPrice.gatherOrderPrice > 0) {
        gatherList.push(product)
      } else {
        otherList.push(product)
      }
    }
    //处理另购商品
    let gatherBlackList = this.data.gatherOrder.productSkuBlackList || []
    for (let product of otherList) {
      let isSup = product.saleMode == 2 //是合作商
      let isDealer = product.saleMode == 6//是经销商
      let isPreSale = product.stockState == 4//是预售
      let isTimeLimit = product.enjoyPromotions && product.enjoyPromotions.length && product.enjoyPromotions[0].promotionType == 4//是限时惠
      let isInBlackList = gatherBlackList.length && gatherBlackList.findIndex(item => item == product.productSkuId) != -1 //是黑名单商品
      if (product.select && !isSup && !isDealer && !isPreSale && !isTimeLimit && !isInBlackList) {//满足所有条件才能算入另购
        gatherOtherList.push(product)
      }
    }
    /****开始计算价格****/
    //是否触发了凑单
    hasGather = gatherList.length ? true : false
    //计算完全满足凑单另购所需总金额
    for (let product of gatherList) {
      //购买数量可能会超过正常库存，超出的部分会按照预售处理，所以这里取库存和购买数量的最小值
      extraBuyTotalNeedAmount += product.orderAmount * Math.min(product.storeCount, product.buyCount);
    }
    //取得已选的另购商品的总价
    for (let gatherOtherProduct of gatherOtherList) {
      extraBuyAmount += this.getProductPrice(gatherOtherProduct, false) - this.getProductReduce(gatherOtherProduct, false)
    }
    let otherAmount = extraBuyAmount
    for (let product of gatherList) {
      let num = otherAmount / product.orderAmount
      //计算凑单商品成功凑单了多少件
      product.gatherCount = Math.min(product.storeCount, product.buyCount, Math.floor(num))
      otherAmount -= product.gatherCount * product.orderAmount
      //凑单实际优惠了多少钱
      gatherReduce += this.getProductGatherReduce(product, false)
      //全部凑单完成能优惠多少钱
      allGatherReduce += this.getProductGatherReduce(product, true)
    }
    //完全满足凑单还需要多少钱                       完全满足凑单另购所需总金额   已选的另购商品的总价
    allGatherNeedAmount = Math.max(0, parseFloat(extraBuyTotalNeedAmount - extraBuyAmount))
    //凑单所需金额为0了即为凑单成功
    isAllGatherSuccess = allGatherNeedAmount == 0 ? true : false
    this.updateShopcartGatherCount(gatherList)
    let halfGatherNoticeData = { extraBuyTotalNeedAmount, gatherList: [...gatherList] }
    return {
      hasGather,//是否触发了凑单
      halfGatherNoticeData,//部分凑单购买的弹框提示
      isAllGatherSuccess, //是否全部凑单完毕
      allGatherNeedAmount,//全部凑单完毕还差另购金额
      allGatherReduce,//全部凑单完成能优惠多少钱
      gatherReduce,//凑单优惠了多少钱
      extraBuyTotalNeedAmount,//凑单完毕需要的另购总额
      extraBuyAmount//已经参与另购的商品总额
    }
  },
  //更新购物车凑单商品的凑单成功数量,将凑单成功的数量反馈到货物列表
  updateShopcartGatherCount(gatherList) {
    let list = this.data.productList
    if (gatherList && gatherList.length) {
      for (let gatherProduct of gatherList) {
        let product = list.find(item => item.shopCartId == gatherProduct.shopCartId)
        let productIndex = list.findIndex(item => item.shopCartId == gatherProduct.shopCartId)
        //这个字段用来展示原价购买对话框，每个商品的凑单情况
        let minStoreNum = Math.min(product.storeCount, product.buyCount)
        let originalBuyGatherInfoStr = (gatherProduct.gatherCount ? `${gatherProduct.gatherCount}件已享受凑单价` : ``) +
          (gatherProduct.gatherCount && minStoreNum != gatherProduct.gatherCount ? `，另外` : ``) +
          (minStoreNum != gatherProduct.gatherCount ? `${minStoreNum - gatherProduct.gatherCount}件未满足凑单条件` : ``)
        this.setData({
          [`productList[${productIndex}].gatherCount`]: gatherProduct.gatherCount,
          [`productList[${productIndex}].originalBuyGatherInfoStr`]: originalBuyGatherInfoStr,
        })
      }
    } else {
      for (let i = 0; i < list.length; i++) {
        if (list[i].viewType == `product` && list[i].productPrice.gatherOrderPrice) {
          this.setData({
            [`productList[${i}].gatherCount`]: 0,
            [`productList[${i}].originalBuyGatherInfoStr`]: ``,
          })
        }
      }
    }

  },
  //返回商品实际凑单优惠了多少钱(是否返回全部凑单优惠的金额)
  getProductGatherReduce(product, isAllGather) {
    //记录原本的凑单数量并在方法结束的时候复原，否则执行完此方法商品的凑单成功数量会为0
    let originalGatherCount = product.gatherCount
    //全部凑单，或者部分凑单
    product.gatherCount = isAllGather ? Math.min(product.storeCount, product.buyCount) : product.gatherCount
    let priceHasGather = this.getProductPrice(product, false)
    //原价
    product.gatherCount = 0
    let priceNotGather = this.getProductPrice(product, false)
    //还原凑单数量
    product.gatherCount = originalGatherCount
    return priceNotGather - priceHasGather
  },
  //获取单个满减活动的累计金额map,将产品所属的优惠活动id为键，该活动下累计的已购金额和件数为值
  getDiscountMap() {
    let discountMap = {}
    for (let item of this.data.productList) {
      if (item.viewType == 'product' && item.discountVO) {
        let isTimeLimit = item.enjoyPromotions && item.enjoyPromotions.length && item.enjoyPromotions[0].promotionType == 4//是限时惠
        let calcAmount = item.select && !isTimeLimit ? (this.getProductPrice(item) - this.getProductReduce(item)) : 0
        //拆包产品不参与满减活动件数的计算，但是参与按金额的计算
        let calcCount = item.select && !isTimeLimit && item.productSkuId == item.productSaleSpecId ? item.buyCount : 0
        if (!discountMap[item.discountVO.discountId]) {
          discountMap[item.discountVO.discountId] = { calcAmount, calcCount }
        } else {
          discountMap[item.discountVO.discountId].calcAmount += calcAmount
          discountMap[item.discountVO.discountId].calcCount += calcCount
        }
      }
    }
    return discountMap
  },
  //取得当前购物车的自提相关数据
  getSelfPickUpReduce(productList) {
    // 计算自提优惠
    let selfPickUpReduce = 0
    for (let item of productList) {
      selfPickUpReduce += this.getProductSelfReduce(item)
    }
    return selfPickUpReduce
  },
  //通过构造的Map去修改每个子分组的金额
  updateDiscountReduceAmount(discountMap) {
    let productList = this.data.productList
    let totalDiscountReduce = 0
    for (let discountId in discountMap) {
      let groupIndex = productList.findIndex(item => item.viewType == 'group' && item.discountVO && discountId == item.discountVO.discountId)
      let newGroupItem = this.rebuildDiscountGroup(productList[groupIndex], discountMap[discountId])
      this.setData({ [`productList[${groupIndex}]`]: newGroupItem })
      totalDiscountReduce += newGroupItem.discountReduce
    }
    return totalDiscountReduce;
  },
  //得到满减活动子分组的提示信息
  rebuildDiscountGroup(group, buyInfo) {
    //坎级模式下，最小的金额值是在最后的
    const discountVO = group.discountVO
    let groupObj = {}
    // 满减分为按件数和按金额
    if (discountVO.discountType == 0) {
      //按件数
      groupObj = this.getDiscountGroupByCount(group, buyInfo.calcCount)
    } else if (discountVO.discountType == 1) {
      //按金额
      groupObj = this.getDiscountGroupByAmount(group, buyInfo.calcAmount)
    }
    //倍增数量提示
    let doublyStr = discountVO.giveMode == 0 && discountVO.discountType == 0 ? `每满${discountVO.giveModeItems[0].meetCount}件` :
      discountVO.giveMode == 0 && discountVO.discountType == 1 ? `每满${discountVO.giveModeItems[0].meetAmount}元` : ``
    groupObj.fullReduceListNotice =
      discountVO.giveMode == 0 ? `${doublyStr}可减${discountVO.giveModeItems[0].reduceAmount}元` :
        discountVO.giveMode == 1 ? `最高可减${discountVO.giveModeItems[0].reduceAmount}元` : ``
    return groupObj
  },
  //按件数满减
  getDiscountGroupByCount(group, buyCount) {
    const discountVO = group.discountVO
    //符合规则的最小购买件数
    let minFitNum = discountVO.giveModeItems[discountVO.giveModeItems.length - 1].meetCount
    //符合规则的最小优惠金额
    let minReduceNum = discountVO.giveModeItems[discountVO.giveModeItems.length - 1].reduceAmount
    //不符合任何一条规则
    if (buyCount < minFitNum) {
      let extraText = buyCount == 0 ? '' : ('，还差' + (minFitNum - buyCount) + '件')
      group.discountText = discountVO.discountName + '，购满' + minFitNum + '件，可减' + minReduceNum.toFixed(2) + '元' + extraText
      group.discountReduce = 0
      group.fit = false
    } else if (discountVO.giveMode == 0) {//倍增模式
      let quotient = parseInt(buyCount / minFitNum) //一定>=1，因为上面吧小于的情况处理了
      group.discountText = discountVO.discountName + '，已购满'
        + (minFitNum * quotient) + '件，已减'
        + (minReduceNum * quotient).toFixed(2) + '元'
      group.discountReduce = minReduceNum * quotient
      group.fit = true
    } else if (discountVO.giveMode == 1) {//坎级模式
      //找出符合的坎级规则Index
      let fitModeItemIndex = discountVO.giveModeItems.findIndex((mode) => mode.meetCount <= buyCount)
      //如果没找到，即超过了最大的一条规则，则选取最大的一条
      fitModeItemIndex = fitModeItemIndex < 0 ? 0 : fitModeItemIndex
      //通过Index去拿规则VO
      let fitModeItem = discountVO.giveModeItems[fitModeItemIndex]
      group.discountText = discountVO.discountName + '，已购满'
        + fitModeItem.meetCount + '件，已减'
        + (fitModeItem.reduceAmount).toFixed(2) + '元'
      group.discountReduce = fitModeItem.reduceAmount
      group.fit = true
    }
    return group
  },
  //按金额满减
  getDiscountGroupByAmount(group, buyAmount) {
    const discountVO = group.discountVO
    //符合规则的最小购买金额
    let minFitNum = discountVO.giveModeItems[discountVO.giveModeItems.length - 1].meetAmount
    //符合规则的最小优惠金额
    let minReduceNum = discountVO.giveModeItems[discountVO.giveModeItems.length - 1].reduceAmount
    //不符合任何一条规则
    if (buyAmount < minFitNum) {
      let extraText = buyAmount == 0 ? '' : ('，还差' + (minFitNum - buyAmount).toFixed(2) + '元')
      group.discountText = discountVO.discountName + '，购满' + minFitNum.toFixed(2) + '元，可减' + minReduceNum.toFixed(2) + '元' + extraText
      group.discountReduce = 0
      group.fit = false
    } else if (discountVO.giveMode == 0) {//倍增模式
      let quotient = parseInt(buyAmount / minFitNum) //一定>=1，因为上面吧小于的情况处理了
      group.discountText = discountVO.discountName + '，已购满'
        + (minFitNum * quotient).toFixed(2) + '元，已减'
        + (minReduceNum * quotient).toFixed(2) + '元'
      group.discountReduce = minReduceNum * quotient
      group.fit = true
    } else if (discountVO.giveMode == 1) {//坎级模式
      //找出符合的坎级规则Index
      let fitModeItemIndex = discountVO.giveModeItems.findIndex((mode) => mode.meetAmount <= buyAmount)
      //如果没找到，即超过了最大的一条规则，则选取最大的一条
      fitModeItemIndex = fitModeItemIndex < 0 ? 0 : fitModeItemIndex
      //通过Index去拿规则VO
      let fitModeItem = discountVO.giveModeItems[fitModeItemIndex]
      group.discountText = discountVO.discountName + '，已购满'
        + (fitModeItem.meetAmount).toFixed(2) + '元，已减'
        + (fitModeItem.reduceAmount).toFixed(2) + '元'
      group.discountReduce = fitModeItem.reduceAmount
      group.fit = true
    }
    return group
  },
  //返回商品的计算价格(是否考虑超出库存的商品数量)
  getProductPrice(product, includePresale = true) {
    let price = 0.00,
      saleSpec = product.saleSpecQuantity,
      orPrice = product.productPrice.price,
      gaPrice = product.productPrice.gatherOrderPrice,
      gaCount = product.gatherCount,
      buyCount = includePresale ? product.buyCount : Math.min(product.storeCount, product.buyCount);
    if (gaCount > 0) {//凑单商品
      price = gaPrice * gaCount * saleSpec + orPrice * (buyCount - gaCount) * saleSpec
    } else {
      price = orPrice * saleSpec * buyCount;
    }
    return price;
  },
  //返回商品的立减价格(是否考虑超出库存的商品数量)
  getProductReduce(product, includePresale = true) {
    let buyCount = includePresale ? product.buyCount : Math.min(product.storeCount, product.buyCount)
    return product.productPrice.reducePrice * product.saleSpecQuantity * buyCount;
  },
  //返回商品的自提优惠
  getProductSelfReduce(product) {
    return product.productPrice.selfPickUpReduceAmount * product.saleSpecQuantity * product.buyCount;
  },
  //隐藏顶部提示
  onTagHideTag(e) {
    const tag = e.currentTarget.dataset.tag
    let { noticeTags } = this.data
    let changeIndex = noticeTags.findIndex(item => item.keyWord == tag)
    this.setData({ [`noticeTags[${changeIndex}].show`]: false })
  },
  //点击商品的减号
  onSubShopCartBuyNum(e) {
    wx.showLoading({
      title: '处理中',
      mask: true
    })
    const shopCartId = e.currentTarget.dataset.shopCartId
    let { productList } = this.data
    let product = productList.find(item => item.shopCartId == shopCartId)
    let beforeNum = product.buyCount
    if (!product.canSelect) return wx.hideLoading()
    let productIndex = productList.findIndex(item => item.shopCartId == shopCartId)
    let afterSubNum = (product.buyCount - 1) < product.minBuyNum ? product.minBuyNum :
      (product.buyCount - 1) > product.maxBuyNum ? product.maxBuyNum :
        (product.buyCount - 1)
    //购物车数量大于最大库存，点击加减要更改提示的状态
    product.buyCount = afterSubNum
    const canSelectResult = this.getCanSelect(product)
    product.canSelect = canSelectResult.canSelect
    product.cantSelectReason = canSelectResult.reason
    productList[productIndex] = product;
    let productSelectState = { [`productList[` + productIndex + `]`]: product }
    let reCalcPriceData = this.reCalcPrice(productList);
    let setData = FunctionUtils.combineArguments(reCalcPriceData, productSelectState)
    let that = this
    this.setData(setData, function (e) {
      wx.hideLoading()
    })
    if (beforeNum != afterSubNum) {
      this.updateShopCart(product, afterSubNum)
    }

  },
  //点击商品的加号
  onAddShopCartBuyNum(e) {
    wx.showLoading({
      title: '处理中',
      mask: true
    })
    const shopCartId = e.currentTarget.dataset.shopCartId
    let { productList } = this.data
    let product = productList.find(item => item.shopCartId == shopCartId)
    let beforeNum = product.buyCount
    if (!product.canSelect) return wx.hideLoading()
    let productIndex = productList.findIndex(item => item.shopCartId == shopCartId)
    let afterAddNum = (product.buyCount + 1) < product.minBuyNum ? product.minBuyNum :
      (product.buyCount + 1) > product.maxBuyNum ? product.maxBuyNum :
        (product.buyCount + 1)
    //购物车数量大于最大库存，点击加减要更改提示的状态
    product.buyCount = afterAddNum
    const canSelectResult = this.getCanSelect(product)
    product.canSelect = canSelectResult.canSelect
    product.cantSelectReason = canSelectResult.reason
    productList[productIndex] = product
    let productInfo = { [`productList[` + productIndex + `]`]: product }
    let reCalcPriceData = this.reCalcPrice(productList);
    let setData = FunctionUtils.combineArguments(reCalcPriceData, productInfo)
    let that = this
    this.setData(setData, function (e) {
      wx.hideLoading()
    })
    if (beforeNum != afterAddNum) {
      this.updateShopCart(product, afterAddNum)
    }
  },
  //直接输入商品数量
  onInputShopCartBuyNum(e) {
    wx.showLoading({
      title: '处理中',
      mask: true
    })
    const shopCartId = e.currentTarget.dataset.shopCartId
    let { productList } = this.data
    let product = productList.find(item => item.shopCartId == shopCartId)
    let beforeNum = product.buyCount
    if (!product.canSelect) return wx.hideLoading()
    let productIndex = productList.findIndex(item => item.shopCartId == shopCartId)
    let ratio = (product.productSkuId == product.productSaleSpecId ? 1 : product.saleSpecQuantity) || 1
    let inputNum = parseInt(e.detail.value) || product.minBuyNum
    inputNum = inputNum < product.minBuyNum * ratio ? product.minBuyNum * ratio : inputNum > product.maxBuyNum * ratio ? product.maxBuyNum * ratio : inputNum
    //拆包情况下输入的不是规格的倍数
    if (product.productSkuId != product.productSaleSpecId && inputNum % ratio != 0) {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        dialogData: { text: `此商品只能以${ratio}的倍数购买` },
        hiddenCancel: true, confirmText: `我知道了`
      })
      this.setData({ [`productList[` + productIndex + `].buyCount`]: beforeNum })
      return
    }
    //购物车数量大于最大库存，点击加减要更改提示的状态
    product.buyCount = inputNum / ratio
    const canSelectResult = this.getCanSelect(product)
    product.canSelect = canSelectResult.canSelect
    product.cantSelectReason = canSelectResult.reason
    productList[productIndex] = product;
    let productinfo = { [`productList[` + productIndex + `]`]: product }
    let reCalcPriceData = this.reCalcPrice(productList);
    let setData = FunctionUtils.combineArguments(reCalcPriceData, productinfo)
    let that = this
    this.setData(setData, function (e) {
      wx.hideLoading()
    })
    if (beforeNum != inputNum / ratio) {
      this.updateShopCart(product, inputNum / ratio)
    }
  },
  //分开结算分组
  getSplitList(selectList, isSelfPickUp) {
    //根据商品来源分组(合作商是一组的)
    let map = {}
    for (let product of selectList) {
      if (product.saleMode == 6) {
        if (!map[product.companyId]) {
          map[product.companyId] = [product]
        } else {
          map[product.companyId].push(product)
        }
      } else if (product.saleMode == 2) {
        if (!map['sup']) {
          map['sup'] = [product]
        } else {
          map['sup'].push(product)
        }
      } else {
        if (!map['jiuPi']) {
          map['jiuPi'] = [product]
        } else {
          map['jiuPi'].push(product)
        }
      }
    }
    let splitPayList = []
    //酒批商品排在第一位
    if (map['jiuPi']) {
      let obj = { companyName: '易久批', id: `jiupi`, select: false, buyCount: 0, amount: 0, list: [], saleMode: 0, isSelfPickUp }
      for (let item of map['jiuPi']) {
        obj.buyCount += item.productSkuId == item.productSaleSpecId ? item.buyCount : item.buyCount * item.saleSpecQuantity
        obj.amount += (this.getProductPrice(item) - this.getProductReduce(item))
        obj.list.push(item)
      }
      obj.amount -= isSelfPickUp ? this.data.selfPickUpReduce : 0
      obj.amount -= this.data.totalDiscountReduce
      obj.amount = obj.amount.toFixed(2)
      splitPayList.push(obj)
    }
    //处理经销商分组
    for (let key in map) {
      if (key == 'jiuPi' || key == 'sup') continue
      let companyName = map[key][0].companyName
      let companyId = map[key][0].companyId
      let obj = { companyName: companyName, id: companyId, select: false, buyCount: 0, amount: 0, list: [], saleMode: 6, isSelfPickUp }
      for (let item of map[key]) {
        obj.buyCount += item.buyCount
        obj.amount += (this.getProductPrice(item) - this.getProductReduce(item))
        obj.list.push(item)
      }
      obj.amount = obj.amount.toFixed(2)
      splitPayList.push(obj)
    }
    //合作商品排在最后一位
    if (map['sup']) {
      let obj = { companyName: '其他', id: `sup`, select: false, buyCount: 0, amount: 0, list: [], saleMode: 2, isSelfPickUp }
      for (let item of map['sup']) {
        obj.buyCount += item.buyCount
        obj.amount += (this.getProductPrice(item) - this.getProductReduce(item))
        obj.list.push(item)
      }
      obj.amount = obj.amount.toFixed(2)
      splitPayList.push(obj)
    }
    return splitPayList
  },
  //分开结算对话框选中
  onSplitPaySelect(e) {
    let { id } = e.currentTarget.dataset
    let hasSelectItemIndex = this.data.$yjp.dialog.dialogData.splitPayList.findIndex(item => item.select == true)
    let selectItemIndex = this.data.$yjp.dialog.dialogData.splitPayList.findIndex(item => item.id == id)
    this.setData({
      [`$yjp.dialog.dialogData.splitPayList[${hasSelectItemIndex}].select`]: false,
      [`$yjp.dialog.dialogData.splitPayList[${selectItemIndex}].select`]: true
    })
  },
  //分开结算确定按钮
  onSplitPayConfirm() {
    let selectItem = this.data.$yjp.dialog.dialogData.splitPayList.find(item => item.select == true)
    if (selectItem.saleMode == 2) {
      this.placeSupOrder(selectItem.list, selectItem.isSelfPickUp)
    } else if (selectItem.saleMode == 6) {
      this.placeDealerOrder(selectItem.list, selectItem.isSelfPickUp)
    } else {
      this.placeJiupiOrder(selectItem.list, selectItem.isSelfPickUp, selectItem.amount)
    }
  },
  //点击下单按钮
  placeOrder(e) {
    wx.showLoading({
      title: '处理中',
      mask: true
    })
    let { userState, auditRejectionReason, editing } = this.data
    if (editing) return
    if (userState == 3) {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        hiddenCancel: true, confirmText: `我知道了`,
        dialogData: { text: `您的账号未通过审核,审核通过后可下单，审核不通过原因:${auditRejectionReason}` }
      })
      return wx.hideLoading()
    }
    const tag = e.currentTarget.dataset.tag
    const isSelfPickUp = tag == `selfPick`
    if (isSelfPickUp){
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '购买分析-自提下单点击', eventType: 503, actionId: 0})
    }else{
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '购买分析-送货下单点击', eventType: 504, actionId: 0})
    }
    let { productList } = this.data
    let selectList = productList.filter(item => item.viewType == `product` && item.select)
    //不能购买的情况
    let buyLimitCount = 0
    selectList.forEach(item => {
      if (item.cantSelectReason) {
        ++buyLimitCount
      }
    })
    if (!selectList.length) {
      $yjpToast.show({ text: `请选择结算的商品` })
      return wx.hideLoading()
    } else if (buyLimitCount != 0) {
      $yjpToast.show({ text: `${buyLimitCount}件产品超出购买限制` })
      return wx.hideLoading()
    }
    let splitPayList = this.getSplitList(selectList, isSelfPickUp)
    //如果分开结算的对话框的数据源长度只有1则不需要弹窗
    if (splitPayList.length == 1) {
      if (splitPayList[0].saleMode == 2) {
        this.placeSupOrder(splitPayList[0].list, isSelfPickUp)
      } else if (splitPayList[0].saleMode == 6) {
        this.placeDealerOrder(splitPayList[0].list, isSelfPickUp)
      } else {
        this.placeJiupiOrder(splitPayList[0].list, isSelfPickUp, splitPayList[0].amount)
      }
    } else {
      //将第一组设置为勾选状态
      splitPayList[0].select = true
      $yjpDialog.open({
        dialogType: `splitPay`, title: `请分开结算以下商品`,
        onConfirm: `onSplitPayConfirm`,
        dialogData: { splitPayList }
      })
    }
    wx.hideLoading()
  },
  //合作商下单
  placeSupOrder(productList, isSelfPickUp) {
    if (isSelfPickUp) {
      $yjpToast.show({ text: `合作商不支持自提` })
    } else {
      this.goToOrderSubmit(productList, isSelfPickUp)
    }
  },
  //经销商下单
  placeDealerOrder(productList, isSelfPickUp) {
    if (isSelfPickUp) {
      $yjpToast.show({ text: `经销商不支持自提` })
    } else {
      this.goToOrderSubmit(productList, isSelfPickUp)
    }
  },
  //酒批下单
  placeJiupiOrder(productList, isSelfPickUp, amount) {
    //先判断是否达到了起送金额
    if (parseFloat(amount) < this.data.minBuyAmount) {
      return $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        dialogData: { text: `满${this.data.minBuyAmount}元起送，还差${(this.data.minBuyAmount - parseFloat(amount)).toFixed(2)}元` },
        cancelText: `取消`, confirmText: `去添加商品`,
        onConfirm: () => {
          App.WxService.navigateTo(App.Constants.Route.productList)
        }
      })
    }
    if (this.data.hasGather && !this.data.isAllGatherSuccess) {//部分凑单
      //部分凑单弹框
      $yjpDialog.open({
        dialogType: `originalBuy`, title: `温馨提示`,
        onCancel: `onOriginalBuy`, onConfirm: `goToGatherList`,
        confirmText: `去凑单`, cancelText: `按原价购买`,
        dialogData: {
          halfGatherNoticeData: this.data.halfGatherNoticeData,//凑单商品列表
          originalBuyData: { productList, isSelfPickUp }//原价购买需要传选中的数据
        }
      })
    } else {//凑单成功或者没有凑单
      this.goToOrderSubmit(productList, isSelfPickUp)
    }
  },
  //原价购买
  onOriginalBuy(e) {
    this.goToOrderSubmit(
      this.data.$yjp.dialog.dialogData.originalBuyData.productList,
      this.data.$yjp.dialog.dialogData.originalBuyData.isSelfPickUp)
  },
  //跳转到某个特定的商品（降价，限购）PS:商品id不能纯数字，否则scroll不起效
  goToSpecialItem(e) {
    let { productList, joinAfterReduceIndex, limitBuyIndex } = this.data
    const keyWord = e.currentTarget.dataset.keyWord
    let productArr
    if (keyWord == `降价`) {
      productArr = productList.filter(item => item.productPrice && item.productPrice.joinAfterReduceAmount)
      if (productArr.length != 0) {
        if (joinAfterReduceIndex > productArr.length - 1) {
          joinAfterReduceIndex = 0
        }
        this.setData({ scrollPosition: `product-${productArr[joinAfterReduceIndex].shopCartId}`, joinAfterReduceIndex: ++joinAfterReduceIndex })
      }
    } else if (keyWord == `限购`) {
      productArr = productList.filter(item => item.cantSelectReason)
      if (productArr.length != 0) {
        if (limitBuyIndex > productArr.length - 1) {
          limitBuyIndex = 0
        }
        this.setData({ scrollPosition: `product-${productArr[limitBuyIndex].shopCartId}`, limitBuyIndex: ++limitBuyIndex })
      }
    }
  },
  //商品详情
  goToProductDetail(e) {
    let { productList } = this.data
    const shopCartId = e.currentTarget.dataset.shopCartId
    let product = productList.find(item => item.shopCartId == shopCartId)
    const isZuhe = product.productType == 2
    const isTimeLimit = !!product.sourceDesc
    if (isZuhe) {
      App.WxService.navigateTo(App.Constants.Route.comAtyDetail, { activityId: product.productSkuId })
    } else if (isTimeLimit) {
      App.WxService.navigateTo(App.Constants.Route.productDetail, {
        productSkuId: product.productSkuId,
        activityId: product.sourceId,
        activityName: product.sourceDesc,
        activityStartTime: product.beginDate,
        activityEndTime: product.endDate,
        activityState: 2,
        promotionType: 4,
        enjoyUserLevelDiscount: product.enjoyUserLevelDiscount
      })
    } else if (product.saleMode == 8) {
      App.WxService.navigateTo(App.Constants.Route.productDetail, {
        productSkuId: product.productSkuId
      })
    } else {
      App.WxService.navigateTo(App.Constants.Route.productDetail, { productSkuId: product.productSkuId })
    }
  },
  //去订单提交页面
  goToOrderSubmit(productList, isSelfPickUp) {
    let { canBackShopCart } = this.data
    let productDataList = JSON.stringify(productList);
    let list = encodeURIComponent(productDataList)
    App.WxService.navigateTo(App.Constants.Route.orderSubmit, { productList: list, isSelfPickUp, fromShoppingCar: true, needdecodeURI: true, canBackShopCart })
  },
  //去凑单列表
  goToGatherList() {
    App.WxService.navigateTo(App.Constants.Route.productList, { isFromGather: true, allGatherNeedAmount: this.data.allGatherNeedAmount })
  },
  //去优惠券凑单列表
  goToCouponGatherList() {
    App.WxService.navigateTo(App.Constants.Route.productList, { isFromCouponGather: true, 
      jiupiCanUseCouponAmount: this.data.jiupiCanUseCouponAmount, wiiUseCoupon: this.data.wiiUseCoupon })
  },
  //去满减列表
  goToFullReduceList(e) {
    const discountId = e.currentTarget.dataset.discountId
    const fullReduceListNotice = e.currentTarget.dataset.fullReduceListNotice
    App.WxService.navigateTo(App.Constants.Route.productList, { isFromFullReduce: true, discountId, fullReduceListNotice })
  },
  goToProductList(e) {
    App.WxService.navigateTo(App.Constants.Route.productList)
  },
  //去首页
  goToHomePage() {
    App.WxService.switchTab(App.Constants.Route.homePage)
  },
  //去经销商店铺
  goToDealerShop(e) {
    const shopId = e.currentTarget.dataset.shopId
    const saleMode = e.currentTarget.dataset.saleMode
    if (saleMode != 6) return
    App.WxService.navigateTo(App.Constants.Route.dealer, { shopId })
  },
  //点击页面元素触发
  onTap(e) {
    const tag = e.currentTarget.dataset.tag
    const shopCartId = e.currentTarget.dataset.shopCartId
    switch (tag) {
      case `globalSelect`:
        this.switchGlobalSelect()
        break;
      case `finish`:
      case `globalEdit`:
        let afterBoo = !this.data.editing
        this.setData({ editing: afterBoo })
        let productList = this.data.productList
        //编辑完成要把选中的不可选商品设为不可选
        if (!afterBoo) {
          for (let i = 0; i < productList.length; i++) {
            if (productList[i].viewType == `product` && !productList[i].canSelect) {
              productList[i].select = false
              this.setData({ [`productList[${i}].select`]: false })
            }
          }
        }
        //更新分组选中
        this.updateAllGroupSelect()
        break;
      case `deleteSelect`:
        this.deleteSelect(`valid`)
        break;
      case `deleteInvalid`:
        this.deleteSelect(`invalid`)
        break;
      case `productSelect`:
        this.switchProductSelect(shopCartId)
        break;
      case `groupSelect`:
        this.switchGroupSelect(shopCartId)
        break;
      default:
        break;
    }
  },
  //点击顶部全选按钮
  switchGlobalSelect() {
    wx.showLoading({
      title: '处理中',
      mask: true
    })
    let { productList, globalSelect, editing } = this.data
    this.setData({ globalSelect: !globalSelect })
    //此方法能提升性能，既避免了多次setData，也避免了一次性set大量数据
    let selectArr = {}
    for (let i = 0; i < productList.length; i++) {
      //编辑模式下，所有商品可选，可删除
      if ((editing ? true : productList[i].canSelect) && productList[i].select == globalSelect) {
        selectArr[`productList[${i}].select`] = !globalSelect
        productList[i].select = !globalSelect;
      }
    }
    let reCalcPriceData = this.reCalcPrice(productList);
    let setData = FunctionUtils.combineArguments(reCalcPriceData, selectArr)
    let that = this
    this.setData(setData, function (e) {
      wx.hideLoading()
    })

  },
  updateGlobalSelect() {
    let { productList, editing } = this.data
    //编辑模式下，所有商品可选，可删除
    let groupTemp = productList.filter(item => item.viewType == `group` && (editing ? true : item.canSelect) && !item.isSubGroup)
    let isAllGroupSelect = groupTemp.every(item => item.select == true)
    return { globalSelect: isAllGroupSelect }
  },
  //点击分组
  switchGroupSelect(shopCartId) {
    let { productList, editing } = this.data
    const group = productList.find(item => item.shopCartId == shopCartId)
    const groupIndex = productList.findIndex(item => item.shopCartId == shopCartId)
    let beforeSelectBoolean = group.select
    if (editing ? true : group.canSelect) {
      wx.showLoading({
        title: '处理中',
        mask: true
      })
      let productInfo = { [`productList[${groupIndex}].select`]: !beforeSelectBoolean }
      productList[groupIndex].select = !beforeSelectBoolean
      //当前组中的商品选中控制
      let selectArr = {}
      for (let i = 0; i < productList.length; i++) {
        if (productList[i].viewType == `product` && (editing ? true : productList[i].canSelect)
          && productList[i].groupId == group.groupId && productList[i].select == !!beforeSelectBoolean) {
          selectArr[`productList[${i}].select`] = !beforeSelectBoolean
          productList[i].select = !beforeSelectBoolean
        }
      }
      //全选控制
      let GlobalSelect = this.updateGlobalSelect()
      //金额相关计算
      let reCalcPriceData = this.reCalcPrice(productList);
      //合并需要set的属性
      let setData = FunctionUtils.combineArguments(productInfo, GlobalSelect, selectArr, reCalcPriceData)
      let that = this
      this.setData(setData, function (e) {
        wx.hideLoading()
      })
    } else {
      return
    }
  },
  updateGroupSelect(groupId) {
    let { productList, editing } = this.data
    //编辑模式下，所有商品可选，可删除
    let groupIndex = productList.findIndex(item => item.viewType == `group` && (editing ? true : item.canSelect) && !item.isSubGroup && item.groupId == groupId)
    let productTemp = productList.filter(item => item.viewType == `product` && (editing ? true : item.canSelect) && item.groupId == groupId)
    let isAllProductSelect = productTemp.every(item => item.select == true)
    let productInfo = { [`productList[${groupIndex}].select`]: isAllProductSelect }
    let GlobalSelec = this.updateGlobalSelect()
    let setData = FunctionUtils.combineArguments(productInfo, GlobalSelec)
    this.setData(setData)
  },
  updateAllGroupSelect() {
    for (let product of this.data.productList) {
      if (product.viewType == `group`) {
        this.updateGroupSelect(product.groupId)
      }
    }
  },
  //点击单个商品的选择按钮
  switchProductSelect(shopCartId) {
    wx.showLoading({
      title: '处理中',
      mask: true
    })
    //1，先处理当前商品的选中，2，再处理当前商品对应的组是否要选中，3，最后判断全选按钮是否需要选中,4，最终同时修改setData中数据
    let { productList, editing } = this.data
    const product = productList.find(item => item.shopCartId == shopCartId)
    const productIndex = productList.findIndex(item => item.shopCartId == shopCartId)
    let currentProductSelect = product.select
    //改变当前productList中商品的选中状态，用下面判断是否要选中分组以及是否要全选
    productList[productIndex].select = !currentProductSelect

    if (editing ? true : product.canSelect) {
      //找出当前商品所在的分组，以及当前分组的所有商品
      let groupIndex = productList.findIndex(item => item.viewType == `group` && (editing ? true : item.canSelect)
        && !item.isSubGroup && item.groupId == product.groupId)
      let productTemp = productList.filter(item => item.viewType == `product` && (editing ? true : item.canSelect)
        && item.groupId == product.groupId)
      //获取当前组的商品是否全部被选中的状态
      let isCurrentGroupProductSelect = productTemp.every(item => item.select == true)
      //改变当前分组的选中状态，用下面判断是否要全选
      productList[groupIndex].select = isCurrentGroupProductSelect

      //获取所有的分组商品
      let groupTemp = productList.filter(item => item.viewType == `group` && (editing ? true : item.canSelect) && !item.isSubGroup)
      //获取所有的分组商品是否被全部选中的状态
      let isAllGroupSelect = groupTemp.every(item => item.select == true)

      //统一修改商品，商品组，全选的状态
      let productSelectStateData = {
        [`productList[${productIndex}].select`]: !currentProductSelect,
        [`productList[${groupIndex}].select`]: isCurrentGroupProductSelect,
        globalSelect: isAllGroupSelect
      }
      let reCalcPriceData = this.reCalcPrice(productList);
      //合并商品对象的属性
      let setData = FunctionUtils.combineArguments(reCalcPriceData, productSelectStateData)
      let that = this
      this.setData(setData, function (e) {
        wx.hideLoading()
      })
    } else {
      //经销商商品价格过期，申请进货需要提示
      if (product.saleMode == 6 && !product.productPrice.price) {
        $yjpToast.show({ text: product.productPrice.lastBuyPrice ? `价格已过期，请联系经销商重新进货` : `请联系经销商申请进货价格` })
      }
      return wx.hideLoading()
    }
  },
  updateProductSelect(groupId, boo) {
    let { productList, editing } = this.data
    let selectArr = {}
    for (let i = 0; i < productList.length; i++) {
      if (productList[i].viewType == `product` && (editing ? true : productList[i].canSelect) && productList[i].groupId == groupId && productList[i].select == !boo) {
        selectArr[`productList[${i}].select`] = boo
      }
    }
    this.setData(selectArr)
  },
  //上传购物车数量
  updateShopCart(product, newNum) {
    App.HttpService.updateShopCart({
      datas: [{ count: newNum, shopCartId: product.shopCartId }]
    })
      .catch(e => { })
  },
  loadMoreRecommendList() {
    loadMoreRecommendList(this)
  },
  getUserCouponData() {
    var _this = this 
    let data = { couponState: 1, couponType: 0, couponUseType: 2, shopCoupon: false }
    return App.HttpService.myCoupon({ currentPage: 1, pageSize: 20, data })
      .then(data => {
        if(data.data && data.data.length){
          let displayCoupon = (data.data.sort(function (a, b) {
            if (a.useOrderAmountFrom == b.useOrderAmountFrom){
              return  new Date(a.timeExpired) - new Date(b.timeExpired);
            }else{
              return a.useOrderAmountFrom - b.useOrderAmountFrom;
            }
          }))[0]
          _this.setData({ displayCoupon:displayCoupon})
        }
        wx.setStorage({
          key: 'myCouponData',
          data: data,
        })
      })
      .catch(e => { })
  },
  //批量删除购物车商品
  deleteSelect(keyWord) {
    let removeList = []
    if (keyWord == `valid`) {
      //删除选中的产品(删除完记得看列表是否为空,分组内产品是否还有,直接重新请求一遍列表)
      let { productList } = this.data
      for (let item of productList) {
        if (item.viewType == `product` && item.select) {
          removeList.push(item.shopCartId)
        }
      }
    } else if (keyWord == `invalid`) {
      //删除失效产品
      let { invalidProductList } = this.data
      for (let item of invalidProductList) {
        removeList.push(item.shopCartId)
      }
    }
    App.HttpService.removeShopCart({ datas: removeList })
      .then(data => {
        if (keyWord == `valid`) {
          $yjpToast.show({ text: `删除成功` })
          let notInitSelectState = true
          this.getShopCartData(notInitSelectState)
        } else if (keyWord == `invalid`) {
          $yjpToast.show({ text: `删除成功` })
          this.setData({ invalidProductList: [] })
        }
      })
      .catch(e => $yjpToast.show({ text: e }))
  },
  secondEvt() {
    App.WxService.navigateTo(App.Constants.Route.proAndDis, { categoryType: 0 })
  },
  //购物车为空时 去使用一张优惠券
  useOnlyEmptyCoupon(e){
    App.WxService.navigateTo(App.Constants.Route.productList, {isFromCouponGather:true})
  }
})