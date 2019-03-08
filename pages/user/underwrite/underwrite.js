var App = getApp();
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, OrderOperationJs } from '../../../components/yjp.js'
Page({
  /**
   * 页面的初始数据
   */
  data: {
    windowHeight: 0,
    pageSize: 20,
    totalCount: '',
    noUseTotalCount: '',
    underwriteStyle: 0, //0全部  1合约中  2申请中
    vm: {},
    isEmpty: false,
    emptyContent: '',
    allCurrentPage: 1,
    contractCurrentPage: 1,
    applyCurrentPage: 1,
    allUnderwriteList: [],
    contractUnderwriteList: [],
    applyUnderwriteList: [],
    productBrandId: [],   //产品品牌id
    searchKey: '',   //查询关键字
    dialogExplain: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getData();
    //let systemInfo = wx.getStorageSync(`systemInfo`);
    const systemInfo = App.globalData.systemInfo;
    this.setData({
      windowHeight: systemInfo.windowHeight - systemInfo.windowWidth / 750 * 104,
    })
  },
  lower: function () {
    this.getData();
  },
  getData(getType) {
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    let param = {
      currentPage: 1,
      data: {
        contractState: 0,
        productBrandId: [],
        searchKey: ''
      },
      pageSize: 20
    }
    if (this.data.underwriteStyle ==0){
      param.currentPage = this.data.allCurrentPage
      param.data.contractState = 0
    } else if (this.data.underwriteStyle == 1){
      param.currentPage = this.data.contractCurrentPage
      param.data.contractState = 1
    }else{
      param.currentPage = this.data.applyCurrentPage
      param.data.contractState = 2
    }
    App.HttpService.myUnderwriteListContract(param)
      .then(data => {
        if (data.success && data.data) {
          if (data.data.length > 0){
            if (this.data.underwriteStyle == 0) {
              let newList = this.data.allUnderwriteList;
              newList = newList.concat(data.data);
              this.underwriteStateValue(newList);
              this.setData({ allUnderwriteList: newList, allCurrentPage: ++this.data.allCurrentPage, totalCount: data.totalCount })
            } else if (this.data.underwriteStyle == 1) {
              let newList = this.data.contractUnderwriteList;
              newList = newList.concat(data.data);
              this.underwriteStateValue(newList);
              this.setData({ contractUnderwriteList: newList, contractCurrentPage: ++this.data.contractCurrentPage, totalCount: data.totalCount })
            } else {
              let newList = this.data.applyUnderwriteList;
              newList = newList.concat(data.data);
              this.underwriteStateValue(newList);
              this.setData({ applyUnderwriteList: newList, applyCurrentPage: ++this.data.applyCurrentPage, totalCount: data.totalCount })
            }
          }
          if (param.currentPage > 1 && data.data.length == 0 && !getType){
            $yjpToast.show({ text: `没有更多数据了` })
          }
          if (param.currentPage == 1 && data.data.length == 0){
            let content = "";
            if (this.data.underwriteStyle == 0){
              content = "您还无包销产品~";
            } else if (this.data.underwriteStyle == 1){
              content = "您还无合约中产品~";
            }else{
              content = "您还无申请中产品~";
            }
            this.setData({
              isEmpty: true,
              emptycontent: content
            });
          }
        }
        this.setData({ requesting: false })
        wx.hideLoading();
      }).catch(e => {
        this.setData({ requesting: false })
        wx.hideLoading();
      })
  },
  switchColumn(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      underwriteStyle: type,
      isEmpty: false,
      allCurrentPage: 1,
      contractCurrentPage: 1,
      applyCurrentPage: 1,
      allUnderwriteList: [],
      contractUnderwriteList: [],
      applyUnderwriteList: []
    });
    this.getData('switch');
  },
  underwriteStateValue(arr) {
    //合同状态（0）申请中 1）待签约 2）待付保证金 3）合约中 4）已解约 5)不通过）
    if (arr.length>0){
      for (let i = 0; i < arr.length; i++) {
        let state = arr[i].contractState
        if (state == 0 || state == 1 || state == 2) {
          arr[i].contractStateText = "申请中";
        } else if (state == 3) {
          arr[i].contractStateText = "合约中";
        } else if (state == 4) {
          arr[i].contractStateText = "已解约";
        } else if (state == 5) {
          arr[i].contractStateText = "已拒绝";
        }
      }
      return arr;
    }else{
      return;
    }
  },
  //查看商品详情
  goToProductDetail(product) {
    let productSkuId = product.currentTarget.dataset.item.productSkuId
    App.WxService.navigateTo(App.Constants.Route.productDetail, { 
      productSkuId: productSkuId,
      isUnderwriting: 'true'
      })
  },
  //查看合同图片
  showContractImg(e){
    wx.previewImage({
      urls: e.currentTarget.dataset.urls || [] // 需要预览的图片http链接列表
    })   
  },
  //了解独家包销
  underwriteDialog(){
    this.setData({ dialogExplain: true})
  },
  //关闭独家包销弹窗
  closeUnderwriteDialog(){
    this.setData({ dialogExplain: false })
  }
})