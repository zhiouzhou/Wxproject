
const App = getApp()
import { $yjpToast, $yjpDialog, AddToShopCartJs, JoinBlackList } from '../../components/yjp.js'
import { onlyRecommendInit, ListProductRecommend, loadMoreRecommendList } from '../../components/recommendListFn.js'

Page({
  data: {
    activityDetail: {},
    scrollPosition: 'top',
    currentPage: 1,
    pageSize: 20,
    activityList: [],
  },

  onLoad(options) {
    const systemInfo = App.globalData.systemInfo
    this.setData({
      activityType: options.activityType,
      windowHeight: systemInfo.windowHeight * systemInfo.pixelRatio,
    })
    this.getActivityList(options.activityType)
  },
  onReady() {
    let title = ``
    switch (this.data.activityType) {
      case "3":
        title = `打折促销`
        break;
      case "4":
        title = `限时惠`
        break;
      case "6":
        title = `凑单活动`
        break;
      case "8":
        title = `特惠活动`
        break;
      default:
        break;
    }
    wx.setNavigationBarTitle({ title })
  },
  //获取活动列表
  getActivityList(type) {
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({
      title: '加载中',
    })
    const param = {
      activityType: type || this.data.activityType,
      currentPage: this.data.currentPage,
      pageSize: this.data.pageSize
    }
    return App.HttpService.getActivityLists(param)
      .then(data => this.processData(data))
      .catch(e => { this.setData({ requesting: false, initing: false }); wx.hideLoading() })
  },
  //处理列表数据
  processData(data) {
    if (data.data.length != 0) {
      this.setData({ currentPage: ++this.data.currentPage, activityList: this.data.activityList.concat(data.data) })
    } else if (data.data.length == 0 && this.data.currentPage == 1) {
      this.setData({ activityList: [] })
    } else {
      $yjpToast.show({ text: `没有更多数据了` })
    }
    this.setData({ requesting: false, initing:  false })
    wx.hideLoading()
  },
  //上拉加载
  loadMore() {
    this.getActivityList()
  },
  //返回顶部
  backToTop() {
    this.setData({ scrollPosition: 'top' })
  },
  //跳转到活动详情页
  goToActivityDetail(e){
    let item = e.currentTarget.dataset.item
    App.WxService.navigateTo(App.Constants.Route.atyDetail, { promotionType: item.promotionType, activityId: item.activityId })
  }
})