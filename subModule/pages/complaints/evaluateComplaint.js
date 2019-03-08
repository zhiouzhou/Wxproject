// pages/complaints/evaluateComplaint.js
const App = getApp();
import { $yjpToast, OrderOperationJs, $yjpDialog } from '../../../components/yjp.js'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    serviceEvaluateArr:[
      {
        id: 0,
        pic: "/assets/images/ic_manyi@2x.png",
        activePic:"/assets/images/ic_manyi_hong@2x.png",
        text: "满意"
      },
      {
        id: 1,
        pic: "/assets/images/ic_yiban@2x.png",
        activePic:"/assets/images/ic_yiban_hong@2x.png",
        text: "一般"
      },
      {
        id: 2,
        pic: "/assets/images/ic_bumanyi@2x.png",
        activePic: "/assets/images/ic_bumanyi_hong@2x.png",
        text: "不满意"
      }
    ],
    evaluateInfo: {
      serviceEvaluate: 0
    },
    reasons: []
  },
  complaintId: '',
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.evaluateInfo.complaintId = options.complaintId;
    this.getReasons();
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
  inputRemark(e) {
    this.data.evaluateInfo.remark = e.detail.value;
  },
  //获取不满意理由
  getReasons() {
    App.HttpService.getReasons().then(data => {
      if(data.success) {
        
        for(let key in data.data) {
          let obj = {};
          obj.index = key;
          obj.dissatisfactionReason = data.data[key];
          this.data.reasons.push(obj);
        }
        this.setData({
          reasons: this.data.reasons
        })
      }
    })
  },
  //选择评价
  selectEvaluate(e) {
    let evaluate = e.currentTarget.dataset.tag;
    this.setData({
      "evaluateInfo.serviceEvaluate": evaluate
    })
  },
  //选择不满意理由
  selectReason(e) {
    let dissatisfactionReason = e.currentTarget.dataset.tag;
    this.data.reasons.forEach(item => {
      if (item.dissatisfactionReason == dissatisfactionReason) {
        item.selected = !item.selected;
      }
    })
    this.setData({
      reasons: this.data.reasons
    })
  },
  //提交评价
  sumitEvaluate() {
    let complaintId = this.data.evaluateInfo.complaintId;
    if (!this.data.evaluateInfo.serviceEvaluate && this.data.evaluateInfo.serviceEvaluate!=0) {
      $yjpToast.show({
        text:"请选择您的评价结果"
      })
      return;
    } else{
      if (this.data.evaluateInfo.serviceEvaluate == 2) {
        let dissatisfactionReason = [];
        this.data.reasons.forEach(item => {
          if (item.selected) {
            dissatisfactionReason.push(item.dissatisfactionReason)
          }
        })
        if (!dissatisfactionReason || dissatisfactionReason.length == 0) {
          $yjpToast.show({
            text: "请选择不满意的理由"
          })
          return;
        } else {
          this.data.evaluateInfo.dissatisfactionReason = dissatisfactionReason;
        }
      }
      App.HttpService.evaluateComplaint(this.data.evaluateInfo).then(data=> {
        if(data.success) {
          let text;
          switch (this.data.evaluateInfo.serviceEvaluate) {
            case 0:
              text = '感谢您的评价！我们会继续努力提供更好的服务！';
              break;
            case 1:
              text = '感谢您的评价！我们会继续努力提供更好的服务！';
              break;
            case 2:
              text = '感谢您对易久批的支持，我们将尽快处理 ，给您一个满意的答复！';
              break;
          }
          $yjpDialog.open({
            dialogType: `defaultText`, title: `温馨提示`,
            dialogData: { text: text },
            hiddenCancel: true, confirmText: `好的`,
            onConfirm(){
              let pages = getCurrentPages();
              let prePage = pages[pages.length - 2];
              prePage.queryComplaint(complaintId);
              App.WxService.navigateBack();
            }
          })
        }
      })
    }
  }
})