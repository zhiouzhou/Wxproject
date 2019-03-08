// pages/user/orderReturn/orderReturnDetail.js
const App = getApp()
import { ProductUtil, DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog, OrderOperationJs } from '../../../components/yjp.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    vm: {},
    orderNO: ``,
    orderDetail: {},
    addressStr: ``,
    item: '',
    productCount: 0,
    windowHeight: 0,
    orderId: ``,
    swapVm: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const systemInfo = App.globalData.systemInfo;
    this.setData({
      windowHeight: systemInfo.windowHeight * systemInfo.pixelRatio,
      orderType: options.orderType || 0
    })
    //消息中心没有传orderType参数，所以options.orderType为undefined
    if (options.orderType == 0 || !options.orderType) {
      this.getReturnOrderDetail(options.orderNO)
    } else {
      this.getSwapOrderDetail(options.orderId)
    }

  },
  //退货单详情
  getReturnOrderDetail: function (orderNO) {
    App.HttpService.getReturnOrderDetail({ orderNO })
      .then(data => {
        let productCount = this.rebuildOrders(data.data.itemList)
        let addressStr = data.data.address.province + data.data.address.city + data.data.address.county + data.data.address.street + data.data.address.detailAddress;
        this.setData({
          orderNO,
          orderDetail: data.data,
          traceItem: data.data.traceItem,
          addressStr: addressStr,
          address: data.data.address,
          item: data.data,
          productCount: productCount,
          vm: {
            itemList: this.transform(data.data.itemList)
          }
        })
      })
  },
  // 换货单详情
  getSwapOrderDetail(orderId) {
    App.HttpService.getSwapOrderDetail({ data: orderId })
      .then(data => {
        let returnCount = this.rebuildChangeOrders(data.data.returnItems)
        let swapCount = this.rebuildChangeOrders(data.data.swapItems)
        let addressStr = data.data.orderAddress.province + data.data.orderAddress.city + data.data.orderAddress.county + data.data.orderAddress.street + data.data.orderAddress.detailAddress;
        this.setData({
          orderId,
          orderDetail: data.data,
          traceItem: data.data.orderTrace,
          addressStr: addressStr,
          address: data.data.orderAddress,
          item: data.data,
          returnCount: returnCount,   //换货订单项数量
          swapCount: swapCount,
          swapVm: {
            returnOrderList: data.data.returnItems,
            swapOrderList: data.data.swapItems,
          }
        })
      })
  },
  //修改换货单数据
  rebuildChangeOrders(orders) {
    let i = 0
    let j = 0
    for (let item of orders) {
      if (item.productSaleSpecQuantity == item.productSpecQuantity) {
        i += item.count;
      } else {
        i += item.count * item.productSaleSpecQuantity
      }
    }
    for (let item of orders) {
      if (item.productSaleSpecQuantity == item.productSpecQuantity) {
        j += item.count;
      } else {
        j += item.count * item.productSaleSpecQuantity
      }

    }
    return i, j
  },
  //修改退货单数据
  rebuildOrders(itemList) {
    let i = 0
    for (let item of itemList) {
      if (item.product.saleSpecQuantity == item.product.specQuantity) {
        i += item.returnCount
      } else {
        i += item.returnCount * item.product.saleSpecQuantity
      }

    }
    return i;
  },

  //取消退货
  cancelReturnOrder(e) {
    const orderType = e.currentTarget.dataset.orderType
    const orderNO = e.currentTarget.dataset.orderno
    let that = this

    App.HttpService.cancelReturnOrder({ orderNO })
      .then(data => {
        if (orderType == 0) {
          that.getReturnOrderDetail(that.data.orderNO)
          // $yjpToast.show({ text: `已成功取消退货！` })
          var pages = getCurrentPages();
          var currPage = pages[pages.length - 1];
          var prevPage = pages[pages.length - 2];
          prevPage.setData({
            currentPage: 1,
            pageSize: 20,
          })
          wx.navigateBack({
            delta: 1
          })
        } else {
          // $yjpToast.show({ text: `已成功取消退货！` })
          that.getSwapOrderDetail(that.data.orderId)
          var pages = getCurrentPages();
          var currPage = pages[pages.length - 1];
          var prevPage = pages[pages.length - 2];
          prevPage.setData({
            currentPage: 1,
            pageSize: 20,
          })
          wx.navigateBack({
            delta: 1
          })
        }
      }).catch(error => {
        $yjpToast.show({ text: error })
      })
  },
  //把item.count 赋值给 item.product.count 
  transform(itemList) {
    for (let item of itemList) {
      if (item.product.price && item.product.productSkuId != item.product.productSaleSpecId) {
        item.product.returnCount = item.returnCount * (item.product.saleSpecQuantity || 1)
      } else {
        item.product.returnCount = item.returnCount;
      }
      item.product.sourceType = item.sourceType;
      item.product.giftSourceDesc = item.giftSourceDesc;
      this.getDisplayTagText(item.product);
    }
    return itemList;
  },

  //复制订单号
  copyOrderNo(e) {
    const orderNO = e.currentTarget.dataset.orderno
    wx.setClipboardData({
      data: orderNO,
      success: function (res) {
        wx.getClipboardData({
          success: function (res) {
            console.log(res.data) // data
          }
        })
      }
    })
  },
  //产品促销提示
  getDisplayTagText(product) {
    const productDisplay = wx.getStorageSync(`appSetting`) && wx.getStorageSync(`appSetting`).productDisplay
    product.accumulationText = false && product.isAccumulated && productDisplay.displayAccumulationInfo ? productDisplay.displayAccumulationInfo : ``
    product.unAccumulationText = false && !product.isAccumulated && productDisplay.unDisplayAccumulationInfo ? productDisplay.unDisplayAccumulationInfo : ``
    product.bonusText = true && product.isUseBonus && productDisplay.displayAvailableBonusInfo ? productDisplay.displayAvailableBonusInfo : ``
    product.unBonusText = true && !product.isUseBonus && productDisplay.unDisplayAvailableBonus ? productDisplay.unDisplayAvailableBonus : ``
    product.couponText = true && product.isUseCoupon && productDisplay.displayUseCouponInfo ? productDisplay.displayUseCouponInfo : ``
    product.unCouponText = true && !product.isUseCoupon && productDisplay.unDisplayUseCouponInfo ? productDisplay.unDisplayUseCouponInfo : ``
    return product
  },
  traceOrder(e) {
    OrderOperationJs.traceOrder(e);
  },
  goToOrderGoodsList(e) {
    const tag = e.currentTarget.dataset.tag
    const types = 1
    let productList = this.data.vm.itemList
    let productDataList = JSON.stringify(productList);
    let list = encodeURIComponent(productDataList)
    App.WxService.navigateTo(App.Constants.Route.orderGoodsList, { productList: list, tag, types, needdecodeURI: true })
  },
  // 换货------多商品清单
  goToOrderGoodsSwapList(e) {
    const tag = e.currentTarget.dataset.tag
    const swapType = e.currentTarget.dataset.swapType   //swapType==1  退货    swapType==2  换货
    const types = 2
    let returnList = this.data.swapVm.returnOrderList
    let swapList = this.data.swapVm.swapOrderList

    let returnDataList = JSON.stringify(returnList);
    let swapDataList = JSON.stringify(swapList);

    let returnItemList = encodeURIComponent(returnDataList);
    let swapItemList = encodeURIComponent(swapDataList);
    if (swapType == 1) {
      App.WxService.navigateTo(App.Constants.Route.orderGoodsList, { productList: returnItemList, tag, types, swapType, needdecodeURI: true })
    } else {
      App.WxService.navigateTo(App.Constants.Route.orderGoodsList, { productList: swapItemList, tag, types, swapType, needdecodeURI: true })
    }


  },
  //商品详情单列表进入商品详情
  goToProductDetail(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    let sourceType = e.currentTarget.dataset.sourceType
    if (sourceType == 5) {
      App.WxService.navigateTo(App.Constants.Route.comAtyDetail, { activityId: productSkuId })
    } else {
      App.WxService.navigateTo(App.Constants.Route.productDetail, { productSkuId })
    }

  },

})