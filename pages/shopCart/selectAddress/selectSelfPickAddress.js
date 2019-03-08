// pages/shopCart/selectSelfPickAddress.js
const App = getApp()
Page({
  data: {
    wareHouseList: [],
    selectAddress: undefined
  },
  onLoad: function (options) {
    const wareHouseList = JSON.parse(options.wareHouseList)
    const selectAddress = JSON.parse(options.selectAddress)
    this.setData({ wareHouseList, selectAddress })
  },
  onSelectAddress(e) {
    const address = e.currentTarget.dataset.address
    this.setData({ selectAddress: address })
    let pages = getCurrentPages()
    let prePage = pages[pages.length - 2]
    prePage.setData({ currentWareHouse: address })
    App.WxService.navigateBack()
  }
})