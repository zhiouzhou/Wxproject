// pages/complaints/addComplaint.js
const App = getApp();
import { $yjpToast, OrderOperationJs, $yjpDialog } from '../../../components/yjp.js'

Page({
 
  /**
   * 页面的初始数据
   */
  data: {
    complaintInfo: {},
    isSubmit: false,//是否可提交
    complaintTypes: [],
    isClooseType: false,
    isRed: false
  },
  requesting:false,
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.orderNO) {
      this.setData({
        "complaintInfo.orderNo": options.orderNO
      })
    }
    let that = this;
    this.getComplaintType();
    wx.getStorage({
      key: 'userDetail',
      success: function(res) {
        that.setData({
          "complaintInfo.linkman": res.data.userName,
          "complaintInfo.telephoneNo": res.data.mobileNo
        })
      },
    })
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
  //输入联系人
  inputLinkman(e) {
    this.data.complaintInfo.linkman = e.detail.value;
    this.setData({
      isRed: this.check()
    })
  },
  //输入电话号码
  inputTelephoneNo(e) {
    this.data.complaintInfo.telephoneNo = e.detail.value;
    this.setData({
      isRed: this.check()
    })
  },
  //获取投诉类型
  getComplaintType() {
    App.HttpService.queryComplaintType().then(data => {
      if(data.success) {
        // this.data.complaintTypes = Object.values(data.data);
        this.complaintTypes = data.data;
        this.setData({
          complaintTypes: Object.values(data.data)
        })
      }
    })
  },
  //选择投诉类型
  chooseType() {
    let state = !this.data.isClooseType;
    this.setData({
      isClooseType: state
    })
  },
  //确定投诉类型
  confirmType(e) {
    let type = e.currentTarget.dataset.tag;
    let state = 0;
    for (let key in this.complaintTypes) {
      if (this.complaintTypes[key] == type) {
        state = key;
      }
    }
    this.data.complaintInfo.complaintState = state;
    this.setData({
      "complaintInfo.complaintType": type
    })
    this.chooseType();
    this.setData({
      isRed: this.check()
    })
  },
  //选择投诉订单 
  goSelectOrder() {
    App.WxService.navigateTo(App.Constants.Route.selectOrder, {
      orderNo: this.data.complaintInfo.orderNo || ''
    })
  },
  //输入投诉的内容
  inputComplaintContent(e) {
    this.data.complaintInfo.complaintContent = e.detail.value;
    this.setData({
      isRed: this.check()
    })
  },
  //选择图片
  chooseImg() {
    var that = this;
    wx.chooseImage({
      count: 1,
      success: function (res) {
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
  //改变按钮颜色
  check() {
    if (!this.data.complaintInfo.linkman) {
      this.toastText = "请填写联系人";
      return false;
    } else if (!this.data.complaintInfo.telephoneNo || this.data.complaintInfo.telephoneNo.length!=11) {
      this.toastText ="请填写正确的电话号码";
      return false;
    } else if (!this.data.complaintInfo.complaintType) {
      this.toastText = "请选择投诉类型";
      return false;
    } else if (!this.data.complaintInfo.complaintContent) {
      this.toastText = "请填写投诉内容"
      return false;
    }
    this.toastText = "";
    return true;
  },
  //提交
  submitInfo () {
    if(!this.data.isRed) {
      let toastText = this.toastText;
      $yjpToast.show({
        text: toastText
      })
      return;
    }
    if (this.requesting) {
      return;
    }
    this.requesting = true;
    let url = wx.getStorageSync('businessUrl') + `Complaint/Add`
    let params = Object.assign({}, this.data.complaintInfo);
    params.complaintType = params.complaintState;
    params.orderNo = params.orderNo || '';
    let request;
    if (this.data.imageUrl) {
      request = App.HttpService.uploadFile(url, params, this.data.imageUrl);
    } else {
      request = App.HttpService.addComplaint(params);
    }
    request.then(data => {
      if ((data.data && data.data.success && data.statusCode) || data.success) {
        let pages = getCurrentPages();
        let prePage = pages[pages.length - 2]
        if (prePage.route == 'pages/complaints/addComplaint') {
          prePage.getOrderDetail();
        } else if (prePage.route == 'pages/complaints/complaints') {
          prePage.data.complaintsList = [];
          prePage.params.currentPage = 1;
          prePage.initData();
        }
        $yjpToast.show({
          text: "尊敬的用户您好，您的投诉已收到，我们会马上安排处理！"
        })
        setTimeout(() => {
          this.requesting = false;
          App.WxService.navigateBack();
        },1500)
      }
    }).catch(data=> {
      this.requesting = false;
      $yjpToast.show({
        text: data || data.data.desc
      })
    })
  }
})