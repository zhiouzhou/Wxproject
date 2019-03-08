// pages/user/orders/orderValuation.js
const App = getApp();
import { $yjpToast, OrderOperationJs } from '../../../components/yjp.js'
import { $yjpDialog } from '../../../components/yjp'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    deliverySpeedScore: 3,   //评分 1-不满意，2-般，3-满意
    anonymous:true,   //是否匿名
    orderNo:'',
    content:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    this.setData({
      orderNo: options.orderNO
    })
  },

  orderValuation(e){
    let orderValue = e.detail.value;
    this.setData({
      content: orderValue
    })
  },
  //满意
  satisfied(){
    this.setData({
      deliverySpeedScore:3,
    })
  },
  //一般
  commonly() {
    this.setData({
      deliverySpeedScore: 2,
    })
  },
  //不满意
  disSatisfied() {
    this.setData({
      deliverySpeedScore: 1,
    })
  },
  changeNameType(){
    this.setData({
      anonymous: !this.data.anonymous
    })
  },
  //提交
  submitMessage(){
    let { deliverySpeedScore, anonymous, orderNo, content } = this.data
    App.HttpService.orderValuation({ deliverySpeedScore, anonymous, content, orderNo })
    .then(data=>{
      $yjpToast.show({text:`评价成功`})
      setTimeout(()=>{
        wx.navigateBack({
          delta:2
        })
      },1500)
    })
  }
})