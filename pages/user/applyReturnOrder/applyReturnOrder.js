// pages/user/applyReturnOrder/applyReturnOrder.js
const App = getApp()
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'
import applyReturnOrderCommon from './applyReturnOrderCommon.js'
Page({
  /**
   * 页面的初始数据
   */
  data: {
    windowHeight: 0,
    showTip: true,
    placeholder: '可填写您的要求',
    returnReason: '请选择退货原因',
    remark: '',
    productList: [],
    allSelected: false,
    selectedCount: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    Object.assign(this, applyReturnOrderCommon)
    //options.fromList 是否来自list页面 
    const systemInfo = App.globalData.systemInfo;
    let orderDetail = JSON.parse(options.orderDetail);
    let selectedCount = 0;
    if (options.fromList) {
      this.data.productList = orderDetail.itemList;
      for (let item of this.data.productList) {
        if (item.selected) {
          selectedCount += item.showCount
        }
      }
    } else {
      for (let i = 0; i < orderDetail.itemList.length; i++) {

        let item = orderDetail.itemList[i];
        //默认可退最大数量 
        item.returnCount = item.canReturnNum;
        item.selected = false;
        if (item.canReturnNum) {
          item.canSelected = true
        }
        if (item.product.productSkuId == item.product.productSaleSpecId) {
          item.product.XS = 1;
        } else {
          item.product.XS = item.product.saleSpecQuantity || 1;
        }
        item.showCount = item.product.XS * item.canReturnNum;
        this.data.productList.push(item);
      }

    }
    App.HttpService.getReturnOrderReasons()
      .then(data => {
        data.data.push(`其他`)
        this.setData({ reasonList: data.data })
      })
    this.setData({
      windowHeight: systemInfo.windowHeight * systemInfo.pixelRatio,
      orderDetail: orderDetail,
      productList: this.data.productList,
      selectedCount: selectedCount,
      fromList: options.fromList
    })
  },
  hideTip() {
    this.setData({ showTip: false })
  },
  addEdit() {
    App.WxService.navigateBack();
  },
  //编辑备注
  editRemarkText(e) {
    let remark = e.detail.value
    this.setData({
      remark: remark
    })
  },

  //选择退货原因
  chooseReturnReason(e) {
    let returnReason = e.target.dataset.returnReason;
    $yjpDialog.open({
      halfWindowDialogType: `chooseReturnReason`, title: `请选择退货原因`,
      dialogData: {
        reasonList: this.data.reasonList,
        selectReturnReason: returnReason
      }
    })
  },

  onSelectReason(e) {
    let reason = e.currentTarget.dataset.reason
    this.setData({
      [`$yjp.dialog.dialogData.selectReturnReason`]: reason,
      returnReason: reason
    })
  },

  //申请退货
  submit() {
    if (!this.data.selectedCount) {
      $yjpToast.show({ text: "请选择商品" })
      return;
    }
    if (this.data.returnReason == `请选择退货原因`) {
      $yjpToast.show({ text: `请选择退货原因` })
      return
    }
    if (this.data.returnReason == `其他` && !this.data.otherReason) {
      $yjpToast.show({ text: `请填写其他原因` })
      return
    }
    let items = []
    let { productList, otherReason } = this.data
    let returnTotalCount = 0
    //选中的需要退货的商品
    let returnproductList = []
    for (let i = 0; i < productList.length; i++) {
      let productItem = productList[i]
      if (productItem.selected) {
        returnproductList.push(productItem)
        let item = {
          orderItemId: productItem.itemId,
          returnCount: productItem.returnCount,
          sourceId: productItem.sourceId,
          sourceType: productItem.sourceType
        }
        returnTotalCount +=
          productItem.product.productSkuId == productItem.product.productSaleSpecId ?
            productItem.returnCount : productItem.returnCount * productItem.product.saleSpecQuantity
        items.push(item)
      }
    }

    let returnOrder = {
      items: items,
      orderNO: this.data.orderDetail.orderNO,
      reason: this.data.returnReason == `其他` ? this.data.otherReason : this.data.returnReason,
      remark: this.data.remark
    }

    $yjpDialog.open({
      dialogType: `returnList`, title: `确认退货？`,
      onConfirm: () => this.confirmReturn(returnOrder),
      dialogData: { returnList: returnproductList, otherReason: otherReason, returnTotalCount: returnTotalCount }
    })

  },
  confirmReturn(returnOrder) {
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    App.HttpService.addReturnOrder({ returnOrder })
      .then(data => {
        wx.hideLoading()
        $yjpToast.show({ type: `img`, imgUrl: `/assets/images/toast_gou.png`, text: `您的退货申请已提交，我们会尽快予以回复` })
        setTimeout(function () {
          App.WxService.navigateBack(2)
        }.bind(this), 1000)
      }).catch(error => {
        wx.hideLoading()
        $yjpToast.show({ text: error })
      })
  },
  onOtherReasonConfirm(e) {
    const otherReason = e.detail.value
    this.setData({ otherReason: otherReason })
  }
})
