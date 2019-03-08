/*
author YZS 2018-05-01
*/
const App = getApp()
// import { ProductUtil, DateUtil, FunctionUtils } from '../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog } from '../../components/yjp.js'

Page({
  data: {
    bulk: '',
    isEmpty: false,
    goodsList: {
      editing: false,//编辑 
      list: [],
      allSelected: true,
      noSelect: false,
      totalCount: 0,
      totalPriceAmount: 0,
    },
    delBtnWidth: 120,//删除按钮宽度单位（rpx）
  },
  //获取元素自适应后的实际宽度
  getEleWidth: function (w) {
    var real = 0;
    try {
      var res = wx.getSystemInfoSync().windowWidth;
      var scale = (750 / 2) / (w / 2);  //以宽度750px设计稿做宽度的自适应
      // console.log(scale);
      real = Math.floor(res / scale);
      return real;
    } catch (e) {
      return false;
      // Do something when catch error
    }
  },
  initEleWidth: function () {
    var delBtnWidth = this.getEleWidth(this.data.delBtnWidth);
    this.setData({
      delBtnWidth: delBtnWidth
    });
  },
  onLoad: function (options) {
    const isVisitor = wx.getStorageSync(`isVisitor`)
    //游客模式直接去登陆
    if (isVisitor) {
      App.WxService.reLaunch(App.Constants.Route.login)
      return;
    }
    let LargeCargoProductDesc = '';
    if (options.bulk == 1) {
      LargeCargoProductDesc = App.globalData.settingValue.LargeCargoProductDesc
    }
    this.setData({ bulk: options.bulk, LargeCargoProductDesc });
  },
  onReady: function () {
    if (this.data.bulk == 1) {
     
        wx.setNavigationBarTitle({ title: '充值特价购物车'})
    } else {
     
        wx.setNavigationBarTitle({ title: '临期特价购物车'})
    }
    this.initEleWidth();

    const systemInfo = App.globalData.systemInfo;
    const isVisitorHeight = systemInfo.windowWidth / 750 * 98
    this.setData({ windowHeight: systemInfo.windowHeight - systemInfo.windowWidth / 750 * 170, isVisitorHeight })
  },
  onShow: function () {
    this.queryStorageShopCart();
  },
  hiddenBulkBtn: function () {
    this.setData({ LargeCargoProductDesc: '' });
  },
  touchS: function (e) {
    if (e.touches.length == 1) {
      this.setData({
        startX: e.touches[0].clientX
      });
    }
  },
  touchM: function (e) {
    var index = e.currentTarget.dataset.index;

    if (e.touches.length == 1) {
      var moveX = e.touches[0].clientX;
      var disX = this.data.startX - moveX;
      var delBtnWidth = this.data.delBtnWidth;
      var left = "";
      if (disX == 0 || disX < 0) {//如果移动距离小于等于0，container位置不变
        left = "margin-left:0px";
      } else if (disX > 0) {//移动距离大于0，container left值等于手指移动距离
        left = "margin-left:-" + disX + "px";
        if (disX >= delBtnWidth) {
          left = "left:-" + delBtnWidth + "px";
        }
      }
      // var list = this.data.goodsList.list;
      // if (index != "" && index != null) {
      //   list[parseInt(index)].left = left;
      //   this.setGoodsList(this.getEditing(), this.updateCount(), this.updatePriceAmount(), this.allSelect(), this.noSelect(), list);
      // }
    }
  },

  touchE: function (e) {
    var index = e.currentTarget.dataset.index;
    if (e.changedTouches.length == 1) {
      var endX = e.changedTouches[0].clientX;
      var disX = this.data.startX - endX;
      var delBtnWidth = this.data.delBtnWidth;
      //如果距离小于删除按钮的1/2，不显示删除按钮
      var left = disX > delBtnWidth / 2 ? "margin-left:-" + delBtnWidth + "px" : "";
      var list = this.data.goodsList.list;
      if (index !== "" && index != null) {
        list[parseInt(index)].left = left;
        this.setGoodsList(this.getEditing(), this.updateCount(), this.updatePriceAmount(), this.allSelect(), this.noSelect(), list);
      }
    }
  },
  //点击下单按钮
  placeOrder(e) {
    let userState = App.globalData.userDetail.state
    if (userState == 3) {
      let auditRejectionReason = App.globalData.userDetail.auditRejectionReason || ``
      $yjpDialog.open({
        dialogType: `defaultText`, title: `温馨提示`,
        hiddenCancel: true, confirmText: `我知道了`,
        dialogData: { text: `您的账号未通过审核,审核通过后可下单，审核不通过原因:${auditRejectionReason}` }
      })
      return
    }
    const isSelfPickUp = false
    let { goodsList, bulk } = this.data
    //0表示临期商品，1表示大宗商品
    let cartType = 0
    if (bulk == 1) {
      cartType = 1
    }
    let selectList = goodsList.list.filter(item => item.selected)
    if (!selectList.length) {
      $yjpToast.show({ text: `请选择结算的商品` })
      return
    }
    let productDataList = JSON.stringify(selectList);
    let list = encodeURIComponent(productDataList)
 
    App.WxService.redirectTo(App.Constants.Route.orderSubmit, { productList: list, isSelfPickUp, fromShoppingCar: true, cartType, needdecodeURI: true, canBackShopCart: !goodsList.allSelected })
  },
  delItem: function (e) {
    var _this = this;
    var index = e.currentTarget.dataset.index;
    var list = this.data.goodsList.list;
    $yjpDialog.open({
      dialogType: `defaultText`, title: `温馨提示`,
      hiddenCancel: false, confirmText: `确定`,
      dialogData: { text: `是否确认删除此商品` },
      onConfirm: () => {
        list.splice(index, 1);
        _this.setGoodsList(_this.getEditing(), _this.updateCount(), _this.updatePriceAmount(), _this.allSelect(), _this.noSelect(), list);
      }
    })
  },
  //同步缓存购物车数据  
  queryStorageShopCart: function () {
    let _this = this;
    const productStorageKey = this.data.bulk == 1 ? 'bulkProductData' : 'adventProductData';
    wx.showLoading({ title: '加载中' });
    wx.getStorage({
      key: productStorageKey,
      success: function (res) {
        _this.initCartDate(res.data);
      },
      fail: function (res) {
        _this.setData({ isEmpty: true }, function () {
          wx.hideLoading();
        });
      }
    })
  },
  //处理缓存购物车数据 
  initCartDate: function (productList) {
    let cartTree = [];
    productList = productList.filter(item => {

         return item.buyNum > 0})
    for (let product of productList) {
      product.left = '';
      if (this.canSelect(product)) {
        product.canSelected = true;
        product.selected = true;
      } else {
        product.canSelected = false;
      }
      cartTree.push(product);
    }
    this.data.goodsList.list = cartTree;
    this.setGoodsList(this.getEditing(), this.updateCount(), this.updatePriceAmount(), this.allSelect(), this.noSelect(), cartTree);
  },
  //商品是否可以被选中 
  canSelect: function (item) {
    //已废弃已下架
    if (item.state == 1 || item.state == 0 || item.state == 3 || item.compositeState == 3) {
      return false;
    }
    if (item.canSellStoreCount == 0) {
      return false;
    }
    //超过限购的不让选中
    return true;
  },
  //计算选中总数 
  updateCount: function () {
    let list = this.data.goodsList.list;
    let totalCount = 0;
    for (let product of list) {
      if (product.selected) {
        totalCount += product.buyNum;
      }
    }
    return totalCount;
  },
  //计算选中总价
  updatePriceAmount: function () {
    let list = this.data.goodsList.list;
    let totalPriceAmount = 0;
    let currentProductAmount = 0;//当前商品的小计总额
    for (let product of list) {
      product.price = product.productPrice ? product.productPrice.price : product.price;
      product.reducePrice = product.productPrice ? product.productPrice.reducePrice : product.reducePrice;
      if (product.selected) {
        //没有优惠(自提 立减等)
        //没有凑单直接计算 
        currentProductAmount = product.buyNum * (product.price - product.reducePrice) * product.saleSpecQuantity;
        totalPriceAmount += parseFloat(currentProductAmount.toFixed(2));
      }
    }
    return totalPriceAmount.toFixed(2);
  },
  //是否 全选 
  allSelect: function () {
    let list = this.data.goodsList.list;
    let allSelect = false;
    for (let product of list) {
      if (product.selected) {
        allSelect = true;
      } else {
        allSelect = false;
        break;
      }
    }
    return allSelect;
  },
  //全不选 
  noSelect: function () {
    let list = this.data.goodsList.list;
    let noSelect = 0;
    for (let product of list) {
      if (!product.selected) {
        noSelect++;
      }
    }
    if (noSelect == list.length) {
      return true;
    } else {
      return false;
    }
  },
  //get编辑状态 
  getEditing: function () {
    let editing = this.data.goodsList.editing;
    return editing;
  },
  //更新pageData  //allSelected   cartTree(选中状态 数量变化 在上面函数中可以) 失效商品不用管 
  setGoodsList: function (editing, totalCount, totalPriceAmount, allSelect, noSelect, list) {
    this.setData({
      goodsList: {
        editing: editing,
        totalCount: totalCount,
        totalPriceAmount: totalPriceAmount,
        allSelected: allSelect,
        noSelect: noSelect,
        list: list,
      }
    }, function () {
      wx.hideLoading();
    });
    if (!list.length) {
      this.setData({ isEmpty: true });
    }
    //setData 后直接存缓存
    const productStorageKey = this.data.bulk == 1 ? 'bulkProductData' : 'adventProductData';
    wx.setStorage({
      key: productStorageKey,
      data: list
    })
  },
  //点击全选/全不选
  bindAllSelect: function () {
    let currentAllSelect = this.data.goodsList.allSelected;
    let list = this.data.goodsList.list;
    if (currentAllSelect) {
      for (let item of list) {
        item.selected = false;
      }
    } else {
      for (let item of list) {
        item.selected = true;
      }
    }
    this.setGoodsList(this.getEditing(), this.updateCount(), this.updatePriceAmount(), this.allSelect(), this.noSelect(), list);
  },
  //点击单选 
  selectTap: function (e) {
    let index = e.currentTarget.dataset.index;
    let list = this.data.goodsList.list;
    if (index !== "" && index != null) {
      list[parseInt(index)].selected = !list[parseInt(index)].selected;
      this.setGoodsList(this.getEditing(), this.updateCount(), this.updatePriceAmount(), this.allSelect(), this.noSelect(), list);
    }
  },
  //increment 
  increment: function (e) {
    let index = e.currentTarget.dataset.index;
    let list = this.data.goodsList.list;
    if (index !== "" && index != null) {
      let currentItem = list[parseInt(index)];
      list[parseInt(index)].buyNum = currentItem.buyNum + 1 > currentItem.maxBuyNum ? currentItem.maxBuyNum :
        currentItem.buyNum + 1 < currentItem.minBuyNum ? currentItem.minBuyNum :
          currentItem.buyNum + 1;
      this.setGoodsList(this.getEditing(), this.updateCount(), this.updatePriceAmount(), this.allSelect(), this.noSelect(), list);
    }
  },
  //decrement 
  decrement: function (e) {
    let index = e.currentTarget.dataset.index;
    let list = this.data.goodsList.list;
    if (index !== "" && index != null) {
      let currentItem = list[parseInt(index)];
      list[parseInt(index)].buyNum = currentItem.buyNum - 1 > currentItem.maxBuyNum ? currentItem.maxBuyNum :
        currentItem.buyNum - 1 < currentItem.minBuyNum ? currentItem.minBuyNum :
          currentItem.buyNum - 1;
      this.setGoodsList(this.getEditing(), this.updateCount(), this.updatePriceAmount(), this.allSelect(), this.noSelect(), list);
    }
  },
  //changeInput 
  changeInput: function (e) {
    const currentVal = parseInt(e.detail.value) || 0;
    let index = e.currentTarget.dataset.index;
    let list = this.data.goodsList.list;
    if (index !== "" && index != null) {
      let currentItem = list[parseInt(index)];
      list[parseInt(index)].buyNum = currentVal > currentItem.maxBuyNum ? currentItem.maxBuyNum :
        currentVal < currentItem.minBuyNum ? currentItem.minBuyNum :
          currentVal;
    }
    this.setGoodsList(this.getEditing(), this.updateCount(), this.updatePriceAmount(), this.allSelect(), this.noSelect(), list);
  },
  //编辑
  editTap: function () {
    var list = this.data.goodsList.list;
    for (let item of list) {
      item.selected = false;
    }
    //this.setData({ [`goodsList.editing`]: !this.getEditing()})
    this.setGoodsList(!this.getEditing(), this.updateCount(), this.updatePriceAmount(), this.allSelect(), this.noSelect(), list);
  },
  //完成
  saveTap: function () {
    var list = this.data.goodsList.list;
    for (let item of list) {
      item.selected = true;
        item.left='';
    }
    this.setGoodsList(!this.getEditing(), this.updateCount(), this.updatePriceAmount(), this.allSelect(), this.noSelect(), list);
  },
  //删除 编辑下选中的 
  deleteSelected: function () {
    var _this = this;
    var list = this.data.goodsList.list;

    $yjpDialog.open({
      dialogType: `defaultText`, title: `温馨提示`,
      hiddenCancel: false, confirmText: `确定`,
      dialogData: { text: `确认删除已选中的商品吗？` },
      onConfirm: () => {
        list = list.filter(function (curGoods) {
          return !curGoods.selected;
        });
        _this.setGoodsList(_this.getEditing(), _this.updateCount(), _this.updatePriceAmount(), _this.allSelect(), _this.noSelect(), list);
      }
    })
  }, 
  //跳转
  goToProductDetail(e) {
    //可带参数判断 
    const bulk = this.data.bulk;
    const nearExpireId = e.currentTarget.dataset.nearExpireId || ''
    const productSkuId = e.currentTarget.dataset.productSkuId
    App.WxService.navigateTo(App.Constants.Route.adventProductDetail, { bulk: bulk, nearExpireId: nearExpireId, productSkuId: productSkuId })
  },
  //返回
  goToHomePage() {
    const bulk = this.data.bulk;
    App.WxService.navigateTo(App.Constants.Route.adventProductList, { bulk: bulk });
  }

})