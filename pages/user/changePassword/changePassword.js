// pages/user/changePassword/changePassword.js
const App = getApp();
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, OrderOperationJs } from '../../../components/yjp.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    pageType: false,
    pageType_one: false,
    oldPassword: '',
    newPassword: '',
    againPassword: '',
    buttonEnable: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log(options)
    let userDetail = wx.getStorageSync(`userDetail`);
    this.setData({
      mobileNo: userDetail.mobileNo
    })
  },
  tabImg() {
    this.setData({
      pageType: !this.data.pageType
    })
  },
  tabImg_old() {
    this.setData({
      pageType_old: !this.data.pageType_old
    })
  },
  oldPassword(e) { //原密码
    this.setData({
      oldPassword: e.detail.value,
    })
    this.check()
  },
  newPassword(e) { //新密码
    this.setData({
      newPassword: e.detail.value,
    })
    this.check()
  },
  againPassword(e) {  //确认密码
    this.setData({
      againPassword: e.detail.value,
    })
    this.check()
  },
  //改变确定的背景颜色
  check() {
    let { oldPassword, newPassword, againPassword } = this.data;
    if (!oldPassword || !newPassword || !againPassword) {
      this.setData({ buttonEnable: false })
      return { success: false, desc: `` }
    } else if (newPassword != againPassword) {
      this.setData({ buttonEnable: true })
      return { success: false, desc: `两次输入的新密码不一致` }
    } else if (newPassword.length < 5 || newPassword.length > 18) {
      return { success: false, desc: `密码长度为6-18位` }
    } else {
      return { success: true, desc: `` }
    }


  },
  //确定
  ensure() {
    let checkResult = this.check()
    if (!checkResult.success) {
      $yjpToast.show({ text: checkResult.desc })
      return
    }
    let { oldPassword, newPassword, againPassword } = this.data
    console.log(this.data.oldPassword)
    App.HttpService.changePassword({ data: { oldPassword: oldPassword, password: newPassword } })
      .then(data => {
        $yjpToast.show({ text: `修改成功` })
        wx.setStorageSync(`password`, newPassword)
        setTimeout(() => {
          wx.navigateBack({
            delta: 1
          })
        }, 1500)
      })
      .catch(e => { $yjpToast.show({ text: e }) })
  },

})