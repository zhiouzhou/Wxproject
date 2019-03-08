// pages/shopCart/getMoreProduct/getMoreProduct.js
const App = getApp()
import { ProductUtil, CouponCodeUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'
Page({
  data: {
    source: ``,
    productList: [],//列表展示的商品数组
    addProductList: [],//添加的商品数组
    totalAmount: 0,//添加的商品总金额
    totalCount: 0,//添加的商品总数量
    //优惠码相关
    discountNotice: ``,//优惠码顶部提示
    couponCodeDetail: {},
    giveUpUseCouponCode: true,
    productBuyAmount: 0,//前一个页面已购买的金额（优惠码）
    productBuyCount: 0,//前一个页面已购买的数量（优惠码）
    //优惠券相关
    couponNotice: ``,//优惠券顶部提示
    couponAmountFrom: 0,//优惠券启用金额
    couponAmount: 0,//优惠券减免金额
    totalAmount: 0,//当前页面，优惠券商品的总价
    currentPage: 1,
    pageSize: 20,
    hiddenPriceText: ``,

  },
  onLoad: function (options) {
    const source = options.source
    //隐藏价格
    const settingValue = App.globalData.settingValue
    const UnLoginPriceDesc = settingValue.UnLoginPriceDesc || `登录后查看价格`
    const PendingAuditPriceDesc = settingValue.PendingAuditPriceDesc || `审核通过后可以查看价格`
    const hiddenPriceText = wx.getStorageSync(`isVisitor`) ? UnLoginPriceDesc : App.globalData.userDetail.state != 1 ? PendingAuditPriceDesc : ``//隐藏价格提示
    //页面高度

    const systemInfo = App.globalData.systemInfo
    const noticeHeight = systemInfo.windowWidth / 750 * 80
    const buttonHeight = systemInfo.windowWidth / 750 * 98
    if (source == `couponCode`) {
      const couponCodeDetail = JSON.parse(options.couponCodeDetail)
      const productBuyAmount = parseFloat(options.productBuyAmount) || 0
      const productBuyCount = parseInt(options.productBuyCount) || 0
      const productSkuId = options.productSkuId
      this.setData({
        source, hiddenPriceText, couponCodeDetail, productBuyAmount, productBuyCount,
        windowHeight: systemInfo.windowHeight - noticeHeight - buttonHeight,
      })
      this.getProductDetail(productSkuId)
    } else if (source == `coupon`) {
      const couponAmountFrom = parseFloat(options.couponAmountFrom) || 0
      const couponAmount = parseFloat(options.couponAmount) || 0
      this.setData({ source, hiddenPriceText, couponAmountFrom, couponAmount, windowHeight: systemInfo.windowHeight - noticeHeight - buttonHeight, })
      this.getListCanUseCoupon()
    }
  },
  //添加优惠码商品，获取优惠码商品的商品详情
  getProductDetail(productSkuId) {
    wx.showLoading({
      title: '加载中',
    })
    return App.HttpService.getProductDetail({ productSkuId })
      .then(data => {
        this.setData({ productList: [this.rebuildSingleProduct(data.data)] })
        this.getAddProductAmountCountNotice()
        wx.hideLoading()
      })
      .catch(e => wx.hideLoading())
  },
  //修改优惠码商品的数据结构
  rebuildSingleProduct(productDetail) {
    productDetail = ProductUtil.rebuildProduct(productDetail, `productList`)
    productDetail.imgUrl = productDetail.imgsUrl[0]
    productDetail.buyNum = 0
    return productDetail
  },
  //获取可选优惠券商品列表
  getListCanUseCoupon() {
    wx.showLoading({
      title: '加载中',
    })
    if (this.data.requesting) return
    this.setData({ requesting: true })
    let { currentPage, pageSize, productList } = this.data
    return App.HttpService.getListCanUseCoupon({ currentPage, pageSize })
      .then(data => {
        if (data.data.length) {
          let newArr = ProductUtil.rebuildProducts(data.data, `productList`)
          let oldArr = productList
          this.setData({ productList: oldArr.concat(newArr), currentPage: ++currentPage, requesting: false })
        } else if (!data.data.length && currentPage == 1) {
          this.setData({ productList: [], requesting: false })
        } else {
          $yjpToast.show({ text: `没有更多数据了` })
        }
        wx.hideLoading()
        this.getAddProductAmountCountNotice()
      })
      .catch(e => {
        wx.hideLoading()
        $yjpToast.show({ text: e })
        this.setData({ requesting: false })
        this.getAddProductAmountCountNotice()
      })
  },
  //点击加号
  onAddProductBuyNum(e) {
    let { productList, addProductList } = this.data
    const productSkuId = e.currentTarget.dataset.productSkuId
    //在产品列表中获取商品
    let product = productList.find(item => item.productSkuId == productSkuId)
    let productIndex = productList.findIndex(item => item.productSkuId == productSkuId)
    let afterNum = (product.buyNum + 1) > product.maxBuyNum ? product.maxBuyNum : (product.buyNum + 1) < product.minBuyNum ? product.minBuyNum : (product.buyNum + 1)
    productList[productIndex].buyNum = afterNum
    //获取商品在添加商品数组里的位置
    let addProductIndex = addProductList.findIndex(item => item.productSkuId == product.productSkuId)
    if (addProductIndex == -1) {
      addProductList.push(product)
    } else {
      addProductList[addProductIndex].buyNum = addProductList[addProductIndex].buyCount = afterNum
    }
    this.setData({ addProductList, productList })
    this.getAddProductAmountCountNotice()
  },
  //手动输入
  onInputProductBuyNum(e) {
    let { productList, addProductList } = this.data
    const productSkuId = e.currentTarget.dataset.productSkuId
    //在产品列表中获取商品
    let product = productList.find(item => item.productSkuId == productSkuId)
    let productIndex = productList.findIndex(item => item.productSkuId == productSkuId)
    let ratio = (product.productSkuId == product.productSaleSpecId ? 1 : product.saleSpecQuantity) || 1
    const originalBuyNum = product.buyNum * ratio
    let afterNum = parseInt(e.detail.value) == 0 ? 0 : parseInt(e.detail.value) ? parseInt(e.detail.value) : product.minBuyNum * ratio
    afterNum = afterNum < product.minBuyNum * ratio ? 0 : afterNum > product.maxBuyNum * ratio ? product.maxBuyNum * ratio : afterNum
    //拆包情况下输入的不是规格的倍数
    if (product.productSkuId != product.productSaleSpecId && afterNum % ratio != 0) {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        dialogData: { text: `此商品只能以${ratio}的倍数购买` },
        hiddenCancel: true, confirmText: `我知道了`
      })
      afterNum = originalBuyNum
    }
    productList[productIndex].buyNum = afterNum / ratio
    //获取商品在添加商品数组里的位置
    let addProductIndex = addProductList.findIndex(item => item.productSkuId == product.productSkuId)
    if (addProductIndex == -1) {
      addProductList.push(product)
    } else {
      if (afterNum == 0) {
        addProductList = addProductList.filter(item => item.productSkuId != productSkuId)
      } else {
        addProductList[addProductIndex].buyNum = addProductList[addProductIndex].buyCount = afterNum / ratio
      }
    }
    this.setData({ addProductList, productList })
    this.getAddProductAmountCountNotice()
  },
  //点击减号
  onSubProductBuyNum(e) {
    let { productList, addProductList } = this.data
    const productSkuId = e.currentTarget.dataset.productSkuId
    //在产品列表中获取商品
    let product = productList.find(item => item.productSkuId == productSkuId)
    let productIndex = productList.findIndex(item => item.productSkuId == productSkuId)
    let afterNum = (product.buyNum - 1) > product.maxBuyNum ? product.maxBuyNum : (product.buyNum - 1) < product.minBuyNum ? 0 : (product.buyNum - 1)
    productList[productIndex].buyNum = afterNum
    //获取商品在添加商品数组里的位置
    let addProductIndex = addProductList.findIndex(item => item.productSkuId == product.productSkuId)
    if (addProductIndex == -1) {
      addProductList.push(product)
    } else {
      if (afterNum == 0) {
        addProductList = addProductList.filter(item => item.productSkuId != productSkuId)
      } else {
        addProductList[addProductIndex].buyNum = addProductList[addProductIndex].buyCount = afterNum
      }
    }
    this.setData({ addProductList, productList })
    this.getAddProductAmountCountNotice()
  },
  //获得已添加商品的数量和金额还有提示语
  getAddProductAmountCountNotice() {
    let { source, couponAmountFrom, couponAmount, couponCodeDetail, addProductList, productList, productBuyCount, productBuyAmount } = this.data
    let totalAmount = 0
    let totalCount = 0
    let discountNotice = ``
    let couponNotice = ``
    for (let product of addProductList) {
      totalAmount += (product.productPrice.price - product.productPrice.reducePrice) * product.saleSpecQuantity * product.buyNum
      totalCount += (product.productSkuId == product.productSaleSpecId ? product.buyNum : product.buyNum * product.saleSpecQuantity)
    }
    if (this.data.source == `couponCode`) {
      discountNotice = CouponCodeUtil.getCodeShortNotice(couponCodeDetail, productList[0], productBuyCount, productBuyAmount).desc
    } else {
      if (couponAmountFrom > totalAmount) {
        couponNotice = `购买以下商品满${couponAmountFrom}元，可减${couponAmount}元，还差${(couponAmountFrom - totalAmount).toFixed(2)}元`
      } else {
        couponNotice = `已购满${couponAmountFrom}元，已减${couponAmount}元`
      }
    }
    this.setData({ totalAmount, totalCount, discountNotice, couponNotice })
  },
  //点击确认添加按钮
  confirmAdd() {
    let { source } = this.data
    if (source == `couponCode`) {
      this.onCouponCodeAdd()
    } else if (source == `coupon`) {
      this.onCouponAdd()
    }
  },
  //确认添加优惠码商品
  onCouponCodeAdd() {
    let { couponCodeDetail, addProductList, productList, productBuyCount, productBuyAmount } = this.data
    let couponCodeResult = CouponCodeUtil.getCodeShortNotice(couponCodeDetail, productList[0], productBuyCount, productBuyAmount)
    if (couponCodeResult.success) {
      this.setData({ giveUpUseCouponCode: false })
      let pages = getCurrentPages()
      let prePage = pages[pages.length - 2]
      prePage.onAddProduct(addProductList, `couponCode`)
      App.WxService.navigateBack()
    } else {
      let dialogResult = CouponCodeUtil.getCodeUnfitDialogNotice(couponCodeDetail, productList[0], productBuyCount, productBuyAmount)
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        dialogData: { text: dialogResult },
        cancelText: `放弃使用`, confirmText: `继续添加`,
        onCancel: `giveUpUseCouponCode`
      })
    }
  },
  //确认添加优惠券商品
  onCouponAdd() {
    let { addProductList } = this.data
    let pages = getCurrentPages()
    let prePage = pages[pages.length - 2]
    prePage.onAddProduct(addProductList, `coupon`)
    App.WxService.navigateBack()
  },
  //放弃使用优惠码
  giveUpUseCouponCode() {
    let { addProductList } = this.data
    let pages = getCurrentPages()
    let prePage = pages[pages.length - 2]
    prePage.onAddProduct(addProductList, `couponCode`)
    App.WxService.navigateBack()
  },
  //页面卸载
  onUnload() {
    if (this.data.giveUpUseCouponCode && this.data.source == `couponCode`) {
      let pages = getCurrentPages()
      let prePage = pages[pages.length - 2]
      prePage.resetCouponCode()
    }
  }
})