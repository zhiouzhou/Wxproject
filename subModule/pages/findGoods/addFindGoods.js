// pages/findGoods/addFindGoods.js
const App = getApp();
import { $yjpToast, OrderOperationJs, $yjpDialog } from '../../../components/yjp.js'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    findGoodsInfo: {},
    isRed: false
  },
  requesting: false,
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  },
  //输入备注
  inputFindGoodsRemarks(e) {
    this.data.findGoodsInfo.findGoodsRemarks = e.detail.value;
    this.setData({
      isRed: this.check()
    })
    
  },
  //输入产品名称
  inputProductName(e) {
    this.data.findGoodsInfo.productName = e.detail.value;
    this.setData({
      isRed: this.check()
    })
  }, 
  check() {
    if(!this.data.findGoodsInfo.productName) {
      this.toastText = "请输入产品名称";
      return false;
    }else if(!this.data.findGoodsInfo.findGoodsRemarks) {
      this.toastText = "请输入备注";
      return false;
    }
    return true;
  },
  //选择图片
  chooseImg() {
    var that = this;
    wx.chooseImage({
      count: 1,
      success: function(res) {
        var tempFilePaths = res.tempFilePaths;
        that.setData({
          imageUrl: tempFilePaths[0]
        })
      },
    })
  },
  //清除图片
  clearImg() {
    this.setData({
      imageUrl: ''
    })
  },
  submitInfo() {
    if(!this.data.isRed) {
      $yjpToast.show({
        text: this.toastText
      })
      return;
    }
    if (this.requesting) {
      return;
    }
    this.requesting = true;
    let url = wx.getStorageSync('businessUrl') + `FindGoods/Add`;
    let request;
    if (this.data.imageUrl) {
      request = App.HttpService.uploadFile(url, this.data.findGoodsInfo, this.data.imageUrl);
    } else {
      request = App.HttpService.addFindGoods(this.data.findGoodsInfo);
    }
    request.then(data => {
      if ((data.statusCode == 200 && data.data && data.data.success) || data.success) {
        let pages = getCurrentPages();
        let prePage = pages[pages.length - 2]
        prePage.data.findGoodsList = [];
        prePage.params.currentPage = 1;
        prePage.initData();
        $yjpToast.show({
          text:"您的申请已提交成功，我们尽快为你找货"
        })
        setTimeout(() => {
          this.requesting = false;
          App.WxService.navigateBack();
        },1500)
      }
    }).catch(data=> {
      this.this.requesting = false;
      $yjpToast.show({
        text: data || data.data.desc
      })
    })
  }
})