// pages/user/receiveAddress/addNewAddress.js
const App = getApp();
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
    address: {},
    buttonEnable: true,
    fromLocation: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const pageType = parseInt(options.pageType)
    const address = JSON.parse(options.address)
    let title = pageType == 1 ? '新增收货地址' : '编辑收货地址'
    wx.setNavigationBarTitle({ title })
    //是否为定位地址
    if (address.fromLocation) {
      address.detailAddress = address.locationAddress
    }
    this.setData({ address })
    qqmapsdk = new QQMapWX({
      key: App.Constants.TencentMapKey
    });
  },
  //收货人
  userName(e) {
    let address = this.data.address;
    let contact = e.detail.value;
    address.contact = contact;
    this.setData({
      address
    })
    this.check();
  },
  //手机号‘
  userPhone(e) {
    let address = this.data.address;
    let mobileNo = e.detail.value;
    address.mobileNo = mobileNo;
    this.setData({
      address
    })
    this.check();
  },
  // 固定电话
  userTelephone(e) {
    let address = this.data.address;
    let userTelephone = e.detail.value;
    address.telephone = userTelephone;
    this.setData({
      address
    })
    this.check();
  },
  //门牌号
  houseNumber(e) {
    this.setData({
      "address.houseNumber": e.detail.value
    })
    this.check();
  },
  //修改地址
  choose() {
    let that = this;
    let address = this.data.address;
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
                  let address = that.data.address;
                  that.setData({
                    isManua: true,
                    "address.province": address.province,
                    "address.city": address.city,
                    "address.county": address.county,
                    "address.fromLocation": false
                  })
                  //设置组件中的初始地址信息
                  //手动选择地址清空经纬度信息
                  address.longitude = "";
                  address.latitude = "";
                  addressSelect.addressInfo.province = address.province;
                  addressSelect.addressInfo.city = address.city;
                  addressSelect.addressInfo.county = address.county;
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
      .then(data =>{
        return App.WxService.chooseLocation().catch(e => Promise.reject(`未选择地址`))
      }  
      ).then(data => {
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
            let detailAddress = res.result.address_component.street_number || res.result.formatted_addresses.recommend;
            let wxDetailAddress = data.address;
            wxDetailAddress = wxDetailAddress.replace(province, '');
            wxDetailAddress = wxDetailAddress.replace(city, '');
            wxDetailAddress = wxDetailAddress.replace(county, '');
            wxDetailAddress = wxDetailAddress.replace(street, '');
            that.setData({
              "address.province": province,
              "address.city": city,
              "address.county": county,
              "address.street": street,
              "address.detailAddress": wxDetailAddress || detailAddress,
              "address.longitude": data.longitude,
              "address.latitude": data.latitude,
              "address.fromLocation": true
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
  //保存收货地址
  hold() {
    let checkResult = this.check();
    if (!checkResult.success) {
      $yjpToast.show({ text: checkResult.desc })
      return
    }
    let { address } = this.data;
    if (!address.fromLocation) {
      address.street = address.street || '';
      let addressData = address.province + address.city + address.county + address.street + address.detailAddress;
      qqmapsdk.geocoder({
        address: addressData,
        success(res) {
          if (res.status == 0 && res.message == "query ok") {
              address.longitude = res.result.location.lng;
              address.latitude = res.result.location.lat;
              App.HttpService.editAddress({ data: { contact: address.contact, mobileNo: address.mobileNo, telephone: address.telephone, province: address.province, city: address.city, county: address.county, street: address.street, detailAddress: address.detailAddress, addressId: address.addressId, latitude: address.latitude, longitude: address.longitude } })
              .then(data => {
                wx.navigateBack({
                  delta: 1
                })
              })
              .catch(error => {
                $yjpToast.show({ text: error })
              })
          } else {
            $yjpToast.show({ text: "您输入的地址有误，请重新输入！" })
          }
          
        },
        fail(res) {
          $yjpToast.show({ text: "您输入的地址有误，请重新输入！" })
        }
      })
    } else {
    
      address.street = address.street || '';
      let locationAddress = address.detailAddress;
        App.HttpService.editAddress({ data: { contact: address.contact, mobileNo: address.mobileNo, telephone: address.telephone, province: address.province, city: address.city, county: address.county, street: address.street, detailAddress: address.detailAddress, addressId: address.addressId, latitude: address.latitude, longitude: address.longitude, fromLocation: true, houseNumber: address.houseNumber || "", locationAddress: locationAddress} })
        .then(data => {
          wx.navigateBack({
            delta: 1
          })
        })
        .catch(error => {
          $yjpToast.show({ text: error })
        })
    }
    
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
  detailAddress(e) {
    this.setData({
      "address.detailAddress": e.detail.value
    })
    this.check();
  },
  //判断保存地址
  check() {
    let { contact, mobileNo, telephone, city, county, province, street, detailAddress } = this.data.address
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
  goSelectStreet() {
    if (this.data.address.province && this.data.address.city && this.data.address.county) {
      App.WxService.navigateTo(App.Constants.Route.selectStreet, {
        province: this.data.address.province,
        city: this.data.address.city,
        county: this.data.address.county
      })
    }
  }

}
Page(page)