// pages/user/prizeApply/changeNumber.js
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, OrderOperationJs } from '../../../components/yjp.js'
const App = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    disable: false,
    tagType: true,
    newList:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let prizeArr = JSON.parse(options.item)
    prizeArr.forEach(item => {
      item.handleType = 1
    })
    this.setData({
      prizeArray: prizeArr,
      orderId: options.orderId
    })
  },
  //兑奖券名称
  awardName(e) {
    let awardName = e.detail.value
    let index = e.currentTarget.dataset.index;
    let { prizeArray } = this.data
    let item = prizeArray[index]
    item.awardName = e.detail.value
    this.setData({
      prizeArray
    })
  },
  awardNum(e) {
    let index = e.currentTarget.dataset.index
    let { prizeArray } = this.data
    let item = prizeArray[index]
    item.awardNum = e.detail.value
    if (item.awardNum != 0 && !isNaN(item.awardNum)) {
      this.setData({
        prizeArray,
        tagType: true,
      })
    } else {
      this.setData({
        tagType: false
      })
    }
  },
  //如果输入的内容不是数字，失去焦点时，内容变为1
  changeNum(e){
    let index = e.currentTarget.dataset.index
    let { prizeArray } = this.data
    let item = prizeArray[index]
    item.awardNum = e.detail.value
    if (isNaN(item.awardNum)){
      item.awardNum=1
      this.setData({
        prizeArray,
        tagType: true,
      })
    }
  },
  //减数量
  reduceNum(e) {
    let index = e.currentTarget.dataset.index
    let { prizeArray } = this.data
    let item = prizeArray[index]
    if (item.awardNum > 1) {
      item.awardNum = --item.awardNum
      this.setData({
        prizeArray,
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
    let { prizeArray } = this.data
    let item = prizeArray[index]
    item.awardNum = ++item.awardNum
    this.setData({
      prizeArray,
      disable: true
    })
  },
  // 保存数量
  holdNumber() {
    let { prizeArray, orderId,newList } = this.data
    let arr = prizeArray.concat(newList)
    let reg = /^\S*([\u4e00-\u9fa5]+)\S*([\u4e00-\u9fa5]+)\S*([\u4e00-\u9fa5]+)\S*$/;
    for (let item of arr) {
      if (!reg.test(item.awardName)) {
        $yjpToast.show({ text: `【${item.awardName}】兑奖券名称必须要有三个以上汉字，请修改后提交! ` })
        return
      }
    }
    App.HttpService.changeNumber({ data: { addressId: null, items: arr, orderId, remark: null, } })
      .then(data => {
        $yjpToast.show({ text: `数量修改成功，等待司机确认` })
        let pages = getCurrentPages()
        let prePage = pages[pages.length - 2]
        let prePageTwo = pages[pages.length - 3]
        prePage.setData({ currentPage: 1, applyList: [] })
        prePageTwo.setData({ currentPage: 1, applyList: [] })
        setTimeout(() => {
          wx.navigateBack({
            delta: 1
          })
        }, 1000)
      })
      .catch(e => { $yjpToast.show({ text: e }) })
    // })
  },
  //添加新兑奖券
  addNewPrize() {
    let { prizeArray } = this.data;
    prizeArray.push({ itemId: "169368317269471399", "awardName": "", "awardNum": 1, "handleType": 0, "canAwardNum": 0, "bonusAmount": 0, "auditRemark": "" })
    this.setData({
      prizeArray
    })
  },
  //删除列表
  removeList(e) {
    let newList = this.data.newList;
    let { prizeArray } = this.data;
    let index = e.currentTarget.dataset.index;
    let item = prizeArray[index]
    if (item.handleType == 0) {
      prizeArray.splice(index, 1)
      // item.handleType = 2
      this.setData({
        prizeArray
      })
    } else {
      prizeArray.splice(index, 1)
      newList.push(item)
      newList.forEach(item => {
        item.handleType = 2
      })
      this.setData({
        prizeArray,
        newList
      })
    }
  }
})