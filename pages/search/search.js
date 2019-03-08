// pages/search/search.js
const App = getApp()
const vuefy = require('../../utils/vuefy.js')
import { FunctionUtils } from '../../utils/CommonUtils.js'

Page({
  data: {
    keyWords: ``,
    hotKeyWords: [],
    searchHistory: [],
    dealerHistory: [],
    tab: `product`,
    productSearchLabel: ``,
    fuzzySearchList : []
  },
  onLoad: function (options) {
    this.inputDebounce = vuefy.debounce(this.setFuzzyData,200)
    App.HttpService.getHotKeyWords()
      .then(data => this.setData({ hotKeyWords: data.data }))
    const systemInfo = App.globalData.systemInfo
    let searchHistory = wx.getStorageSync(`searchHistory`) || []
    let dealerHistory = wx.getStorageSync(`dealerHistory`) || []
    let productSearchLabel = wx.getStorageSync(`appSetting`).productSearchLabel || ``
    this.setData({ searchHistory, dealerHistory, productSearchLabel, fuzzyHeight: systemInfo.windowHeight})
  },
  onSwitchTab(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({ tab: tag })
  },
  goToHistorySearch(e) {
    const keyWords = e.currentTarget.dataset.keyWords
    const tab = this.data.tab
    if (tab == `product`) {
      App.WxService.navigateTo(App.Constants.Route.productList, { searchKey: keyWords })
    } else if (tab == `dealer`) {
      App.WxService.navigateTo(App.Constants.Route.dealerList, { searchKey: keyWords })
    }
  },
  onInputKeyWords(e){
    this.keyWords = e.detail.value;
    this.inputDebounce();
  },
  /*模糊搜索debounce*/
  setFuzzyData(){
    var key = this.keyWords;
    var params = {
      data : key
    }
    App.HttpService.ListSearchKeyRecommend(params).then((res) => { 
      if(key && res.data && res.data.length){
        this.setData({ fuzzySearchList: res.data.slice(0, 11), keyWords: key })
      }else{
        this.setData({ keyWords: key })
      } 
    }).catch(e => this.setData({ fuzzySearchList: [], keyWords: key }))
  },
  clickFuzzyItem(e){
    App.WxService.navigateTo(App.Constants.Route.productList, { searchKey: e.currentTarget.dataset.word })
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '搜索内容', eventType: 202, actionId: e.currentTarget.dataset.word })
  },
  onSearch() {
    let { tab, keyWords, searchHistory, dealerHistory } = this.data
    if (tab == `product`) {
      if (keyWords.trim() && searchHistory.findIndex(item => item == keyWords) == -1) { searchHistory.unshift(keyWords) }
      searchHistory = searchHistory.slice(0, 5)
      wx.setStorage({
        key: 'searchHistory',
        data: searchHistory,
      })
      App.WxService.navigateTo(App.Constants.Route.productList, { searchKey: keyWords })
    } else if (tab == `dealer`) {
      if (keyWords.trim() && dealerHistory.findIndex(item => item == keyWords) == -1) { dealerHistory.unshift(keyWords) }
      dealerHistory = dealerHistory.slice(0, 5)
      wx.setStorage({
        key: 'dealerHistory',
        data: dealerHistory,
      })
      App.WxService.navigateTo(App.Constants.Route.dealerList, { searchKey: keyWords })
    }
    FunctionUtils.bindNomalTalkingDataEvent({ eventName: '搜索内容', eventType: 202, actionId: keyWords })
  },
  deleteSearchHistory() {
    let { tab } = this.data
    if (tab == `product`) {
      this.setData({ searchHistory: [] })
      wx.removeStorage({ key: 'searchHistory' })
    } else if (tab == `dealer`) {
      this.setData({ dealerHistory: [] })
      wx.removeStorage({ key: 'dealerHistory' })
    }
  }
 
})