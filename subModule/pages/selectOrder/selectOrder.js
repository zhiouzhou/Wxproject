// pages/selectOrder/selectOrder.js
const App = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderList: [],
    orderStateNames : {
      '0': '全部',
      '1': '待发货',
      '2': '已发货',
      '3': '已完成',
      '4': '审核拒绝',
      '5': '已取消',
      '6': '已删除',
      '7': '配送失败',
      '8': '待付款',
      '9': '待评价'
    },
    orderNO: ''
  },
  //分页查询参数
  params: {
    currentPage: 1,
    pageSize: 20,
    totalPage: 2,
    totalNum: 0
  },
  isBusy: false,//是否加载中
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getOrderList();
    if (options&& options.orderNo) {
      this.setData({
        orderNO: options.orderNo
      })
    }else{
      this.setData({
        orderNO: ''
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

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
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if(!this.isBusy && this.params.currentPage < this.params.totalPage) {
      this.params.currentPage += 1;
      this.getOrderList()
    }
  
  },
  //获取可投诉订单列表
  getOrderList() {
    if(this.isBusy) {
      return;
    }
    this.isBusy = true;
    App.HttpService.queryComplaintOrders(this.params.currentPage, this.params.pageSize).then(data => {
      if(data.success) {
        this.params.totalNum = data.totalCount;
        this.params.totalPage = Math.ceil(data.totalCount / this.params.pageSize);
        data.data.forEach(order => {
          order.nums = 0;
          order.items.forEach( prorudct => {
            order.nums += prorudct.count;
          })
          this.data.orderList.push(order)
          
        })
        // this.data.orderList.push(...data.data);
        this.setData({
          orderList: this.data.orderList
        })
        this.isBusy = false;
      }
    }).catch(data => {
      this.isBusy = false;
    })
  },
  //确定订单号
  confirmOrder(e) {
    let orderNO = e.currentTarget.dataset.tag;
    this.setData({
      orderNO: orderNO
    })
    let pages = getCurrentPages();
    let prePage = pages[pages.length - 2];
    prePage.setData({
      "complaintInfo.orderNo": orderNO,
      isRed: prePage.check()
    })
    App.WxService.navigateBack();
  }
})