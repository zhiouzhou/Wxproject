var App = getApp();
import { DateUtil, FunctionUtils, AddToShopCartUtil, ProductUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog, OrderOperationJs, AddToShopCartJs } from '../../../components/yjp.js'
Page({
  /**
   * 页面的初始数据
   */
  data: {
    windowHeight: 0,
    pageSize: 20,
    totalCount: '',
    callSource: `underwriteList`,
    swtichType: 0, //0包销产品   1我的包销
    isEmpty: false,
    emptyContent: '',
    goodsCurrentPage: 1,
    contractCurrentPage: 1,
    collectCurrentPage: 1,
    goodsUnderwriteList: [],
    contractUnderwriteList: [],
    myCollectUnderwriteList: [],
    sort: 0,
    isAscending: false,
    categoryClass: 0, //类目体系
    categoryIds: [],  //类目id
    brandIds: [],   //产品品牌id
    labelId: '',    //标签id
    saleModel: -1,  //产品类型
    saleModels: [],   //销售模式
    searchKey: '',   //查询关键字
    searchModes: [],  //查询模式
    searchSource: 0,  //查询来源
    shopId: '',   //店铺 Id
    list: [],
    brandList: [],
    underwriteMenuText: `全部分类`,
    brandMenuText: `全部品牌`,
    sortMenuText: `综合排序`,
    underwriteMenuShow: false,
    brandMenuShow: false,
    sortMenuShow: false,
    sortList: [{ sortType: 0, sortText: `综合排序` },
    { sortType: 1, sortText: `销量从高到低` },
    { sortType: 2, sortText: `价格从低到高` },
    { sortType: 3, sortText: `价格从高到低` }],
    underwriteMenuList: [],
    dialogExplain: false,
    tipsShow: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    Object.assign(this, AddToShopCartJs)
    const isVisitor = wx.getStorageSync(`isVisitor`)
    //游客模式直接去登陆
    if (isVisitor) {
      App.WxService.reLaunch(App.Constants.Route.login)
      return
    }
    this.onSelectInterface(options)
    this.getData();
    this.getBrand();
    this.getCategory();
  },
  onSelectInterface(options) {
    //categoryType	类目跳转类型	number	类目(1),组合产品(2),包销产品(3), 我的包销(4), 我的关注（5）;
    let swtichType
    if (options.categoryType) {
      if (options.categoryType == 1 || options.categoryType == 3) {
        swtichType = 0
      } else if (options.categoryType == 5) {
        swtichType = 2
      } else {
        swtichType = 1
      }
    } else {
      swtichType = 0
    }
    const systemInfo = App.globalData.systemInfo;
    //let wHeight = systemInfo.windowHeight - systemInfo.windowWidth / 750 * 172
    let wHeight = swtichType == 0 ? systemInfo.windowHeight - systemInfo.windowWidth / 750 * 172 : swtichType == 1 ? systemInfo.windowHeight - systemInfo.windowWidth / 750 * 270 : systemInfo.windowHeight - systemInfo.windowWidth / 750 * 84
    //存储查询参数
    this.setData({
      windowHeight: wHeight,
      addToShopCartNum: AddToShopCartUtil.getAddToShopCartNumFromStorage(`underwrite`),
      addToShopCartPrice: AddToShopCartUtil.getAddToShopCartPriceFromStorage(`underwrite`),
      swtichType: swtichType,
      categoryIds: options.categoryType == 1 ? [options.categoryId] : [],
      underwriteType: options.categoryType == 1 ? options.categoryId : 0,
      underwriteMenuText: options.categoryType == 1 ? options.categoryName : `全部分类`
    })
  },
  refreshPage() {
    this.setData({
      goodsCurrentPage: 1,
      goodsUnderwriteList: []
    });
    this.getData();
    this.getBrand();
    this.getCategory();
  },
  lower: function () {
    this.getData();
  },
  getData() {
    //type  0包销产品  1我的包销
    if (this.data.requesting) return
    this.setData({ requesting: true })
    wx.showLoading({ title: '加载中' })
    let { currentPage, brandIds, isAscending, sort, categoryIds, searchKey } = this.data
    let param = {
      currentPage,
      data: {
        ascending: isAscending,
        brandIds,
        categoryIds,
        searchKey,
        sort
      },
      pageSize: 20
    }
    if (this.data.swtichType == 0) {
      param.currentPage = this.data.goodsCurrentPage
      this.getUnderwriteList(param);
    } else if (this.data.swtichType == 2) {
      param.currentPage = this.data.collectCurrentPage
      this.getUnderwriteFavorite(param);
    } else {
      param.currentPage = this.data.contractCurrentPage
      param.data.contractState = 1
      this.getContractList(param);
    }
  },
  switchColumn(e) {
    const type = e.currentTarget.dataset.type
    const systemInfo = App.globalData.systemInfo;
    let wHeight = type == 0 ? systemInfo.windowHeight - systemInfo.windowWidth / 750 * 172 : type == 1 ? systemInfo.windowHeight - systemInfo.windowWidth / 750 * 270 : systemInfo.windowHeight - systemInfo.windowWidth / 750 * 84
    if (type == 0) {
      this.setData({
        swtichType: type,
        isEmpty: false,
        contractCurrentPage: 1,
        contractUnderwriteList: [],
        collectCurrentPage: 1,
        myCollectUnderwriteList: [],
        windowHeight: wHeight,
      });
    } else if (type == 2) {
      this.setData({
        swtichType: type,
        isEmpty: false,
        contractCurrentPage: 1,
        contractUnderwriteList: [],
        goodsCurrentPage: 1,
        goodsUnderwriteList: [],
        windowHeight: wHeight,
      });
    } else {
      this.setData({
        swtichType: type,
        isEmpty: false,
        goodsCurrentPage: 1,
        goodsUnderwriteList: [],
        collectCurrentPage: 1,
        myCollectUnderwriteList: [],
        windowHeight: wHeight,
      });
    }
    this.getData();
  },
  underwriteStateValue(arr) {
    //合同状态（0）申请中 1）待签约 2）待付保证金 3）合约中 4）已解约 5)不通过）
    if (arr.length > 0) {
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
    } else {
      return;
    }
  },
  getUnderwriteList(param) {
    App.HttpService.getUnderwriteList(param)
      .then(data => {
        if (data.success && data.data) {
          if (data.data.length > 0) {
            let newList = this.data.goodsUnderwriteList;
            newList = newList.concat(data.data);
            newList = ProductUtil.rebuildProducts(newList, `underwrite`)
            this.productNum(newList);
            this.setData({ goodsUnderwriteList: newList, goodsCurrentPage: ++this.data.goodsCurrentPage, totalCount: data.totalCount })
          }
          if (param.currentPage > 1 && data.data.length == 0 && !getType) {
            $yjpToast.show({ text: `没有更多数据了` })
          }
          if (param.currentPage == 1 && data.data.length == 0) {
            let content = "暂无包销产品";
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
  getContractList(param) {
    App.HttpService.myUnderwriteListContract(param)
      .then(data => {
        if (data.success && data.data) {
          if (data.data.length > 0) {
            let newList = this.data.contractUnderwriteList;
            let doingList = [];
            //只展示合约中的包销产品，如果没有合约中的则展示友好提示
            doingList = data.data.filter(item => item.contractState == 3)
            newList = newList.concat(doingList);
            if (newList.length == 0) {
              let content = "您还无包销中的产品";
              this.setData({
                isEmpty: true,
                emptycontent: content
              });
            } else {
              this.productNum(newList);
              newList = ProductUtil.rebuildProducts(newList, `underwrite`)
              this.setData({ contractUnderwriteList: newList, contractCurrentPage: ++this.data.contractCurrentPage, totalCount: data.totalCount })
            }
          }
          if (param.currentPage > 1 && data.data.length == 0) {
            $yjpToast.show({ text: `没有更多数据了` })
          }
          if (param.currentPage == 1 && data.data.length == 0) {
            let content = "您还无包销中的产品";
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
  getUnderwriteFavorite(param) {
    App.HttpService.getUnderwriteFavorite(param)
      .then(data => {
        if (data.success && data.data) {
          if (data.data.length > 0) {
            let newList = this.data.myCollectUnderwriteList;
            let doingList = [];
            doingList = data.data
            newList = newList.concat(doingList);
            if (newList.length == 0) {
              let content = "您还无关注的产品";
              this.setData({
                isEmpty: true,
                emptycontent: content
              });
            } else {
              this.productNum(newList);
              newList = ProductUtil.rebuildProducts(newList, `underwrite`)
              this.setData({ myCollectUnderwriteList: newList, collectCurrentPage: ++this.data.collectCurrentPage, totalCount: data.totalCount })
            }
          }
          if (param.currentPage > 1 && data.data.length == 0) {
            $yjpToast.show({ text: `没有更多数据了` })
          }
          if (param.currentPage == 1 && data.data.length == 0) {
            let content = "您还无关注的产品";
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
  getBrand() {
    let { categoryClass, categoryIds, firstCategoryId, labelId, saleModel,
      saleModels, searchKey, searchModes, searchSource, shopId } = this.data
    App.HttpService.getUnderwriteBrand({
      data: {
        categoryClass, categoryIds, firstCategoryId,
        labelId, saleModel, saleModels, searchKey, searchModes,
        searchSource, shopId
      }
    }).then(data => {
      if (data.success && data.data) {
        if (data.data.length > 0) {
          this.setData({ brandList: this.rebuildBrandList(data.data) })
        } else {
          this.setData({ brandList: this.rebuildBrandList(data.data), brandMenuText: `全部品牌` })
          $yjpToast.show({ text: `暂无相关品牌` })
        }
      }
      this.setData({ requesting: false })
      wx.hideLoading();
    }).catch(e => {
      this.setData({ requesting: false })
      wx.hideLoading();
    })
  },
  //处理搜索品牌数据
  rebuildBrandList(brandList) {
    if (!brandList.length) {
      return []
    }
    else {
      brandList.unshift({ brandId: ``, brandName: `全部品牌`, highLight: false })
      return brandList
    }
  },
  //获取类目
  getCategory() {
    let { labelId, saleModels, searchKey, searchModes, searchSource, shopId } = this.data
    App.HttpService.getUnderwriteCategory({
      data: {
        labelId, saleModels, searchKey, searchModes, searchSource, shopId
      }
    }).then(data => {
      if (data.success && data.data) {
        if (data.data.length > 0) {
          this.setData({ underwriteMenuList: this.rebuildCategoryList(data.data) })
        } else {
          $yjpToast.show({ text: `暂无相关类目` })
        }
      }
      this.setData({ requesting: false })
      wx.hideLoading();
    }).catch(e => {
      this.setData({ requesting: false })
      wx.hideLoading();
    })
  },
  //处理搜索类目数据
  rebuildCategoryList(categoryList) {
    if (!categoryList.length) {
      return []
    }
    else {
      categoryList.unshift({ categoryId: ``, categoryName: `全部分类`, highLight: false })
      return categoryList
    }
  },
  productNum(arr) {
    if (arr.length > 0) {
      arr.map(item => {
        item.buyNum = 0;
        item.minBuyNum = 1;
        item.maxBuyNum = 9999;
        item.sourceId = item.productSkuId;
      })
      return arr;
    } else {
      return;
    }
  },
  //点击筛选菜单按钮
  switchMenu(e) {
    const keyword = typeof e === `string` ? e : e.currentTarget.dataset.menuType
    //关闭菜单
    if (this.data.$yjp && this.data.$yjp.dialog && this.data.$yjp.dialog.visible) {
      typeof this[`$yjp.dialog.hide`] === `function` && this[`$yjp.dialog.hide`]()
      this.setData({ underwriteMenuShow: false, brandMenuShow: false, sortMenuShow: false })
    } else {
      //打开菜单
      let dialogData = {}
      switch (keyword) {
        case `underwriteMenu`:
          dialogData = {
            underwriteType: this.data.underwriteType || 0,
            underwriteMenuList: this.data.underwriteMenuList
          }
          this.setData({ underwriteMenuShow: true })
          break;
        case `brandMenu`:
          //if (!this.data.brandList.length) { $yjpToast.show({ text: `暂无信息` }); return; }
          dialogData = {
            brandId: this.data.brandIds.length ? this.data.brandIds[0] : ``,
            brandList: this.data.brandList
          }
          this.setData({ brandMenuShow: true })
          break;
        case `sortMenu`:
          dialogData = {
            sortType: this.data.sortType || 0,
            sortList: this.data.sortList
          }
          this.setData({ sortMenuShow: true })
          break;
      }
      $yjpDialog.open({
        pullDownDialogType: keyword, marginTop: 168,
        dialogData: dialogData,
        onReset: () => {
          this.setData({ underwriteMenuShow: false, brandMenuShow: false, sortMenuShow: false })
          typeof this[`$yjp.dialog.hide`] === `function` && this[`$yjp.dialog.hide`]()
        }
      })
    }
  },
  //点击菜单品牌
  onClickBrand(e) {
    const originalBrandId = this.data.brandIds.length ? this.data.brandIds[0] : ``
    const brandId = e.currentTarget.dataset.brandId
    const brandName = e.currentTarget.dataset.brandName
    this.setData({
      brandIds: brandId ? [brandId] : [],
      brandMenuText: brandName
    })
    this.switchMenu(`brandMenu`)
    if (originalBrandId != brandId) {
      this.setData({ goodsCurrentPage: 1, contractCurrentPage: 1, collectCurrentPage: 1, goodsUnderwriteList: [], contractUnderwriteList: [], myCollectUnderwriteList: [] })
      this.getData();
    }
  },
  //点击排序筛选
  onClickSort(e) {
    const originalSortType = this.data.sortType
    const sortType = e.currentTarget.dataset.sortType
    const sortText = e.currentTarget.dataset.sortText
    this.setData({ sortType, sortMenuText: sortText })
    this.switchMenu(`sortMenu`)
    if (originalSortType != sortType) {
      switch (sortType) {
        case 0:
          this.setData({ isAscending: false, sort: 0 })
          break;
        case 1:
          this.setData({ isAscending: false, sort: 3 })
          break;
        case 2:
          this.setData({ isAscending: true, sort: 2 })
          break;
        case 3:
          this.setData({ isAscending: false, sort: 2 })
          break;
        default:
          break;
      }
      this.setData({ goodsCurrentPage: 1, contractCurrentPage: 1, collectCurrentPage: 1, goodsUnderwriteList: [], contractUnderwriteList: [], myCollectUnderwriteList: [] })
      this.getData();
    }
  },
  //点击分类筛选
  onClickCatecgory(e) {
    const originalUnderwriteType = this.data.underwriteType
    const underwriteType = e.currentTarget.dataset.underwriteType
    const underwriteText = e.currentTarget.dataset.underwriteText
    this.setData({
      underwriteType,
      categoryIds: underwriteType ? [underwriteType] : [],
      underwriteMenuText: underwriteText
    })
    this.switchMenu(`underwriteMenu`)
    if (originalUnderwriteType != underwriteType) {
      this.setData({ goodsCurrentPage: 1, contractCurrentPage: 1, collectCurrentPage: 1, goodsUnderwriteList: [], contractUnderwriteList: [], myCollectUnderwriteList: [] })
      this.getData();
      this.getBrand();
    }
  },
  //查看商品详情
  goToUnderWriteProductDetail(product) {
    let productSkuId = product.currentTarget.dataset.productSkuId
    //已被包销的产品只能在我的包销页面购买，包销产品页面不能买
    let underwriteNocanBuy = false
    if (product.currentTarget.dataset.product.underwritingState == 2 && !product.currentTarget.dataset.contractstate) {
      underwriteNocanBuy = true
    }
    App.WxService.navigateTo(App.Constants.Route.productDetail, {
      productSkuId: productSkuId,
      isUnderwriting: 'true',
      underwriteNocanBuy: underwriteNocanBuy
    })
  },
  //申请独家包销
  applyUnderwrite(e) {
    let product = e.currentTarget.dataset.product
    if (product.canApply) {
      App.WxService.navigateTo(App.Constants.Route.underwriteApply, {
        product: product,
        sourceType: 2
      })
    }
  },
  //了解独家包销
  underwriteDialog() {
    this.setData({ dialogExplain: true })
  },
  //关闭独家包销弹窗
  closeUnderwriteDialog() {
    this.setData({ dialogExplain: false })
  },
  //关闭独家包销产品提示
  closeUnderwriteTips() {
    this.setData({ tipsShow: false })
  },

  /**
    * 产品数量加减
    * */
  reduceNum(e) {
    const listStr = e.currentTarget.dataset.listName
    const product = e.currentTarget.dataset.item
    const idx = e.currentTarget.dataset.idx
    let buyNum = Number(product.buyNum)
    let minBuyNum = product.minBuyNum
    let maxBuyNum = product.maxBuyNum
    let afterSubNum = (buyNum - 1) < minBuyNum ? 0 :
      (buyNum - 1) > maxBuyNum ? maxBuyNum : (buyNum - 1)
    this.setData({
      [`${listStr}[${idx}].buyNum`]: afterSubNum
    })
  },
  addNum(e) {
    const listStr = e.currentTarget.dataset.listName
    const product = e.currentTarget.dataset.item
    const idx = e.currentTarget.dataset.idx
    let buyNum = Number(product.buyNum)
    let minBuyNum = product.minBuyNum
    let maxBuyNum = product.maxBuyNum
    let afterAddNum = (buyNum + 1) > maxBuyNum ? maxBuyNum :
      (buyNum + 1) < minBuyNum ? minBuyNum : (buyNum + 1)
    this.setData({
      [`${listStr}[${idx}].buyNum`]: afterAddNum
    })
  },
  inputNum(e) {
    const listStr = e.currentTarget.dataset.listName
    const product = e.currentTarget.dataset.item
    const idx = e.currentTarget.dataset.idx
    let target = Number(e.detail.value)
    //正则验证正整数
    let re = /^[0-9]*$/
    if (isNaN(target) || !re.test(target)) {
      // 非法输入，还原
      target = Number(product.buyNum)
    }
    let buyNum = Number(product.buyNum)
    let minBuyNum = product.minBuyNum
    let maxBuyNum = product.maxBuyNum
    let afterInputNum = target < minBuyNum ? minBuyNum : target > maxBuyNum ? maxBuyNum : target
    this.setData({
      [`${listStr}[${idx}].buyNum`]: afterInputNum
    })
  },

  //预售购买
  goToUnderwriteOrderSubmit(e) {
    const product = e.currentTarget.dataset.item
    const type = e.currentTarget.dataset.type
    let list = []
    if (type == `myUnderwrite`) {
      const productArr = wx.getStorageSync(`ProductStorage`).underwrite
      if (productArr.length <= 0) {
        $yjpToast.show({ text: `请输入购买数量` })
        return
      }
      productArr.map(item => {
        item.buyCount = item.count;
        item.sourceType = 16
      })
      list = productArr
    } else {
      product.buyCount = Number(product.buyNum)
      if (product.buyCount <= 0) {
        $yjpToast.show({ text: `请输入购买数量` })
        return
      }
      product.productSaleSpecId = product.productSkuId
      product.saleSpecQuantity = 1
      product.specName = product.productSpecName
      product.imgUrl = product.productImgUrl
      product.sourceType = 16
      product.productPrice = {
        gatherOrderPrice: 0,
        price: product.sellingPrice,
        reducePrice: product.reducePrice || 0,
        sellPrice: product.regularPrice || 0,
        selfPickUpPrice: 0,
        selfPickUpReduceAmount: 0,
      }
      list = [product]
    }
    let decodelist = encodeURIComponent(JSON.stringify(list))
    App.WxService.redirectTo(App.Constants.Route.orderSubmit, { productList: decodelist, needdecodeURI: true, isUnderwrite: true })
  }

})