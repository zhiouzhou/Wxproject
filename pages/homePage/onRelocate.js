// pages/homePage/onRelocate.js
import { $yjpToast, $yjpDialog } from '../../components/yjp.js'
const App = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    hotCityList: [],
    cityList: [],
    windowHeight: 0,
    toView: "A",
    cityName: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    App.HttpService.getHotCity()
      .then(data => {
        this.setData({
          hotCityList: data.data
        })
      })
    this.getCityList();
    const systemInfo = App.globalData.systemInfo;
    let barHeight = systemInfo.windowWidth / 750 * 78
    this.setData({
      windowHeight: systemInfo.windowHeight - barHeight,
      cityName: options.cityName
    })
  },
  //获取城市列表
  getCityList() {
    App.HttpService.getJiupiCity()
      .then(data => {
        let cityListOne = data.data.filter(item => { return item.cityId < 890 })
        for (let i = 0, l = cityListOne.length; i < l; i++) {
          cityListOne[i].viewType = "city"
        }
        this.sortArr(cityListOne, 'initials');  //重新排序
        this.sideList(cityListOne);   //获取侧边栏
      })
  },
  //重新排序
  sortArr(arr, sortStr) {
    // 排序函数（用以返回次序关系）
    var bySort = function () {
      return function (o, p) {  // p 是 o 的下一项
        var a = o[sortStr],
          b = p[sortStr];
        if (isNaN(a)) {  // 非数字排序
          return a.localeCompare(b);
        } else {
          if (a === b) {
            return 0;
          } else {
            return a > b ? 1 : -1;
          }
        }
      }
    };
    for (var i = 0; i < arr.length; i++) {
      arr.sort(bySort(arr[i][sortStr]));
    }
  },
  //侧边栏
  sideList(cityList) {
    let list = []
    for (let x of cityList) {
      let letter = x.initials
      list.push(letter)
    }
    var s = [];
    for (let i = 0; i < list.length; i++) {
      if (s.indexOf(list[i]) == -1) {
        s.push(list[i]);
      }
    }
    cityList = this.insertLetter(cityList)
    this.setData({ cityList, letterList: s })
  },
  //将首字母插入到城市列表中
  insertLetter(cityList) {
    //先取出第一个城市，做初始化的处理
    let firstCity = cityList[0]
    let temp = firstCity.initials
    cityList.splice(0, 0, { viewType: `group`, cityName: temp })
    //初始化完成后，从第二个开始遍历数组
    for (let i = 1; i < cityList.length; i++) {
      if (cityList[i].initials != temp) {
        temp = cityList[i].initials
        cityList.splice(i, 0, { viewType: `group`, cityName: temp })
      }
    }
    return cityList
  },
  relocate() {
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
        this.setData({ cityName: city })
        $yjpToast.show({ text: `重新定位成功` })
      })
      .catch(e => $yjpToast.show({ text: e }))
    getLocationPromise()
  },
  selectCity(e) {
    let cityName = e.currentTarget.dataset.cityName;
    let viewType = e.currentTarget.dataset.viewType;
    if (viewType == `group`) return
    let cityId = e.currentTarget.dataset.cityId - 0
    wx.setStorageSync(`cityName`, cityName)
    wx.setStorageSync(`cityId`, cityId)
    var pages = getCurrentPages();
    var currPage = pages[pages.length - 1];  //当前页面
    var prevPage = pages[pages.length - 2]; //上一个页面
    // 直接调用上一个页面的setData()方法，把数据存到上一个页面中去
    prevPage.setData({
      cityName: cityName,
      cityId: cityId,
    })
    prevPage.getHomePageInfo()
    setTimeout(() => {
      wx.navigateBack({
        delta: 1
      });
    }, 1000)
  },
  selectLetter(e) {
    let item = e.currentTarget.dataset.item;
    this.setData({
      toView: item
    })
  },
  selectHotCity(e) {
    let cityName = e.currentTarget.dataset.cityName;
    let { cityList } = this.data;
    let newList = cityList.find(item => item.cityName == cityName)
    let _id = newList.cityId - 0
    wx.setStorageSync(`cityName`, cityName)
    wx.setStorageSync(`cityId`, _id)
    var pages = getCurrentPages();
    var currPage = pages[pages.length - 1];  //当前页面
    var prevPage = pages[pages.length - 2]; //上一个页面
    // 直接调用上一个页面的setData()方法，把数据存到上一个页面中去
    prevPage.setData({
      cityName: cityName,
      cityId: _id,
    })
    setTimeout(() => {
      wx.navigateBack({
        delta: 1
      });
    }, 1000)
  }
})