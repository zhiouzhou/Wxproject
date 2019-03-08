// pages/user/myOddBalance/oddbalanceDetailArr.js
const App = getApp();
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, OrderOperationJs } from '../../../components/yjp.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentPage: 1,
    pageSize: 20,
    balanceDetailArr: [],
    windowHeight: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
     const systemInfo = App.globalData.systemInfo;
    this.setData({ windowHeight: systemInfo.windowHeight * systemInfo.pixelRatio, })
    this.getData();
  },
  lower() {
    this.getData();
  },
  getData() {
    let { currentPage, pageSize, balanceDetailArr } = this.data;
    if (this.data.requesting) return
    this.setData({ requesting: true })
    if(this.data.initing) return
    this.setData({initing:true})
    wx.showLoading({ title: '加载中' })
    return App.HttpService.myOddBalance({ currentPage, pageSize })
      .then(data => {
        // console.log(data.data)
        //判断数字符号
        if (data.data && data.data.length) {
          for (let item of data.data) {
            item.modifyAmount = this.processNumber(item.modifyAmount)
          }
        }
        if ((!data.data || !data.data.length) && currentPage == 1) {
          this.setData({
            balanceDetailArr: [],
          })
        } else if ((!data.data || !data.data.length) && currentPage != 1) {
          $yjpToast.show({ text: `没有更多数据了` })
        } else {
          let oldArr = balanceDetailArr;
          let newArr = data.data;
          let finalArray = oldArr.concat(newArr);
          console.log(finalArray)
          this.setData({
            balanceDetailArr: finalArray,
            currentPage: ++this.data.currentPage,
          })
        }
        this.setData({ requesting: false,initing:false })
        wx.hideLoading()
      })
      .catch(e => { this.setData({ requesting: false ,initing:false}) })
  },
  //处理数字
  processNumber(num) {
    if (num > 0) {
      return `+${num.toFixed(2)}`
    } else {
      return `${num.toFixed(2)}`
    }
  },
  skip(e){
    const orderNO = e.currentTarget.dataset.orderNO;
    if (orderNO == "") {return}else{
      App.WxService.navigateTo(App.Constants.Route.orderDetail, { orderNO })
    }
  }
})