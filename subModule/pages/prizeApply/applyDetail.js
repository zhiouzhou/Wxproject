// pages/user/prizeApply/applyDetail.js
const App = getApp()
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, OrderOperationJs } from '../../../components/yjp.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log(options)
    let orderId = options.orderId;
    this.setData({
      orderId
    })
    
  },
  onShow(){
    App.HttpService.applyDetail({ data: this.data.orderId })
      .then(data => {
        // console.log(data.data)
        this.setData({
          applyDetail: data.data
        })
      })
  },
  //修改数量
  changeApply(e){
    let item= e.currentTarget.dataset.item;
    let orderId = e.currentTarget.dataset.orderId;
     App.WxService.navigateTo(App.Constants.Route.changeNumber, { item, orderId })
  },
  //取消
  cancelApply(e){
    let orderId = e.currentTarget.dataset.orderId
    let { applyDetail } = this.data
    applyDetail.canCancel = false
    applyDetail.canModify = false
    applyDetail.canDelete = true
    applyDetail.state = '已取消'
    applyDetail.stateValue = 4
    App.HttpService.cancelApply({ data: orderId})
    .then(data=>{
      this.setData({
        applyDetail
      })
      let pages = getCurrentPages()
      let prePage = pages[pages.length - 2]
      prePage.setData({ currentPage: 1, applyList: [] })
      // setTimeout(() => {
      //   wx.navigateBack({
      //     delta: 1
      //   })
      // }, 1000)
    })
      .catch(e => { $yjpToast.show({ text: e }) })
  },
  //删除
  deleteApply(e){
    let orderId = e.currentTarget.dataset.orderId
    let { applyDetail } = this.data
    App.HttpService.deleteApply({ data: orderId })
      .then(data => {
        // this.setData({
        //   applyDetail
        // })
        let pages = getCurrentPages()
        let prePage = pages[pages.length - 2]
        prePage.setData({ currentPage: 1, applyList: [] })
        setTimeout(() => {
          wx.navigateBack({
            delta: 1
          })
        }, 1000)
      })
      .catch(e => { $yjpToast.show({ text: e }) })
  }

  
})