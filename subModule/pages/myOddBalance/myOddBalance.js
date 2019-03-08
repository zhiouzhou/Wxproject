// pages/user/myOddBalance/myOddBalance.js
const App = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentPage: 1,
    pageSize: 20,
    balanceDetail: [],
    vm : {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log(options)
    let bundleData = options.bundleData || 0
    let { currentPage, pageSize } = this.data
    App.HttpService.myOddBalance({ currentPage, pageSize })
      .then(data => {
        const emptyStr = 'vm.isEmpty';
        if (data.data && data.data.length) {
          for (let item of data.data){
            item.modifyAmount = this.processNumber(item.modifyAmount)
          }
          this.setData({
            balanceDetail: data.data.slice(0, 3),
            bundleData: bundleData
          })
        }else{
          this.setData({
            [emptyStr]: true,
            bundleData: bundleData
          })
        }
       
      })
  },
  //处理数字
  processNumber(num) {
    if (num > 0) {
      return `+${num.toFixed(2)}`
    } else {
      return `${num.toFixed(2)}`
    }
  },
  more() {
    App.WxService.navigateTo(App.Constants.Route.oddBalanceDetail)
  }
})