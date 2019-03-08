// pages/user/myCoupon/myCoupon.js
const App = getApp();
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, OrderOperationJs } from '../../../components/yjp.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    checkHide: true,
    currentPage: 1,
    pageSize: 20,
    couponState: 1,
    couponType: 0,
    couponUseType: 2,
    couponNum: {},
    couponArr: [],
    windowHeight: 0,
    initing: false,
    shopCoupon: false,
    // usable:true,  //经销商可用券
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const systemInfo = App.globalData.systemInfo;
    let barHeight = systemInfo.windowWidth / 750 * 88   //抵用券类型高度 
    let barHeightState = systemInfo.windowWidth / 750 * 85  //优惠券类型高度（抵用券、打折券、赠品券）
    let shopCouponHeight = systemInfo.windowWidth / 750 * 88  //易酒批券、经销商券高度
    this.setData({
      windowHeight: systemInfo.windowHeight - barHeight - barHeightState - shopCouponHeight,
      windowHeightState: systemInfo.windowHeight - barHeightState - shopCouponHeight
    })
    this.getNum(true);
    this.getData();
  },
  //获取优惠券总数
  getNum(unusable = true) {
    App.HttpService.couponNum({ data: unusable })
      .then(data => {
        // console.log(data.data)
        this.setData({
          couponNum: data.data,
        })
      })
  },
  getData() {
    let { currentPage, pageSize, couponState, couponUseType, couponType, couponArr, totalCount, shopCoupon } = this.data;
    let detailArrTemp = [];
    if (this.data.requesting) return;
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    let data
    if (shopCoupon) {
      data = { couponState, shopCoupon }
    } else {
      data = { couponState, couponType, couponUseType, shopCoupon }
    }
    return App.HttpService.myCoupon({ currentPage, pageSize, data })
      .then(data => {
        console.log(data)
        if ((!data.data || !data.data.length) && currentPage == 1) {
          this.setData({ couponArr: [], totalCount: totalCount, initing: false })
        } else if ((!data.data || !data.data.length) && currentPage != 1) {
          $yjpToast.show({ text: `没有更多数据了` })
        } else {
          let oldArr = couponArr;
          let newArr = data.data;
          let finalArr = oldArr.concat(newArr);
          this.setData({
            couponArr: finalArr,
            totalCount: data.totalCount,
            currentPage: ++currentPage,
            initing: false
          })
        }
        this.setData({ requesting: false, initing: false })
        wx.hideLoading();
      })
      .catch(e => { this.setData({ requesting: false, initing: false }) })
  },
  lower() {
    this.getData();
  },
  discount() { //抵用券
    let systemInfo = wx.getStorageSync(`systemInfo`)
    this.setData({
      couponType: 0,
      currentPage: 1,
      couponArr: [],
    })
    this.getData()
  },
  sale() { //打折券
    let systemInfo = wx.getStorageSync(`systemInfo`)
    this.setData({
      couponType: 1,
      currentPage: 1,
      couponArr: [],
    })
    this.getData()
  },
  gift() { //赠品券
    let systemInfo = wx.getStorageSync(`systemInfo`)
    this.setData({
      couponType: 2,
      currentPage: 1,
      couponArr: [],
    })
    this.getData()
  },
  product() {
    this.setData({
      couponUseType: 2,
      currentPage: 1,
      couponArr: []
    })
    this.getData()
  },
  category() {
    this.setData({
      couponUseType: 0,
      currentPage: 1,
      couponArr: []
    })
    this.getData()
  },
  currency() {
    this.setData({
      couponUseType: 1,
      currentPage: 1,
      couponArr: []
    })
    this.getData()
  },
  checkUse() {
    if (this.data.couponState == 0) {
      this.getNum(true);
      this.setData({
        couponState: 1,
        couponArr: [],
        currentPage: 1,
      })
    } else {
      this.getNum(true);
      this.setData({
        couponState: 0,
        couponArr: [],
        currentPage: 1,
      })
    }
    this.getData();
  },
  couponJiupi() {
    this.setData({
      shopCoupon: false,
      couponState: 1,
      couponType: 0,
      couponUseType: 2,
      couponArr: [],
      currentPage: 1,
    })
    this.getData()
  },
  shopCoupon() {
    this.setData({
      couponState: 1,
      shopCoupon: true,
      couponArr: [],
      currentPage: 1,
    })
    this.getData()
  },
  usable() {
    this.setData({
      couponState: 1,
      couponArr: [],
      currentPage: 1,
    })
    this.getData()
  },
  unusable() {
    this.setData({
      couponState: 0,
      couponArr: [],
      currentPage: 1,
    })
    this.getData()
  },
  //返回首页
  backHome() {
    App.WxService.switchTab(App.Constants.Route.homePage)
  }
})