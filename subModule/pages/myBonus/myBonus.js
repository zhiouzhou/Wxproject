// pages/user/myBonus/myBonus.js

var App = getApp();
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, OrderOperationJs } from '../../../components/yjp.js'
Page({
  /**
   * 页面的初始数据
   */
  data: {
      windowHeight: 0,
      textColor: 0,
      bonusState : 1, //1可用  0不可用 
      currentPage : 1,
      noUseCurrentPage: 1, 
      pageSize : 20,
      bonusList : [],
      noUseBonusList : [],
      totalCount : '',
      noUseTotalCount : '',
      vm : {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getData();
    const systemInfo = App.globalData.systemInfo;
    this.setData({
      windowHeight: systemInfo.windowHeight * systemInfo.pixelRatio,
    })
  },
  lower: function () {
    this.getData();
  },
  getData() {
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    //bonusState 可用 1
    if (this.data.bonusState){
      App.HttpService.myBonusDetail({ bonusState: this.data.bonusState, currentPage: this.data.currentPage, pageSize: this.data.pageSize })
        .then(data => {
          if (data.success && data.data) {
            const isEmpty = 'vm.isEmpty';
            if (!data.data.length) {
              if (this.data.currentPage == 1) {
                this.setData({ [isEmpty]: true, totalCount: data.totalCount})
              } else {
                $yjpToast.show({ text: `没有更多数据了` })
                this.setData({ [isEmpty]: false })
              }
            } else {
              if (this.data.currentPage === 1) {
                this.setData({ bonusList: data.data, currentPage: ++this.data.currentPage, totalCount: data.totalCount, [isEmpty]: false })
              } else if (this.data.currentPage > 1) {
                let newBonusList = this.data.bonusList.concat(data.data);
                this.setData({ bonusList: newBonusList, currentPage: ++this.data.currentPage, totalCount: data.totalCount, [isEmpty]: false })
              }
            }
          }
          this.setData({ requesting: false })
          wx.hideLoading();
        }).catch(e => {
          this.setData({ requesting: false })
          wx.hideLoading();
        })
    }else{
      App.HttpService.myBonusDetail({ bonusState: this.data.bonusState, currentPage: this.data.noUseCurrentPage, pageSize: this.data.pageSize })
        .then(data => { //noUseCurrentPage  noUseBonusList  noUseTotalCount
          if (data.success && data.data) {
            const isEmpty = 'vm.isEmpty';
            if (!data.data.length) {
              if (this.data.noUseCurrentPage == 1) {
                this.setData({ [isEmpty]: true, noUseTotalCount: data.totalCount })
              } else {
                $yjpToast.show({ text: `没有更多数据了` })
                this.setData({ [isEmpty]: false })
              }
            } else {
              if (this.data.noUseCurrentPage === 1) {
                this.setData({ noUseBonusList: data.data, noUseCurrentPage: ++this.data.noUseCurrentPage, noUseTotalCount: data.totalCount, [isEmpty]: false })
              } else if (this.data.noUseCurrentPage > 1) {
                let newBonusList = this.data.noUseBonusList.concat(data.data);
                this.setData({ noUseBonusList: newBonusList, noUseCurrentPage: ++this.data.noUseCurrentPage, noUseTotalCount: data.totalCount, [isEmpty]: false })
              }
            }
          }
          this.setData({ requesting: false })
          wx.hideLoading();
        }).catch(e => {
          this.setData({ requesting: false })
          wx.hideLoading();
        })
    }

  },
  usable() {
    this.setData({
      textColor: 0,
      bonusState: 1
    });
    this.getData();
  },
  unusable() {
    this.setData({
      textColor: 1,
      bonusState: 0
    });
    this.getData();
  },
  //查看可使用的产品
  checkUsable() {

  },
  //去首页
  backHome() {
    App.WxService.switchTab(App.Constants.Route.homePage)

  }
})