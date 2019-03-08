// pages/login/guide.js
const App = getApp()
import { $yjpToast } from '../../components/yjp'
Page({
  data: {
    openStoreYears: [`1年以内`, `1~3年`, `3年以上`],
    businessHours: [],
    productGuideTags: [],
    yearsSelectedIndex: -1,
    hoursSelectedIndex: -1,
    tagsArr: []
  },
  onLoad: function (options) {
    App.HttpService.guideListTag()
      .then(data => this.setData({
        businessHours: data.data.businessHours,
        productGuideTags: data.data.productGuideTags.map(value => ({ select: false, value: value }))
      }))
      .catch(e => console.warn(e))
  },
  onTagSelect(e) {
    const tag = e.currentTarget.dataset.tag
    const index = e.currentTarget.dataset.index
    switch (tag) {
      case `years`:
        this.setData({ yearsSelectedIndex: index })
        break;
      case `hours`:
        this.setData({ hoursSelectedIndex: index })
        break;
      case `product`:
        const beforeSelect = this.data.productGuideTags[index].select
        let { tagsArr } = this.data
        //记录标签文字的数组超过四个且点击选中则直接返回
        if (tagsArr.length >= 4 && !beforeSelect) return
        const str = e.currentTarget.dataset.str
        if (beforeSelect) {
          //取消一个标签
          tagsArr.splice(tagsArr.findIndex(item => item === str), 1)
        } else {
          //选中一个标签
          tagsArr.push(str)
        }
        this.setData({ [`productGuideTags[` + index + `].select`]: !beforeSelect, tagsArr })
        break;
      default:
        break;
    }
  },
  startShopping() {
    if (this.data.yearsSelectedIndex == -1) {
      $yjpToast.show({ text: `请选择开店时间` })
      return
    } else if (this.data.hoursSelectedIndex == -1) {
      $yjpToast.show({ text: `请选择营业时间` })
      return
    } else if (!this.data.tagsArr.length) {
      $yjpToast.show({ text: `请至少选择一个标签` })
      return
    }

    //为了达到获取权限或者拒绝权限都能继续流程的效果，这两个promise分开写
    let city = ``, latitude = 0, longitude = 0
    const getLocationPromise = () => App.WxService.getSetting()
      .then(data => {
        //没有授权则弹框请求授权
        if (!data.authSetting[`scope.userLocation`]) {
          return App.WxService.authorize({ scope: `scope.userLocation` })
            .catch(e => Promise.reject(`获取定位权限失败`))
        }
      })
      .then(data =>
        App.WxService.getLocation()
      )
      .then(data =>
        App.HttpService.getBaiduLocation({
          ak: App.Constants.BaiduMapAKCode,
          location: `${data.latitude},${data.longitude}`,
          output: `json`, pois: 1,
          baseUrl: App.Constants.BaiduMapBaseUrl
        })
      )
      .then(data => {
        city = data.status == 0 ? data.result.addressComponent.city : ``
        latitude = data.status == 0 ? data.result.location.lat : 0
        longitude = data.status == 0 ? data.result.location.lng : 0
        wx.setStorageSync(`cityName`, city)
      })
      .then(data => this.saveVisitorInfo(city, latitude, longitude))
      .catch(e => this.saveVisitorInfo(city, latitude, longitude))
    getLocationPromise()
  },
  //保存访客信息
  saveVisitorInfo(city, latitude, longitude) {
    let _this = this;
    const recordVisitorPromise = () => App.HttpService.addUserInfo({
      data: {
        businessHours: this.data.businessHours[this.data.hoursSelectedIndex],
        city: city,
        latitude: latitude,
        longitude: longitude,
        openStoreTime: this.data.openStoreYears[this.data.yearsSelectedIndex],
        productTags: this.data.tagsArr,
      }
    }).then(data => {
      wx.setStorageSync(`isVisitor`, true)
      wx.setStorageSync(`haveGuided`, true)
      wx.setStorageSync(`cityId`, data.data.cityId)
      wx.setStorageSync(`userClassId`, data.data.userClassId)
      wx.setStorageSync(`userDisplayClass`, data.data.userDisplayClass)
      App.WxService.switchTab(App.Constants.Route.homePage)
    }).catch(e => $yjpToast.show({ text: e }))
    recordVisitorPromise()
  }
})