const App = getApp()
import $yjpDialog from '../dialog/dialog.js'
import $yjpToast from '../toast/toast.js'
import { FunctionUtils } from '../../utils/CommonUtils.js'

import WxPayUtil from '../../utils/WxPayUtil.js'
let retryTimes = 0
//取消订单
function cancelOrder(e) {
  const orderNO = e.currentTarget.dataset.orderNO || this.data.orderNO;
  let cancelReasons = [
    { reason: '不想买了', select: true, key: 0 },
    { reason: '重复下单', select: false, key: 1 },
    { reason: '收货信息错误', select: false, key: 2 },
    { reason: '其他原因', select: false, key: 3 }]//取消原因数组
  $yjpDialog.open({
    halfWindowNoTitleDialogType: `cancelOrder`,
    dialogData: { cancelReasons, orderNO },
  })
}
function onSelectCancelReason(e) {
  const index = e.currentTarget.dataset.key
  let list = this.data.$yjp.dialog.dialogData.cancelReasons;
  for (var i = 0, len = list.length; i < len; i++) {
    if (index == i) {
      list[i].select = true
    } else {
      list[i].select = false
    }
  }
  this.setData({
    [`$yjp.dialog.dialogData.cancelReasons`]: list
  })
}
function onCancelCancelOrder() {
  typeof this[`$yjp.dialog.hide`] === `function` && this[`$yjp.dialog.hide`]()
}
function onConfirmCancelOrder(e) {
  const orderNO = e.currentTarget.dataset.orderNO
  const cancelType = this.data.$yjp.dialog.dialogData.cancelReasons.find(item => item.select == true).reason
  App.HttpService.cancelOrder({ cancelType, orderNO, remark: `` })
    .then(data => {
      $yjpToast.show({ text: `取消成功` })
      if ('/' + this.route == App.Constants.Route.orders) {
        //此处页面上要删除已经取消订单 setdata
        this.changeOrderState(orderNO)
      } else if ('/' + this.route == App.Constants.Route.orderDetail) {
        let pages = getCurrentPages()
        let prePage = pages[pages.length - 2]
        prePage.changeOrderState(orderNO)
        App.WxService.navigateBack();
      }
    })
    .catch(e => $yjpToast.show({ text: e }))
  this.onCancelCancelOrder()
  FunctionUtils && FunctionUtils.bindNomalTalkingDataEvent({ eventName: '订单处理-取消订单', eventType: 601, actionId: orderNO  })
}
//改变已取消订单的状态   模拟 reload() 
function changeOrderState(orderNO) {
  let idx = this.data.orders.findIndex(item => item.orderNO == orderNO)
  this.data.orders[idx].canCancelOrder = false
  this.data.orders[idx].canDeleteOrder = true
  this.data.orders[idx].state = 5
  this.setData({ orders: this.data.orders })
}
//页面删除已经订单 模拟 reload() 
function deleteOrderRender(orderNO) {
  this.data.orders.splice(this.data.orders.findIndex(item => item.orderNO == orderNO), 1)
  this.setData({ orders: this.data.orders })
}
//删除订单 
function deleteOrder(e) {
  const orderNO = e.currentTarget.dataset.orderNO || this.data.orderNO;
  $yjpDialog.open({
    title: '温馨提示', dialogType: `defaultText`,
    dialogData: { text: `您确认删除订单吗？` },
    onConfirm: () => {
      App.HttpService.deleteOrder({ orderNO })
        .then(data => {
          $yjpToast.show({ text: `删除成功` })
          if ('/' + this.route == App.Constants.Route.orders) {
            //此处页面上要删除已经取消订单 setdata
            this.deleteOrderRender(orderNO)
          } else if ('/' + this.route == App.Constants.Route.orderDetail) {
            let pages = getCurrentPages()
            let prePage = pages[pages.length - 2]
            prePage.deleteOrderRender(orderNO)
            App.WxService.navigateBack();
          }
        }).catch(e => $yjpToast.show({ text: e }))
      FunctionUtils && FunctionUtils.bindNomalTalkingDataEvent({ eventName: '订单处理-删除订单', eventType: 602, actionId: orderNO  })
    }
  })
}
//订单追踪
function traceOrder(e) {
  let orderNO = e.currentTarget.dataset.orderNO;
  let types = e.currentTarget.dataset.types;
  App.WxService.navigateTo(App.Constants.Route.orderTrack, { orderNO, types })
  FunctionUtils && FunctionUtils.bindNomalTalkingDataEvent({ eventName: '订单处理-订单跟踪', eventType: 603, actionId: orderNO  })

}
//评价订单
function evaluateOrder(e) {
  let orderNO = e.currentTarget.dataset.orderNO || this.data.orderNO;;
  App.WxService.navigateTo(App.Constants.Route.orderValuation, { orderNO })
}
//再次购买
function buyAgain(e) {
  let order = e.currentTarget.dataset.tag || this.data.orderDetail;
  let orderNO = order.orderNO;
  App.HttpService.getBuyAgainList(orderNO).then(data => {
    if (data.success) {
      let notBuy = 0;
      let isDown = false;//是否下架
      let isOut = false;//是否抢光
      let isMember = false;//组合活动是否等级不够
      data.data.forEach(product => {
        if (product.productType == 1) {
          if (product.productState != 2 || product.canSellStoreCount <= 0 || product.stockState == 3) {
            notBuy++;
            if (product.productState != 2) {
              isDown = true;
            }
            if (product.canSellStoreCount <= 0 || product.stockState == 3) {
              isOut = true
            }
          }
        }
        if (product.productType == 2) {
          if (product.compositeState != 2 || product.storeCount <= 0 || product.stockState == 3 || !product.enjoyUserLevelDiscount) {
            notBuy++;
            if (product.compositeState != 2) {
              isDown = true;
            }
            if (product.storeCount <= 0 || product.stockState == 3) {
              isOut = true
            }
            if (!product.enjoyUserLevelDiscount) {
              isMember = true;
            }
          }
        }
      })
      if (notBuy == data.data.length) {
        if (isDown) {
          $yjpDialog.open({
            dialogType: `defaultText`,
            dialogData: { text: `订单中的产品已下架，再看看其他产品吧` },
            title: `温馨提示`,
            hiddenCancel: true,
            cancelText: `我知道了`
          })
        } else if (isMember) {
          $yjpDialog.open({
            dialogType: `defaultText`,
            dialogData: { text: `订单中的产品会员等级不够，再看看其他产品吧` },
            title: `温馨提示`,
            hiddenCancel: true,
            cancelText: `我知道了`
          })
        } else if (isOut) {
          $yjpDialog.open({
            dialogType: `defaultText`,
            dialogData: { text: `订单中的产品已抢光，再看看其他产品吧` },
            title: `温馨提示`,
            hiddenCancel: true,
            cancelText: `我知道了`
          })
        }
      } else if (notBuy > 0) {
        //TODO部分购买弹窗
        this.buyAgainOrder = order;
        this.sectionBuyList(data.data, order)
      } else {
        this.addCart(data.data, order)
      }
    }
  }).catch(e => {
    $yjpDialog.open({
      dialogType: `defaultText`,
      dialogData: { text: e },
      title: `温馨提示`,
      hiddenCancel: true,
      confirmText: `我知道了`
    })
  })
  FunctionUtils && FunctionUtils.bindNomalTalkingDataEvent({ eventName: '订单处理-订单再次购买', eventType: 606, actionId: orderNO })

}
function addCart(canBuyList, order) { //批量加入购物
  let params = [];
  canBuyList.forEach(product => {
    let o = {};
    if (product) {
      //设置再次购买数量
      let items = order.items || order.itemList;
      items.forEach(item => {
        if (item.product.productSkuId == product.productSkuId) {
          o.count = item.count
        }
      })
      o.productSkuId = product.productSkuId;
      o.productType = product.productType;
      o.sellingPriceUnit = product.priceunit;
      o.sellingPrice = product.price;
      o.saleSpecId = product.productSaleSpecId;
      params.push(o)
    }
  })
  if (params.length > 0) {
    let paramsData = {
      datas: params
    }
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    App.HttpService.addShopCartList(paramsData).then(data => {
      if (data.success) {

        $yjpToast.show({ text: "加入购物车成功" })
        setTimeout(() => {
          wx.hideLoading()
          App.WxService.switchTab(App.Constants.Route.shopCart);
        }, 1000)
      }
    }).catch(data => {
      wx.hideLoading()
    })
  }
}
function sectionBuyList(productList) {
  let canBuyList = [];
  let notBuyList = [];
  productList.forEach(product => {
    if (product.productType == 1) {
      if (product.productState != 2 || product.canSellStoreCount <= 0 || product.stockState == 3) {
        notBuyList.push(product)
      } else {
        canBuyList.push(product);
      }
    }
    if (product.productType == 2) {
      if (product.compositeState != 2 || product.storeCount <= 0 || product.stockState == 3) {
        notBuyList.push(product)
      } else {
        canBuyList.push(product)
      }
    }
  })
  this.setData({
    canBuyList, notBuyList,
    sectionBuy: true
  })
}
function sectionAddCart(e) {
  let canBuyList = this.data.canBuyList;
  let order = this.buyAgainOrder;
  let params = [];
  canBuyList.forEach(product => {
    let o = {};
    if (product) {
      //设置再次购买数量
      let items = order.items || order.itemList;
      items.forEach(item => {
        if (item.product.productSkuId == product.productSkuId) {
          o.count = item.count
        }
      })
      o.productSkuId = product.productSkuId;
      o.productType = product.productType;
      o.sellingPriceUnit = product.priceunit;
      o.sellingPrice = product.price;
      o.saleSpecId = product.productSaleSpecId;
      params.push(o)
    }
  })
  if (params.length > 0) {
    let paramsData = {
      datas: params
    }
    App.HttpService.addShopCartList(paramsData).then(data => {
      if (data.success) {
        App.WxService.switchTab(App.Constants.Route.shopCart);
      }
    })
  }
}
//订单投诉
function complaintOrder(e) {
  
  let orderNO = e.currentTarget.dataset.orderNO || this.data.orderNO;
  App.WxService.navigateTo(App.Constants.Route.addComplaint, {
    orderNO: orderNO
  })
  FunctionUtils && FunctionUtils.bindNomalTalkingDataEvent({ eventName: '订单处理-订单投诉', eventType: 605, actionId: orderNO  })
}
//跳转换货申请
function exchangeOrder(e) {
  let order = e.currentTarget.dataset.orderdetail || this.data.orderDetail;
  App.WxService.navigateTo(App.Constants.Route.exchangeOne, {
    order: order
  });
}
//在线支付
function onlinePay(e) {
  wx.showLoading({
    title: '提交中',
    mask: true
  })
  let orderNO = e.currentTarget.dataset.orderNO
  return WxPayUtil.onRequestPayment([orderNO])
    .then(data => {
      retryTimes = 0
      wx.hideLoading()
      $yjpToast.show({ text: `支付成功` })
      setTimeout(() => {
        if (this.data.orderDetail) {
          App.WxService.navigateBack()
        }
      }, 1000)
    })
    .catch(e => {
      wx.hideLoading()
      $yjpToast.show({ text: `支付失败` })
    })
}
//转货到付款
function changePayType(e) {
  wx.showLoading({
    title: '提交中',
    mask: true
  })
  let orderDetail = e.currentTarget.dataset.tag
  App.HttpService.changeOrderPayType({
    data: [{
      orderNo: orderDetail.orderNO,
      payMode: 0,
      payType: 0,
    }]
  })
    .then(data => {
      wx.hideLoading()
      $yjpToast.show({ text: `转换成功` })
      this.getOrderDetail()
    })
    .catch(e => {
      wx.hideLoading()
      $yjpToast.show({ text: e })
    })
}

module.exports = {
  cancelOrder, onSelectCancelReason, onCancelCancelOrder, onConfirmCancelOrder,
  deleteOrder,
  deleteOrderRender,
  changeOrderState,
  traceOrder,
  evaluateOrder,
  buyAgain,
  addCart,
  sectionBuyList,
  sectionAddCart,
  complaintOrder,
  exchangeOrder,
  onlinePay,
  changePayType
}