// pages/user/user.js
const App = getApp()
const ROUTE = App.Constants.Route
import { DateUtil, FunctionUtils } from '../../utils/CommonUtils.js'
import { $yjpToast } from '../../components/yjp.js'
Page({
  data: {
    userWalletInfo: {},
    signInDetail: null,
    showMallAnswer: false
  },
  onShow: function (options) {
    const isVisitor = wx.getStorageSync(`isVisitor`)
    const profileBanners = App.globalData.profileBanners || []
    if (!isVisitor){
      this.getSignInDetail();
    }
    
    App.HttpService.getUserInfoCount()
      .then(data => {
        this.setData({
          userWalletInfo: data.data,
          userDetail: wx.getStorageSync(`userDetail`),
        })
      }
      )
      .catch(e => { })
    this.setData({ isVisitor, profileBanners })
    if (getApp().globalData.settingValue && getApp().globalData.settingValue.AnswerUrl) {
      this.setData({ showMallAnswer: true })
    }
  },
  goToLogin() {
    App.WxService.reLaunch(App.Constants.Route.login)
  },
  //页面跳转
  navigatePage(e) {
    if (this.data.isVisitor) {
      this.goToLogin()
      return
    }
    const tag = e.currentTarget.dataset.tag
    const bundle = e.currentTarget.dataset.bundle
    const share = e.currentTarget.dataset.share
    if (tag == "dealerList"){
      App.WxService.navigateTo(App.Constants.Route[tag], { isFromCollection: true })
      return
    }
    if (share == '2'){
      App.WxService.navigateTo(App.Constants.Route[tag], { share: share })
      return
    }
    App.WxService.navigateTo(App.Constants.Route[tag], { bundleData: bundle ? bundle : `` })
  },
  makePhoneCall(e) {
    if (this.data.isVisitor) {
      this.goToLogin()
      return
    }
    const num = e.currentTarget.dataset.num
    if (num) {
      wx.makePhoneCall({
        phoneNumber: num,
      })
    } else {
      $yjpToast.show({ text: `暂无业务员` })
    }
  },
  logout() {
    App.WxService.reLaunch(App.Constants.Route.login, { logout: true })
    FunctionUtils.submitTalkingData()
  },

  //获取签到信息
  getSignInDetail(){
    wx.removeStorageSync(`signInUrl`)
    App.HttpService.getSignInDetail()
      .then(data => {
        if (data.success) {
          const signInDetail = data.data
          this.setData({
            signInDetail: signInDetail
          });
        }
        wx.hideLoading();
      }).catch(e => {
        wx.hideLoading();
      })
  },
  //跳转签到页面
  goSign() {
    const signInDetail = this.data.signInDetail
    wx.setStorageSync(`signInUrl`, signInDetail.signInUrl)
    App.WxService.navigateTo(App.Constants.Route.signIn)
  },
  //首页页头广告跳转
  onTapHdBanner(e) {
    let tag = e.target.dataset.tag
    let typ = tag.bannerType
    let promotionType = tag.promotionType
    let activityId = tag.targetId
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '首页广告引流',eventType:1,actionId:activityId })
    //	广告(0), 活动(1), 产品(2), 类目(3), 链接(4), 领优惠券(5),实名认证(6)
    if (typ == 1) {
      if (tag.promotionType == 5) {
        //组合活动跳组合活动详情
        App.WxService.navigateTo(ROUTE.comAtyDetail, { activityId })
      } else {
        //其他活动跳活动详情
        App.WxService.navigateTo(ROUTE.atyDetail, { promotionType, activityId })
      }
    }
    if (typ == 2) {
      App.WxService.navigateTo(ROUTE.productDetail, { productSkuId: tag.targetId })
    }
    if (typ == 3) {
      App.WxService.navigateTo(App.Constants.Route.productList, { categoryId: [tag.targetId] })
    }
    //食品专区
    if (typ == 7) {
      App.WxService.navigateTo(App.Constants.Route.sHome, { specialAreaId: activityId })
    }
    //链接广告
    // if (typ == 4) {
    //   App.WxService.navigateTo(App.Constants.Route.linkAd, { linkTitle: tag.title, linkUrl: tag.skipUrl })
    // }
  }
})


