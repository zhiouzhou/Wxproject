// pages/user/prizeApply/prizeApply.js
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog, OrderOperationJs } from '../../../components/yjp.js'
const App = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentPage: 1,
    pageSize: 20,
    applyList: [],
    showTitle: true,
    vm: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //let systemInfo = wx.getStorageSync(`systemInfo`);
    const systemInfo = App.globalData.systemInfo;
    let settingValue = App.globalData.settingValue;
    this.setData({
      windowHeight: systemInfo.windowHeight * systemInfo.pixelRatio,
      textTitle: settingValue.AwardOrderServiceRemark,
    })
  },
  onShow() {
    this.setData({
      currentPage: 1,
      applyList: [],
    })
    this.getData();
  },
  lower() {
    this.getData();
  },
  getData() {
    let { currentPage, pageSize, applyList } = this.data
    if (this.data.requesting) return;
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    return App.HttpService.awardOrderList({ currentPage, pageSize })
      .then(data => {
        if ((!data.data || !data.data.length) && currentPage == 1) {
          this.setData({
            applyList: [],
            vm: { isEmpty: true }
          })
        } else if ((!data.data || !data.data.length) && currentPage != 1) {
          $yjpToast.show({ text: `没有更多数据了` })
        } else {
          let oldArr = applyList;
          let newArr = data.data;
          let finalArray = oldArr.concat(newArr)
          this.setData({
            applyList: finalArray,
            currentPage: ++this.data.currentPage,
            vm: { isEmpty: false }
          })
        }
        this.setData({ requesting: false })
        wx.hideLoading();
      })
      .catch(e => { this.setData({ requesting: false }) })
  },
  closeTitle() {
    this.setData({
      showTitle: false
    })
  },

  //新增申请
  addApply() {
    App.WxService.navigateTo(App.Constants.Route.addApply)
  },
  //修改数量
  changeNumber(e) {
    let item = e.currentTarget.dataset.item
    let orderId = e.currentTarget.dataset.orderId
    App.WxService.navigateTo(App.Constants.Route.changeNumber, { item, orderId, handleType: 1 })
  },
  //取消申请
  cancelApply(e) {
    let orderId = e.currentTarget.dataset.orderId
    let index = e.currentTarget.dataset.index
    let { applyList } = this.data
    let item = applyList[index]
    item.canCancel = false
    item.canModify = false
    item.canDelete = true
    item.state = '已取消'
    item.stateValue = 4
    $yjpDialog.open({
      dialogType: `defaultText`, title: `确认删除`,
      dialogData: { text: `确认取消该兑奖申请吗？` },
      onConfirm: () => {
        App.HttpService.cancelApply({ data: orderId })
          .then(data => {
            this.setData({
              applyList
            })
          })
      }
    })
  },
  //删除申请
  deleteApply(e) {
    let orderId = e.currentTarget.dataset.orderId
    let index = e.currentTarget.dataset.index
    let { applyList } = this.data
    let item = applyList[index]
    applyList.splice(index, 1)
    App.HttpService.deleteApply({ data: orderId })
      .then(data => {
        this.setData({
          applyList
        })
      })
  },
  //去兑奖申请详情
  gotoApplyDetail(e) {
    let orderId = e.currentTarget.dataset.orderId
    App.WxService.navigateTo(App.Constants.Route.applyDetail, { orderId })
  },
  //去兑奖说明
  gotoExplain(){
    App.WxService.navigateTo(App.Constants.Route.explain, { keyWord:`兑奖说明`})
  }
  
})