var App = getApp();
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, OrderOperationJs } from '../../../components/yjp.js'
Page({
  /**
   * 页面的初始数据
   */
  data: {
    product: {},
    callSource: `aaply`,
    durationType: 0,   //包销时长 0，三个月 1，六个月 2，一年
    durationArr: [],
    markMsg: '',
    userName: '',
    userPhone: '',
    underwriteArea: '',
    UnderwriteNum: 0,
    minBuyNum: 0,
    buyNum: 0,
    maxBuyNum: 99999,
    sourceType: 0     //1 来源于产品详情，2 来源于包销产品列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.onSelectInterface(options)
    this.getDuration()
  },
  onSelectInterface(options) {
    let userDetail = wx.getStorageSync(`userDetail`)
    this.setData({
      product: JSON.parse(options.product),
      userName: userDetail.userName,
      userPhone: userDetail.mobileNo,
      underwriteArea: userDetail.jiupiCity,
      sourceType: options.sourceType,
      minBuyNum: JSON.parse(options.product).minimumYearly,
      buyNum: JSON.parse(options.product).minimumYearly
    })
  },
  //选择包销时长
  onSelectDurationType(e){
    let type = e.currentTarget.dataset.type
    this.setData({
      durationType: type
    })
  },
  inputValue(e){
    switch (e.currentTarget.dataset.type){
      case "area":
        this.data.underwriteArea = e.detail.value;
        break;
      case "name":
        this.data.userName = e.detail.value;
        break;  
      case "phone":
        this.data.userPhone = e.detail.value;
        break; 
      case "mark":
        this.data.markMsg = e.detail.value;
        break; 
      default:    
    }
  },  
  //获取包销时长
  getDuration(){
    App.HttpService.getDictionary({
      data:'ProductUnderwritingDuration'
    })
      .then(data => {
        if (data.success) {
          const arr = [];
          for (let i in data.data) {
            arr.push(data.data[i])
          }          
          if (arr.length > 0){
            this.setData({
              durationArr: arr
            })
          }
        }
        wx.hideLoading();
      }).catch(e => {
        wx.hideLoading();
      })
  },
  //提交申请
  submitUnderwrite(){
    let partter = /^0?1[3|4|5|6|8|7|9][0-9]\d{8}$/;
    let rere = new RegExp(partter);    
    if (!this.data.underwriteArea) {
      $yjpToast.show({ text: `请输入包销地区` })
      return;
    }   
    if (this.data.buyNum <= 0){
      $yjpToast.show({ text: `请输入包销数量` })
      return;
    } 
    if (!this.data.userName) {
      $yjpToast.show({ text: `请输入联系人` })
      return;
    }
    if (this.data.userPhone == undefined || this.data.userPhone == '') {
      $yjpToast.show({ text: `请输入联系电话` })
      return;
    } else if (!rere.test(this.data.userPhone)) {
      $yjpToast.show({ text: `联系电话格式不正确` })
      return;
    }     
    let param = {
      data:{
        contactMobileNo: this.data.userPhone,
        productSkuId: this.data.product.productSkuId,
        remark: this.data.markMsg,
        contactName: this.data.userName,
        city: this.data.underwriteArea,
        count: this.data.buyNum,
        underwritingDuration: Number(this.data.durationType)+1
      }	
    }
    App.HttpService.applyUnderwrite(param)
      .then(data => {
        if (data.success) {
          $yjpToast.show({ text: `申请成功` })
          let pages = getCurrentPages(); // 当前页面  
          let beforePage = pages[pages.length - 2]; // 前一个页面  
          if (this.data.sourceType == 1){
            beforePage.onLoad({
              isUnderwriting: "true",
              productSkuId: this.data.product.productSkuId
            })
          }else{
            beforePage.refreshPage()
          }
          wx.navigateBack();  
        }
        wx.hideLoading();
      }).catch(e => {
        wx.hideLoading();
      })
  },
  /**
   * 产品数量加减
   * */
  reduceNum(){
    let buyNum = Number(this.data.buyNum)
    let minBuyNum = this.data.minBuyNum
    let maxBuyNum = this.data.maxBuyNum
    let afterSubNum = (buyNum - 1) < minBuyNum ? minBuyNum :
      (buyNum - 1) > maxBuyNum ? maxBuyNum : (buyNum - 1)
    this.setData({
      buyNum: afterSubNum
    })
  },
  addNum(){
    let buyNum = Number(this.data.buyNum)
    let minBuyNum = this.data.minBuyNum
    let maxBuyNum = this.data.maxBuyNum    
    let afterAddNum = (buyNum + 1) > maxBuyNum ? maxBuyNum :
      (buyNum + 1) < minBuyNum ? minBuyNum : (buyNum + 1)
    this.setData({
      buyNum: afterAddNum
    })      
  },
  inputNum(e){
    var target = Number(e.detail.value);
    //正则验证正整数
    var re = /^[0-9]*$/;
    if (isNaN(target) || !re.test(target)) {
      // 非法输入，还原
      target = Number(this.data.buyNum)
    }    
    let buyNum = Number(this.data.buyNum)
    let minBuyNum = this.data.minBuyNum
    let maxBuyNum = this.data.maxBuyNum     
    let afterInputNum = target < minBuyNum ? minBuyNum : target > maxBuyNum ? maxBuyNum : target
    this.setData({
      buyNum: afterInputNum
    })   
  },
  //查看商品详情
  goToProductDetail(product) {
    let productSkuId = product.currentTarget.dataset.productSkuId
    App.WxService.navigateTo(App.Constants.Route.productDetail, {
      productSkuId: productSkuId,
      isUnderwriting: 'true'
    })
  }
})