// pages/user/receiveAddress/addUserAddress.js
const App = getApp();
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, OrderOperationJs } from '../../../components/yjp.js'
import { $yjpDialog } from '../../../components/yjp'
import AddressSelect from '../../../components/dialog/addressSelect/addressSelect.js'
import { combine } from '../../../utils/combineUtil.js'
let QQMapWX = require('./../../../assets/plugins/wxSDK/qqmap-wx-jssdk.min.js')

var qqmapsdk;

let addressSelect = new AddressSelect({
  isAdd: true
});
let page = {

  /**
   * 页面的初始数据
   */
  data: {
    contact: '',
    mobileNo: '',
    houseNumber: ``,
    telephone: '',
    buttonEnable: false,
    isManua: false,
    holdFlag: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    qqmapsdk = new QQMapWX({
      key: App.Constants.TencentMapKey
    });
    if (options.source == `orderSubmit`) {
      let currentLocation = JSON.parse(options.currentLocation)
      let currentAddress = JSON.parse(options.currentAddress)
      let source = options.source
      let province = currentLocation.address_component.province;
      let city = currentLocation.address_component.city;
      let county = currentLocation.address_component.district;
      let street = currentLocation.address_component.street;
      let detailAddress = currentLocation.formatted_addresses.recommend;
      // let detailAddress = currentLocation.address_component.street_number || currentLocation.formatted_addresses.recommend;
      // let wxDetailAddress = currentLocation.address || '';
      // wxDetailAddress = wxDetailAddress.replace(province, '');
      // wxDetailAddress = wxDetailAddress.replace(city, '');
      // wxDetailAddress = wxDetailAddress.replace(county, '');
      // wxDetailAddress = wxDetailAddress.replace(street, '');
      this.setData({
        currentLocation, currentAddress, source,
        contact: currentAddress.contact,
        mobileNo: currentAddress.mobileNo,
        province,
        city,
        county,
        street,
        // detailAddress: wxDetailAddress,
        detailAddress,
        longitude: currentLocation.location.lng,
        latitude: currentLocation.location.lat
      })
      this.check()
    }
  },
  //收货人
  userName(e) {
    this.setData({
      contact: e.detail.value
    })
    this.check();
  },
  //手机号
  userPhone(e) {
    this.setData({
      mobileNo: e.detail.value
    })
    this.check();
  },
  //门牌号
  houseNumber(e) {
    this.setData({
      houseNumber: e.detail.value
    })
    this.check();
  },
  //固定电话
  userTelephone(e) {
    this.setData({
      telephone: e.detail.value
    })
    this.check();
  },
  //判断保存地址背景颜色
  check() {
    let { contact, mobileNo, telephone, city, county, province, street, detailAddress, houseNumber } = this.data
    if (!contact || !mobileNo || !city || !county || !province || !detailAddress) {
      this.setData({ buttonEnable: false })
      return { success: false, desc: `` }
    } else if (mobileNo.length != 11) {

      return { success: false, desc: `请输入正确的手机号` }
    } else {
      this.setData({ buttonEnable: true })
      return { success: true, desc: `` }
    }
  },
  // 选择地址
  choose() {
    let that = this;
    App.WxService.getSetting()
      .then(data => {
        //没有授权则弹框请求授权
        if (!data.authSetting[`scope.userLocation`]) {
          return App.WxService.authorize({ scope: `scope.userLocation` })
            .catch(e => {
              $yjpDialog.open({
                dialogType: `defaultText`,
                dialogData: { text: `获取定位权限失败，请点击右上角省略号图标->关于->右上角设置，打开定位权限` },
                title: `温馨提示`,
                onCancel() {
                  let userDetail = wx.getStorageSync('userDetail');
                  that.setData({
                    isManua: true,
                    province: userDetail.province,
                    city: userDetail.city,
                    county: userDetail.county
                  })
                  addressSelect.addressInfo.province = userDetail.province;
                  addressSelect.addressInfo.city = userDetail.city;
                  addressSelect.addressInfo.county = userDetail.county;
                  addressSelect._init(that)
                },
                cancelText: `手动选择`,
                confirmText: `去设置`,
                onConfirm: () => wx.openSetting()
              })
              return Promise.reject(``)
            })
        }
      })
      .then(data =>
        App.WxService.chooseLocation().catch(e => Promise.reject(`未选择地址`))
      )
      .then(data => {
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: data.latitude,
            longitude: data.longitude
          },
          success: (res) => {
            let province = res.result.address_component.province;
            let city = res.result.address_component.city;
            let county = res.result.address_component.district;
            let street = res.result.address_component.street;
            let detailAddress = res.result.formatted_addresses.recommend;
            // let detailAddress = res.result.address_component.street_number || res.result.formatted_addresses.recommend;
            // let wxDetailAddress = data.address || '';
            // wxDetailAddress = wxDetailAddress.replace(province, '');
            // wxDetailAddress = wxDetailAddress.replace(city, '');
            // wxDetailAddress = wxDetailAddress.replace(county, '');
            // wxDetailAddress = wxDetailAddress.replace(street, '');
            that.setData({
              currentLocation: res.result,
              province,
              city,
              county,
              street,
              // detailAddress: wxDetailAddress || detailAddress,
              detailAddress,
              longitude: data.longitude,
              latitude: data.latitude
            })
            that.check();
          },
          fail: (res) => {
          },
          complete: (res) => {
          }
        })
      })
  },
  detailAddress(e) {
    this.setData({
      detailAddress: e.detail.value
    })
    this.check()
  },
  // keepAddress(){
  //   debounce(3000, this.hold)
  // },
  //保存收货地址
  hold() {
    let that = this;
    if (this.data.holdFlag) {
      let flag = false

      let checkResult = this.check();
      if (!checkResult.success) {
        $yjpToast.show({ text: checkResult.desc })
        return
      }
      let { contact, mobileNo, telephone, city, county, province, street, detailAddress,
        longitude, latitude, houseNumber, currentLocation, currentAddress, source } = this.data;
      //手动选择地址时，提交地址没有经纬度；使用地址解析求出经纬度
      if (!longitude || !latitude) {
        street = street ? street : ''
        let address = province + city + county + street + detailAddress;
        this.setData({ holdFlag: flag });
        qqmapsdk.geocoder({
          address,
          success(res) {
            //和注册的地址区域一致时候才能提交成功
            let userDetail = wx.getStorageSync(`userDetail`)

            // if (!isSameArea) {
            //   that.setData({ holdFlag: true })
            //   return $yjpToast.show({ text: "收货地址与注册地址不一致，请重新输入" })
            // }
            if (res.status == 0 && res.message == "query ok") {
              longitude = res.result.location.lng;
              latitude = res.result.location.lat;
              App.HttpService.addAddress({

                data: {
                  contact, mobileNo, telephone, city, county, province, street, detailAddress, longitude, latitude,
                  defaultAddress: false, fromLocation: false, houseNumber: houseNumber || '', locationAddress: ``
                }
              })
                .then(data => {
                  $yjpToast.show({ text: `保存成功` })
                  setTimeout(() => {
                    wx.navigateBack({
                      delta: 1
                    })
                  }, 1500)
                }).catch(error => {
                  flag = true
                  $yjpToast.show({ text: error })
                  this.setData({ holdFlag: flag })
                })
            } else {
              $yjpToast.show({ text: "您输入的地址有误，请重新输入" })
              this.setData({ holdFlag: true })
            }
          },
          fail(res) {
            $yjpToast.show({ text: "您输入的地址有误，请重新输入" })
            this.setData({ holdFlag: true })
          }
        })
      } else {
        //和注册的地址区域一致时候才能提交成功
        let userDetail = wx.getStorageSync(`userDetail`)
        let isSameArea = userDetail.city == city;
        if (!isSameArea) {
          this.setData({ holdFlag: true })
          return $yjpToast.show({ text: "收货地址与注册地址不一致，请重新输入" })
        }
        this.setData({ holdFlag: flag })
        if (source == `orderSubmit`) {
          let pages = getCurrentPages()
          let prePage = pages[pages.length - 2]
          currentLocation.address_component.detailAddress = detailAddress
          currentLocation.address_component.houseNumber = houseNumber
          prePage.setData({ currentLocation })
          setTimeout(() => {
            wx.navigateBack({
              delta: 1
            })
          }, 1500)
          return
        }
        this.setData({ holdFlag: flag })
        wx.showLoading({
          title: '处理中',
          mask: true
        })
        App.HttpService.addAddress({
          data: {
            contact, mobileNo, telephone, city, county, province, street, detailAddress, longitude, latitude,
            defaultAddress: source == `orderSubmit` && currentAddress.defaultAddress,
            fromLocation: true, houseNumber: houseNumber || '',
            locationAddress: detailAddress
          }
        })
          .then(data => {
            $yjpToast.show({ text: `保存成功` })
            wx.hideLoading()
            this.setData({ holdFlag: true })
            setTimeout(() => {
              wx.navigateBack({
                delta: 1
              })
            }, 10)
          }).catch(error => {
            flag = true
            wx.hideLoading()
            $yjpToast.show({ text: error })
            this.setData({ holdFlag: true })
          })
      }

    }
  },
  onDismiss(event) {
    addressSelect.onDismiss(this)

  },
  proxyFun(event) {
    let tag = event.currentTarget.dataset.tag;
    switch (tag) {
      case "onDismiss":
        addressSelect.onDismiss(this);
        break;
      case "changeProvince":
        let province = event.currentTarget.dataset.data;
        addressSelect.changeProvince(this, province)
        break;
      case "changeCity":
        let city = event.currentTarget.dataset.data;
        addressSelect.changeCity(this, city);
        break;
      case 'changeCounty':
        let county = event.currentTarget.dataset.data;
        addressSelect.changeCounty(this, county);
        addressSelect.onDismiss(this);
        break;
      case "startSelect":
        addressSelect.startSelect(this)
        break;
    }
  },
  goSelectStreet() {
    if (this.data.province && this.data.city && this.data.county) {
      App.WxService.navigateTo(App.Constants.Route.selectStreet, {
        province: this.data.province,
        city: this.data.city,
        county: this.data.county
      })
    }
  }

}

combine(page, addressSelect)
Page(page)