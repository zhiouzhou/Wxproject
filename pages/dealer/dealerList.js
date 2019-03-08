// pages/dealer/dealerList.js
const App = getApp()
import { $yjpToast } from '../../components/yjp.js'
Page({
  data: {
    shopList: [],
    initing: true
  },
  onLoad: function (options) {
    let shopName = options.searchKey || ``
    wx.showLoading({
      title: '加载中',
    })
    if (options.isFromCollection == `true`) {
      App.HttpService.getFavoriteDealerShopList({ currentPage: 1, pageSize: 60 })
        .then(data => {
          wx.hideLoading()
          this.setData({ shopList: data.data, initing: false })
        })
        .catch(e => {
          wx.hideLoading()
          this.setData({ shopList: [], initing: false })
        })
      wx.setNavigationBarTitle({
        title: '经销商收藏',
      })
    } else {
      App.HttpService.getDealerShopList({ currentPage: 1, pageSize: 60, data: shopName })
        .then(data => {
          wx.hideLoading()
          this.setData({ shopList: data.data, initing: false })
        })
        .catch(e => {
          wx.hideLoading()
          this.setData({ shopList: [], initing: false })
        })
    }
  },
  goToDealerShopDetail(e) {
    let shopId = e.currentTarget.dataset.shopId
    let state = e.currentTarget.dataset.state
    let openDealerShop = e.currentTarget.dataset.openDealerShop
    if (state == 0 || !openDealerShop) { //停用的经销商
      $yjpToast.show({ text: `该经销商已关闭` })
    } else {
      App.WxService.navigateTo(App.Constants.Route.dealer, { shopId })
    }
  },

})