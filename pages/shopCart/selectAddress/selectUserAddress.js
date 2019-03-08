// pages/shopCart/selectUserAddress.js
const App = getApp()
Page({
  data: {
    userAddress: [],
    selectAddress: undefined
  },
  onLoad: function (options) {
    const userAddress = JSON.parse(options.userAddress)
    const selectAddress = JSON.parse(options.selectAddress)
    this.setData({ userAddress, selectAddress })
  },
  onSelectAddress(e) {
    const address = e.currentTarget.dataset.address
    this.setData({ selectAddress: address })
    let pages = getCurrentPages()
    let prePage = pages[pages.length - 2]
    prePage.setData({ currentAddress: address }, () => {
      //刷新配送方式
      prePage.getDeliveryModeShowType(address)
      //是否需要校正地址
      prePage.isNeedCheckAddress(address)
      //重新计算价格
      prePage.reCalcPrice()
      //切换地址要重新考虑赠品券的库存
      if (prePage.data.selectCouponList && prePage.data.selectCouponList.length && prePage.data.selectCouponList[0].couponTemplate.couponType == 2) {
        prePage.onRemoveCouponGift()
        prePage.onAddCouponGift(prePage.data.selectCouponList[0])
      }
      //全局地址id
      App.globalData.addressId = address.addressId
      App.WxService.navigateBack()

    })

  }
})