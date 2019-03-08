// pages/register/registerStepTwo.js
const App = getApp()
import { $yjpToast, $yjpDialog } from '../../components/yjp'
import AddressSelect from '../../components/dialog/addressSelect/addressSelect.js'
import { combine } from '../../utils/combineUtil.js'
let QQMapWX = require('./../../assets/plugins/wxSDK/qqmap-wx-jssdk.min.js')
var qqmapsdk;
let addressSelect = new AddressSelect({
  isAdd: false
})
let page = {
  data: {
    account: ``,
    password: ``,
    province: ``,
    city: ``,
    county: ``,
    street: ``,
    detailAddress: ``,
    userName: ``,
    userDisplayClass: 0,
    companyName: ``,
    contentValid: false,
    fromQuickRegister: false,
    placeholderHide: false,
    inviterId: ``

  },
  isSubmit: true,
  isManua: false,//是否手动选址
  onLoad: function (options) {
    this.setData({ account: options.account, password: options.password, fromQuickRegister: options.fromQuickRegister == `true`, inviterId: options.inviterId })
    qqmapsdk = new QQMapWX({
      key: App.Constants.TencentMapKey
    });
  },
  //拼团新注册用户选择地图的时候触发App.onHide()，所以要加控制
  onHide(){
    App.globalData.isOnSelectMap=true
  },
  onShow(){
    App.globalData.isOnSelectMap = false
  },
  chooseAddress() {
    if (this.isManua) {
      addressSelect.startSelect(this)
      return;
    }
    let that = this;
    App.WxService.getSetting()
      .then(data => {
        //没有授权则弹框请求授权
        if (!data.authSetting[`scope.userLocation`]) {
          return App.WxService.authorize({ scope: `scope.userLocation` })
            .catch(e => {
              this.setData({
                placeholderHide: true
              })
              $yjpDialog.open({
                dialogType: `defaultText`,
                dialogData: { text: `获取定位权限失败，请点击右上角省略号图标->关于->右上角设置，打开定位权限` },
                title: `温馨提示`,
                cancelText: `手动选择`,
                confirmText: `去设置`,
                onConfirm: () => {
                  this.setData({
                    placeholderHide: true
                  })
                  return wx.openSetting()
                },
                onCancel() {
                  this.setData({
                    placeholderHide: false
                  })
                  that.isManua = true;
                  addressSelect._init(that)
                },
                canDismiss: false
              })
              return Promise.reject(``)
            })
        }
      })
      .then(data =>
        App.WxService.chooseLocation().catch(e => Promise.reject(`未选择地址`))
      )
      .then(data => {
        this.setData({
          fromLocation: true
        })
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: data.latitude,
            longitude: data.longitude
          },
          success: res => {
            let province = res.result.address_component.province;
            let city = res.result.address_component.city;
            let county = res.result.address_component.district;
            let street = res.result.address_component.street;
            let detailAddress = res.result.address_component.street_number || res.result.formatted_addresses.recommend;
            let wxDetailAddress = data.address || '';
            wxDetailAddress = wxDetailAddress.replace(province, '');
            wxDetailAddress = wxDetailAddress.replace(city, '');
            wxDetailAddress = wxDetailAddress.replace(county, '');
            wxDetailAddress = wxDetailAddress.replace(street, '');
            this.setData({
              province,
              city,
              county,
              street,
              detailAddress: wxDetailAddress || detailAddress,
              longitude: data.longitude,
              latitude: data.latitude
            })
            this.updateButtonState()
          }
        })
      })
      .catch(e => $yjpToast.show({ text: e }))
  },
  bindinput(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({ [tag]: e.detail.value })
    this.updateButtonState()
  },
  switchType(e) {
    const tag = parseInt(e.currentTarget.dataset.tag)
    this.setData({ userDisplayClass: tag })
  },
  updateButtonState() {
    this.setData({
      contentValid: this.data.province
      && this.data.city && this.data.county
      && this.data.detailAddress
      && this.data.userName && this.data.companyName
    })

  },
  onConfirm() {
    let that = this;
    if (!this.isSubmit) {
      return;
    }
    if (!this.data.contentValid) {
      $yjpToast.show({ text: `请完善信息` })
      return
    } else {

      this.isSubmit = false;
      //如果注册信息中没有经纬
      if (!this.data.longitude || !this.data.latitude) {
        this.data.street = this.data.street || "";
        let address = this.data.province + this.data.city + this.data.county + this.data.street + this.data.detailAddress;
        qqmapsdk.geocoder({
          address: address,
          success(res) {
            if (res.status == 0 && res.message == "query ok") {
              that.data.longitude = res.result.location.lng;
              that.data.latitude = res.result.location.lat;
              App.HttpService.register({
                data: {
                  province: that.data.province,
                  city: that.data.city,
                  county: that.data.county,
                  street: that.data.street,
                  detailAddress: that.data.detailAddress,
                  mobileNo: that.data.account,
                  password: that.data.password,
                  userName: that.data.userName,
                  companyName: that.data.companyName,
                  userDisplayClass: that.data.userDisplayClass,
                  longitude: that.data.longitude,
                  latitude: that.data.latitude,
                  fromLocation: false,
                  locationAddress: "",
                  houseNumber: "",
                  inviterId: that.data.inviterId
                }
              }).then(data => {
                //从拼团过来的新注册用户直接跳转到拼团详情
                if (App.globalData.isRegisterAndGroupBuy) {
                  return this.onGroupBuyRegisterNavigate()
                } else {
                  //直接调登录service，如果失败给出提示，
                  return App.HttpService.userLogin({
                    appCode: App.versionConfig.appCode,
                    appVersion: App.versionConfig.appVersion,
                    deviceId: wx.getStorageSync(`deviceId`),
                    deviceType: App.versionConfig.deviceType,
                    mobileNo: that.data.account,
                    password: that.data.password,
                    isAuth: true
                  }).then(data => {
                    that.onOpenRegisterLoginNavigate(that.data.account, that.data.password)
                  }).catch(data => {
                    that.onNotOpenRegisterLoginNavigate(that.data.account, that.data.password)
                  })
                }
              }).catch(e => {
                that.isSubmit = true;
                return $yjpToast.show({ text: e })
              })
            } else {
              $yjpToast.show({ text: "您输入的地址有误，请重新输入" })
            }
          },
          fail(res) {
            $yjpToast.show({ text: "您输入的地址有误，请重新输入" })
          }
        })
      } else {
        App.HttpService.register({
          data: {
            province: that.data.province,
            city: that.data.city,
            county: that.data.county,
            street: that.data.street,
            detailAddress: that.data.detailAddress,
            mobileNo: that.data.account,
            password: that.data.password,
            userName: that.data.userName,
            companyName: that.data.companyName,
            userDisplayClass: that.data.userDisplayClass,
            longitude: that.data.longitude,
            latitude: that.data.latitude,
            fromLocation: true,
            houseNumber: this.data.houseNumber,
            locationAddress: that.data.detailAddress,
            inviterId: that.data.inviterId
          }
        }).then(data => {
          //从拼团过来的新注册用户直接跳转到拼团详情
          if (App.globalData.isRegisterAndGroupBuy) {
            return this.onGroupBuyRegisterNavigate()
          } else {
            //直接调登录service，如果失败给出提示，
            App.HttpService.userLogin({
              appCode: App.versionConfig.appCode,
              appVersion: App.versionConfig.appVersion,
              deviceId: wx.getStorageSync(`deviceId`),
              deviceType: App.versionConfig.deviceType,
              mobileNo: that.data.account,
              password: that.data.password,
              isAuth: true
            }).then(data => {
              that.onOpenRegisterLoginNavigate(that.data.account, that.data.password)
            }).catch(data => {
              that.onNotOpenRegisterLoginNavigate(that.data.account, that.data.password)
            })
          }
        }).catch(e => {
          that.isSubmit = true;
          return $yjpToast.show({ text: e })
        })
      }

    }
  },
  onGroupBuyRegisterNavigate() {
    return App.HttpService.userLogin({
      appCode: App.versionConfig.groupPurchaseAppCode,
      appVersion: App.versionConfig.appVersion,
      deviceId: wx.getStorageSync(`deviceId`),
      deviceType: App.versionConfig.deviceType,
      mobileNo: this.data.account,
      password: this.data.password,
      isAuth: true
    }).then(data => App.HttpService.saveLoginInfo(data))
      .then(data => App.WxService.reLaunch(App.Constants.Route.groupBuyDetail, { isFromRegister: true }))
      .catch(e => $yjpToast.show({ text: e }))
  },
  onOpenRegisterLoginNavigate(account, password) {
    wx.setStorageSync(`account`, account)
    wx.setStorageSync(`password`, password)
    setTimeout(() => App.WxService.reLaunch(App.Constants.Route.login, { openRegisterLogin: true }))
  },
  onNotOpenRegisterLoginNavigate(account, password) {
    wx.setStorageSync(`account`, account)
    wx.setStorageSync(`password`, password)
    setTimeout(() => App.WxService.reLaunch(App.Constants.Route.login), 1500)
    $yjpToast.show({ text: `您的注册信息提交成功，我们将于5日内审核您的账号，请耐心等待！谢谢` })
  },
  //代理组件内的方法
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
      case "beginProvince":
        addressSelect.beginProvince(this);
        break;
      case "beginCity":
        addressSelect.beginCity(this);
        break;
    }
  },
  goSelectStreet() {
    if (this.isManua) {
      if (this.data.province && this.data.city && this.data.county) {
        App.WxService.navigateTo(App.Constants.Route.selectStreet, {
          province: this.data.province,
          city: this.data.city,
          county: this.data.county
        })
      }
    } else {
      this.chooseAddress();
    }

  },
}
combine(page, addressSelect)
Page(page)