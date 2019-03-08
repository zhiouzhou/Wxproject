// pages/findGoods/findGoods.js
const App = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    findGoodsList: [],
    isEmpty: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.initData();
  },
  isBusy: false,//是否在加载中
  params: {
    currentPage: 1,
    pageSize: 20,
    totalNum: 0,
    totalPage: 0
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (!this.isBusy && this.params.currentPage < this.params.totalPage) {
      this.params.currentPage += 1;
      this.initData()
    }
  },
  //获取找货列表
  initData() {
    if (this.isBusy) {
      return;
    }
    this.isBusy = true;
    App.HttpService.queryFindGoodsList(this.params.currentPage, this.params.pageSize).then(data => {
      if(data.success) {
        let findeGoodsList = this.data.findGoodsList
        
        this.params.totalNum = data.totalCount;
        this.params.totalPage = Math.ceil(data.totalCount / this.params.pageSize);
        findeGoodsList.push(...data.data);
        this.setData({
          findGoodsList: findeGoodsList,
          isEmpty: !findeGoodsList.length
        })
        this.isBusy = false;
      }
    }).catch(data=> {
      this.isBusy = false;
    })
  },
  //跳转找货详情
  goDatail(e) {
    let findGoodsId = e.currentTarget.dataset.tag;
    App.WxService.navigateTo(App.Constants.Route.findGoodsDetail,{
      findGoodsId
    })
  },
  //新增我要找货
  addFindGoods() {
    App.WxService.navigateTo(App.Constants.Route.addFindGoods)
  }

})