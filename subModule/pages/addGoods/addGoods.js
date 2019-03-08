
const App = getApp();
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgUrlList:[],
    goodsInfo:{},
    isRed: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const goodsInfo = {}
    goodsInfo.productCode = options.codeData
    this.setData({ goodsInfo: goodsInfo })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.check()
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
  //选择图片
  chooseImg() {
    var that = this;
    wx.chooseImage({
      count: 2,
      success: function (res) {
        var tempFilePaths = res.tempFilePaths;
        var imgUrls = that.data.imgUrlList;
        imgUrls.push(tempFilePaths);
        that.setData({
          imgUrlList: imgUrls,
          isRed: that.check()
        })
      },
    })
  },
  //清除图片
  removeImg(e) {
    let idx = e.currentTarget.dataset.idx
    const imgUrls = this.data.imgUrlList
    imgUrls.splice(idx, 1)
    this.setData({
      imgUrlList: imgUrls,
      isRed: this.check()
    })
  },
  //输入产品名称
  inputProductInfo(e) {
    if (e.currentTarget.dataset.type == 'name'){
      this.data.goodsInfo.productName = e.detail.value;
    }else{
      this.data.goodsInfo.productCode = e.detail.value;
    }
    this.setData({
      isRed: this.check()
    })
  },
  check() {
    if (!this.data.goodsInfo.productName) {
      this.toastText = "请输入产品名称";
      return false;
    } else if (!this.data.goodsInfo.productCode) {
      this.toastText = "请输入产品条形码";
      return false;
    } else if (!this.data.imgUrlList.length) {
      this.toastText = "请上传产品图片";
      return false;
    }
    return true;
  },
  //提交
  submitInfo() {
    if (!this.data.isRed) {
      $yjpToast.show({
        text: this.toastText
      })
      return;
    }
    if (this.requesting) {
      return;
    }
    this.requesting = true;
    let url = wx.getStorageSync('businessUrl') + `File/UploadFile`;
    let request;
    request = App.HttpService.uploadFile(url, { picCategory:'product'}, this.data.imgUrlList[0][0]);
    request.then(data => {
      if ((data.statusCode == 200 && data.data && data.data.success) || data.success) {
        let imgRealUrl
        const imgUrlData = data.data.data
        for (let i in imgUrlData){
          imgRealUrl = imgUrlData[i]
        }
        this.setData({
          imgRealUrl: imgRealUrl
        })
        this.addNoskuProduct()
      }
    }).catch(data => {
      this.requesting = false;
      $yjpToast.show({
        text: data || data.data.desc
      })
    })
  },
  //添加无sku产品
  addNoskuProduct(){
    const params = {
      code: this.data.goodsInfo.productCode,
      productName: this.data.goodsInfo.productName,
      imageUrls: [this.data.imgRealUrl]
    }
    App.HttpService.addOnScanProduct({ data: params })
      .then(data => {
        if (data.success) {
          $yjpToast.show({
            text: "添加成功"
          })
          setTimeout(() => {
            this.requesting = false;
            App.WxService.navigateBack();
          }, 1500)
        }
      })
      .catch(e => {
        this.requesting = false;
        $yjpToast.show({
          text: e
        })
      })
  }

})