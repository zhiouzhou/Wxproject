// pages/complaints/complaints.js
const App = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    complaintsList: [],
    isEmpty: false,
    cityServiceTelephone : '',
    saleUserMobileNo : ''
  },

  isBusy: false,//是否在加载中
  /**
   * 分页参数
   */
  params: {
    currentPage: 1,
    pageSize:  20,
    totalNum: 0,
    totalPage: 0
  },
  /** 
   * 投诉状态
  */
  stateMap: {
    "0": "待客服处理",
    "1": "待城市经理处理",
    "2": "待客服审核",
    "3": "不予处理",
    "4": "处理中",
    "5": "已处理"
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initData();
    const cityServiceTelephone = wx.getStorageSync(`appSetting`).cityServiceTelephone || ''
    const saleUserMobileNo = wx.getStorageSync(`userDetail`).saleUserMobileNo || ''
    this.setData({
        cityServiceTelephone: cityServiceTelephone,
        saleUserMobileNo: saleUserMobileNo
    })
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
    if (!this.isBusy&&this.params.currentPage <this.params.totalPage ) {
      this.params.currentPage += 1;
      this.initData()
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },
  /**
   * 初始化投诉建议列表
   */
  initData() {
    if(this.isBusy) {
      return;
    }
    this.isBusy = true;
    App.HttpService.getComplaintsList(this.params.currentPage,this.params.pageSize).then(data=>{
      if(data.success) {
        data.data = data.data || [];
        this.params.totalNum = data.totalCount;
        this.params.totalPage = Math.ceil(data.totalCount/this.params.pageSize);
        let complaintsList = this.data.complaintsList
        complaintsList.push(...data.data);
        this.setData({
          complaintsList: complaintsList,
          isEmpty: !complaintsList.length
        })
        this.isBusy = false;
      }
    }).catch(data => {
      this.isBusy = false;
    })
  },
  //跳转投诉建议详情
  goDatail(e) {
    let complaintId = e.currentTarget.dataset.tag
    App.WxService.navigateTo(App.Constants.Route.complaintDetail,{
      id: complaintId
    })
  },
  //新增投诉
  addComplaint() {
    App.WxService.navigateTo(App.Constants.Route.addComplaint)
  },
   //拨打客服电话
  makePhoneCall(e) {
    wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.num })
  }
})