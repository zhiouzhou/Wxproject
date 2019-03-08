// pages/user/prizeApply/addApply.js
const App = getApp();
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    awardNum: 1,
    disable: false,
    buttonCanTap: false,
    awardList: [],
    awardName: '',
    textColor:true,
    disabled:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let userDetail = wx.getStorageSync(`userDetail`);
    let userAddress = wx.getStorageSync(`userAddress`);
    let userDefaltAddress = userAddress.find(item => item.defaultAddress == true)
    let awardName = this.data.awardName
    this.setData({
      userName: userDetail.userName,
      mobileNo: userDetail.mobileNo,
      address: userDefaltAddress,
      awardList: [{ awardNum: 1, awardName: awardName, handleType: 0 }]
    })
  },
  //备注信息
  remarkValue(e) {
    this.setData({
      remarkValue: e.detail.value
    })

  },
  //兑奖券名称
  awardName(e) {
    let awardName = e.detail.value
    let index = e.currentTarget.dataset.index
    let { awardList } = this.data
    let item = awardList[index]
    item.awardName = e.detail.value
    this.setData({ awardList }, this.check())
  },
  awardNum(e) {
    let index = e.currentTarget.dataset.index
    let { awardList } = this.data
    let item = awardList[index]
    item.awardNum = e.detail.value
    item.awardName
    if (item.awardNum != 0 && !isNaN(item.awardNum)) {
      this.setData({
        awardList,
      })
    } else {
      this.setData({
      })
    }
  },
  //如果输入的内容不是数字，失去焦点时，内容变为1
  changeNum(e) {
    let index = e.currentTarget.dataset.index
    let { awardList } = this.data
    let item = awardList[index]
    console.log(item)
    item.awardNum = e.detail.value
    item.awardName
    if (isNaN(item.awardName) || item.awardName < 1) {
      item.awardNum = 1
      this.setData({
        awardList,
      })
    }
  },
  //减数量
  reduceNum(e) {
    let index = e.currentTarget.dataset.index
    let { awardList } = this.data
    let item = awardList[index]
    item.awardName
    if (item.awardNum > 1) {
      item.awardNum = --item.awardNum
      this.setData({
        awardList,
        disable: true
      })
    } else {
      this.setData({
        disable: false
      })
      return
    }
  },
  //加数量
  addNum(e) {
    let index = e.currentTarget.dataset.index
    let { awardList } = this.data
    let item = awardList[index]
    item.awardNum = ++item.awardNum
    item.awardName
    this.setData({
      awardList,
      disable: true
    })
  },
  //改变按钮状态
  check() {
    let { awardList } = this.data
    let boo = false
    boo = awardList.every(item => item.awardName.trim() !== ``)
    this.setData({ buttonCanTap: boo })
    return boo
  },
  // 选择取券地址
  selectAddress() {
    App.WxService.navigateTo(App.Constants.Route.selectPrizeAddress)
  },
  //添加新兑奖券
  addNewPrize() {
    let { awardList } = this.data;
    awardList.push({ awardNum: 1, awardName: ``, handleType: 0 })
    this.setData({ awardList }, this.check())
  },
  //删除列表
  removeList(e) {
    let index = e.currentTarget.dataset.index
    let { awardList } = this.data;
    let item = awardList[index];
    awardList.splice(index, 1)
    this.setData({ awardList }, this.check())
  },
  //提交申请
  submitApply() {
    let { awardList, userName, mobileNo, address, remarkValue, buttonCanTap, textColor } = this.data;
    let reg = /^\S*([\u4e00-\u9fa5]+)\S*([\u4e00-\u9fa5]+)\S*([\u4e00-\u9fa5]+)\S*$/;
    for (let item of awardList) {
      if (!reg.test(item.awardName)) {
        $yjpToast.show({ text: `【${item.awardName}】兑奖券名称必须要有三个以上汉字，请修改后提交! `})
        return;
      }
    }
    if (buttonCanTap) {
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        dialogData: { text: `兑奖申请已经提交成功,会和最近的订单一并由司机上门处理。` },
        hiddenCancel: true, confirmText: `我知道了`,
        onConfirm: () => {
          App.HttpService.addApply({ data: { addressId: address.addressId, items: awardList, remark: remarkValue } })
            .then(data => {
              let pages = getCurrentPages()
              let prePage = pages[pages.length - 2]
              prePage.setData({ currentPage: 1, applyList: [], awardList: awardList })
              wx.navigateBack({
                delta: 1
              })
            }).catch(e => { })
        }
      })
      this.setData({
        textColor:false,
        disabled:true,
      })
    } else { }


  },
})