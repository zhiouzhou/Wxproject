const App = getApp()
Page({
  data: {
    productList: [],
    tip: ''//1商品清单  2退货换货   ''赠品单
  },

  onLoad: function (options) {
    //包含特殊符号，这里需要转码
    let productList = []
    if (options.needdecodeURI) {
      productList = JSON.parse(decodeURIComponent(options.productList))
    } else {
      productList = JSON.parse(options.productList)
    }
    const tag = options.tag;
    const tip = options.types || ''
    let titleName = tag == "product" ? "商品清单" : "赠品清单";
    this.setData({ productList, tip: tip})

    wx.setNavigationBarTitle({
      title: titleName,
    })
  },
  goToProductDetail(e) {
    const productSkuId = e.currentTarget.dataset.productSkuId
    const sourceType = e.currentTarget.dataset.sourceType
    const nearExpireId = e.currentTarget.dataset.nearExpireId
    if (sourceType == 5) {
      App.WxService.navigateTo(App.Constants.Route.comAtyDetail, { activityId: productSkuId })
    } else if (sourceType == 10) {
      App.WxService.navigateTo(App.Constants.Route.adventProductDetail, { bulk: 1, productSkuId: productSkuId})
    } else if (sourceType == 14) {
      App.WxService.navigateTo(App.Constants.Route.adventProductDetail, { bulk: 2, nearExpireId: nearExpireId})
    }else{
      App.WxService.navigateTo(App.Constants.Route.productDetail, { productSkuId })
    }

  }


})