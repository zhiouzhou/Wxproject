// pages/user/receiveAddress/receiveAddress.js
const App = getApp()
import { ProductUtil, DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'
let userDetail;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    addressList: [],

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },
  onShow() {
    this.getAddressList()
    userDetail = wx.getStorageSync("userDetail");
  },
  onUnload() {
    //修改完地址后会影响全局的地址列表数据，需要刷新处理
    App.HttpService.getReceiveAddressList({ datas: [0, 1, 2, 3] })
      .then(data => {
        wx.setStorage({ key: `userAddress`, data: data.data, })
      })
  },

  //获取地址列表
  getAddressList() {
    let datas = []
    let that = this
    App.HttpService.getReceiveAddressList({ datas })
      .then(data => {
        let originalAddressList = data.data;
        let defaultAddressArr = [];
        let validAddressArr = [];
        let waitAudit = [];
        let invalid = [];
        let unpassed = []
        for (let i = 0; i < originalAddressList.length; i++) {
          let eachAddress = originalAddressList[i]
          if (eachAddress.defaultAddress) {
            defaultAddressArr.push(eachAddress)
          } else if (eachAddress.state == 1) {
            validAddressArr.push(eachAddress)
          } else if (eachAddress.state == 0) {
            waitAudit.push(eachAddress)
          } else if (eachAddress.state == 2) {
            invalid.push(eachAddress)
          } else if (eachAddress.state == 3) {
            unpassed.push(eachAddress)
          }
        }
        let addressList = []
        Array.prototype.push.apply(addressList, defaultAddressArr)
        Array.prototype.push.apply(addressList, validAddressArr)
        Array.prototype.push.apply(addressList, waitAudit)
        Array.prototype.push.apply(addressList, unpassed)
        Array.prototype.push.apply(addressList, invalid)

        that.setData({
          addressList: addressList
        })
      }).catch(error => {
        $yjpToast.show({ text: error })
      })
  },
  defaultAddress(addressId) {
    let originalAddressList = this.data.addressList
    for (let i = 0; i < originalAddressList.length; i++) {
      let eachAddress = originalAddressList[i]
      eachAddress.defaultAddress = false;
      if (eachAddress.addressId == addressId) {
        eachAddress.defaultAddress = true;
      }
    }
    this.setData({ addressList: originalAddressList })
  },
  //设置默认地址
  setDefault(e) {
    let address = e.currentTarget.dataset.address;
    if ((address.state == 1 || address.state == 0) && !address.defaultAddress) { //启用状态或者待审核状态下 才能设置
      this.setAddressDefault(address.addressId)
    }
  },
  //设置默认地址网络请求
  setAddressDefault(addressId) {
    let that = this
    App.HttpService.setAddressDefault({ addressId })
      .then(data => {
        // that.getAddressList()
        this.defaultAddress(addressId)
      }).catch(error => {
        $yjpToast.show({ text: error })
      })
  },

  //编辑
  edit(e) {
    let address = e.currentTarget.dataset.address;
    let pageType = 2
    App.WxService.navigateTo(App.Constants.Route.addNewAddress, { pageType: pageType, address: address })
  },

  //删除
  deleteAddress(e) {
    let that = this
    let address = e.currentTarget.dataset.address;
    let addressId = address.addressId
    $yjpDialog.open({
      dialogType: `defaultText`, title: `确认删除`,
      dialogData: { text: `确认删除该收货地址吗？` },
      onConfirm: () => {
        App.HttpService.deleteAddress({ addressId })
          .then(data => {
            that.getAddressList()
          }).catch(error => {
            $yjpToast.show({ text: error })
          })
      }
    })

  },

  //新增地址
  addNewAddress() {
    if (userDetail.state == 0 || userDetail.state == 3) {
      $yjpToast.show({ text: "审核通过后才可新增地址" })
      return;
    }
    let pageType = 1
    App.WxService.navigateTo(App.Constants.Route.addUserAddress, { pageType })
  }

})