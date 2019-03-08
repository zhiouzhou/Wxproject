// pages/user/groupBuying/groupBuyDetail.js
const App = getApp()
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'
let countDown
Page({
  data: {
    groupBuyDetail: {},
    loopTimesArr: [],//显示拼团人数头像的数组
    countDownArr: []
  },
  onLoad: function (options) {
    console.log(`拼团详情进入参数`, options)
    //隐藏页面顶部分享菜单
    wx.hideShareMenu()
    wx.showLoading({
      title: '加载中',
    })
    //当前页面有多个入口：新注册，分享，我的拼团列表
    const isFromShare = options.isFromShare == `true`
    const isFromRegister = options.isFromRegister == `true`
    let groupPurchaseId = options.groupPurchaseId || ``
    let cityId = ``
    let userClassId = ``
    let userDisplayClass = ``
    if (isFromShare) {
      cityId = options.cityId
      userClassId = options.userClassId
      userDisplayClass = options.userDisplayClass
    } else if (isFromRegister) {
      let registerAndGroupBuyObj = App.globalData.registerAndGroupBuy
      cityId = registerAndGroupBuyObj.cityId
      userClassId = registerAndGroupBuyObj.userClassId
      userDisplayClass = registerAndGroupBuyObj.userDisplayClass
      groupPurchaseId = registerAndGroupBuyObj.groupPurchaseId
      App.globalData.registerAndGroupBuy = {}
      App.globalData.isRegisterAndGroupBuy = false
    } else {
      //我的拼团列表进入则直接取当前会员的城市id，因为第一次必定是从列表进入,拼团一但开启则活动ID，拼团ID，城市ID就已经绑定了，分享多次也不会改变其值
      cityId = wx.getStorageSync(`userDetail`).cityId
      let userDisplayClassName = wx.getStorageSync(`userDetail`).userDisplayClassName
      userClassId = userDisplayClassName == `烟酒店` ? 0 : userDisplayClassName == `餐饮店` ? 1 : userDisplayClassName == `便利店` ? 2 : 0
      userDisplayClass = wx.getStorageSync(`userDetail`).userDisplayClassId
    }
    console.log(`拼团详情处理后参数`, isFromShare, groupPurchaseId, cityId, userClassId, userDisplayClass)
    this.setData({ isFromShare, groupPurchaseId, cityId, userClassId, userDisplayClass, isFromRegister })
  },
  onShow: function () {
    let { groupPurchaseId, userClassId, cityId, userDisplayClass, isFromRegister } = this.data
    let param = {}
    let that = this
    App.HttpService.onAppLaunch().then(data => {
      this.getGroupBuyDetail(groupPurchaseId, userClassId, cityId, userDisplayClass)
    })
  },
  getloopTimesArr(groupPurchase) {
    //拼团头像展示数组长度
    // 1.拼团中，末尾始终展示一个加号，数组长度为已参团人数加一
    // 2.拼团失败，同上，但是加号点击不可分享
    // 3.拼团成功，数组长度为成团人数
    // 4.强制拼团成功，数组长度为成团人数
    let loopTimesArrlength = !groupPurchase ? 0 :
      groupPurchase.groupPurchaseState == 1 ? groupPurchase.minParticipantCount :
        (groupPurchase.minParticipantCount - groupPurchase.lackParticipantCount + 1)
    return loopTimesArrlength ? new Array(loopTimesArrlength) : []
  },
  startCountDown() {
    countDown = null
    let groupBuycountDownArr = []
    countDown = setInterval(() => {
      groupBuycountDownArr = DateUtil.getTimestampCountDownArr(this.data.groupBuyDetail.endTime)
      //时间到了则必定是从拼团中过度到强制拼团成功
      if (!groupBuycountDownArr) {
        let groupBuyDetail = this.data.groupBuyDetail
        groupBuyDetail.groupPurchaseState = 1
        this.setData({
          countDownArr: [],
          groupBuyDetail,
          loopTimesArr: this.getloopTimesArr(groupBuyDetail)
        })
        clearInterval(countDown)
        countDown = null
      } else {
        this.setData({ countDownArr: groupBuycountDownArr })
      }
    }, 1000)
  },
  getGroupBuyDetail(groupPurchaseId, userClassId, cityId, userDisplayClass) {
    let param = {}
    param.data = groupPurchaseId
    param.addressId = getApp().globalData.addressId
    param.userDisplayClass = userDisplayClass
    param.deviceType = '5'
    param.userClassId = userClassId
    param.noToken = true
    param.cityId = cityId
    let that = this
    wx.request({
      url: wx.getStorageSync(`businessUrl`) + `GroupPurchase/ShareDetail`,
      data: param,
      header: {chartset: `utf-8`, 'Content-Type': 'application/json' },
      method: `POST`,
      success(data) {
        wx.hideLoading()
        if (data.data.data) {
          //拼团中则开启倒计时
          if (data.data.data.groupPurchaseState == 0) {
            that.startCountDown()
          }
          let countDownArr = DateUtil.getTimestampCountDownArr(data.data.data.endTime)
          let loopTimesArr = that.getloopTimesArr(data.data.data)
          that.setData({
            countDownArr,
            groupBuyDetail: data.data.data,
            loopTimesArr: loopTimesArr
          })
        }
      },
      fail() {
        $yjpDialog.open({
          dialogType: `defaultText`,
          title: `温馨提示`,
          dialogData: { text: `网络错误，请重试` },
          canDismiss: false, hiddenCancel: true,
          confirmText: `返回上一页`,
          onConfirm: () => App.WxService.navigateBack()
        })
      },
      complete() {
        wx.hideLoading()
      }
    })
  },
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      return this.onClickShareButton()
    }
  },
  onUnload() {
    //待审核用户，直接清除掉refreshToken防止自动登录
    if (this.data.isFromRegister) {
      App.WxService.removeStorage({ key: `refreshToken` })
    }
    countDown = null
  },

  onClickShareButton() {
    let { groupBuyDetail, cityId, userClassId, userDisplayClass } = this.data
    // 来自页面内转发按钮
    return {
      imageUrl: `${groupBuyDetail.productImgUrl}`,
      title: `${groupBuyDetail.productName}火热拼团中`,
      path: `${App.Constants.Route.groupBuyDetail}?isFromShare=true&groupPurchaseId=${groupBuyDetail.groupPurchaseId}&cityId=${cityId}&userClassId=${userClassId}&userDisplayClass=${userDisplayClass}`
    }
  },
  onMoreGroup() {
    App.WxService.navigateTo(App.Constants.Route.groupFrame, { source: 1 })
  },
  goToRule() {
    App.WxService.navigateTo(App.Constants.Route.explain, { keyWord: `拼团规则` })
  },
  onClickJoinGroup() {
    let { groupBuyDetail } = this.data
    wx.showLoading({
      title: '处理中',
    })
    return App.HttpService.autoLogin()
      .then(data => {
        wx.hideLoading()
        //自动登录失败，跳转到登录页面,并加个拼团的标识，存储当前团购信息
        if (!data) {
          App.WxService.redirectTo(App.Constants.Route.login)
          App.globalData.isRegisterAndGroupBuy = true
          App.globalData.registerAndGroupBuy = {
            cityId: this.data.cityId,
            userClassId: this.data.userClassId,
            groupPurchaseId: this.data.groupPurchaseId,
            userDisplayClass: this.data.userDisplayClass
          }
        } else {
          let cityId = wx.getStorageSync(`userDetail`).cityId
          let shareCityId = this.data.cityId
          console.log(`用户的cityId+分享的cityId`, cityId, shareCityId)
          if (cityId != shareCityId) {
            $yjpDialog.open({
              dialogType: `defaultText`, title: `温馨提示`,
              hiddenCancel: true,
              dialogData: { text: `抱歉，您和团长不在同一个城市，无法参与拼团活动。看看您所在城市的拼团活动吧。` },
              onConfirm: () => {
                App.WxService.navigateTo(App.Constants.Route.groupFrame, { source: 1 })
              }
            })
          } else {
            App.WxService.navigateTo(App.Constants.Route.groupFrame, { source: 0, promotionId: groupBuyDetail.promotionId, isGroupJoin: true, groupPurchaseId: groupBuyDetail.groupPurchaseId })
          }
        }
      })
  }

}) 