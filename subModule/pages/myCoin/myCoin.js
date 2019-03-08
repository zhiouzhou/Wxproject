// pages/user/myCoin/myCoin.js
import { DateUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, OrderOperationJs } from '../../../components/yjp.js'
const App = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentPage: 1,
    pageSize: 20,
    CoinArr: [],
    windowHeight: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    let bundleData = options.bundleData;
    let bundleDataJson = JSON.parse(bundleData);
    let wineScoreAmount = bundleDataJson.wineScoreAmount||0; //总共酒币
    let gainWineScoreAmount = bundleDataJson.gainWineScoreAmount||0; //三个月共收获
    let spendWineScoreAmount = bundleDataJson.spendWineScoreAmount||0; //三个月共花费
    
    const systemInfo = App.globalData.systemInfo;;
    let userDetail = wx.getStorageSync(`userDetail`)
    this.setData({
      wineScoreAmount,
      gainWineScoreAmount,
      spendWineScoreAmount,
      windowHeight: systemInfo.windowHeight * systemInfo.pixelRatio,
      userName: userDetail.companyName
    })
    this.getData()
  },
  lower() {
    this.getData();
  },
  getData() {
    let { currentPage, pageSize, CoinArr } = this.data;
    if (this.data.requesting) return;
    this.setData({ requesting: true })
    return App.HttpService.myCoinDetail({ currentPage, pageSize })
      .then(data => {
        if(data.data||data.data.length){
          for(let item of data.data){
            item.amount = this.processNumber(item.amount)
          }
        }
        if ((!data.data || !data.data.length) && currentPage == 1) {
          this.setData({
            CoinArr: []
          })
        } else if ((!data.data || !data.data.length) && currentPage != 1) {
          $yjpToast.show({ text: `没有更多数据了` })
        } else {
          let oldArr = CoinArr;
          let newArr = data.data;
          let finalArray = oldArr.concat(newArr)
          this.setData({
            CoinArr: finalArray,
            currentPage: ++this.data.currentPage,
          })
        }
        this.setData({ requesting: false })
      })
      .catch(e => { this.setData({ requesting: false }) })
  },
  //处理数字
  processNumber(num){
    if(num>0){
      return `+${num.toFixed(0)}`
    }else{
      return `${num.toFixed(0)}`
    }
  },
})