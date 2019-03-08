// pages/shopCart/selectCoupons.js
const App = getApp()
import { CouponSelectUtil } from '../../../utils/CommonUtils.js'
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'
Page({
  data: {
    selectCouponList: [],//已选优惠券列表
    couponGroups: [],//全部优惠券分组
    productList: [],//产品列表
    couponReduceNotice: { reduceNum: 0, reduceStr: `` },//优惠金额或者提示
    hasCoupon: true
  },
  onLoad: function (options) {
    let selectCouponList = JSON.parse(options.selectCouponList) || []
    let couponGroups = JSON.parse(options.couponGroups) || []
    let productList = JSON.parse(options.productList) || []
    let couponReduceNotice = JSON.parse(options.couponReduceNotice)
    this.initSelectState(selectCouponList, couponGroups)
    this.setData({ selectCouponList, productList, couponReduceNotice })
  },
  initSelectState(selectCouponList, couponGroups) {
    let hasCoupon = false
    for (let group of couponGroups) {
      group.open = true
      for (let coupon of group.coupons) {
        coupon.select = selectCouponList.findIndex(item => item.couponId == coupon.couponId) != -1
      }
      if (group.coupons.length) { hasCoupon = true }
    }
    this.setData({ couponGroups, hasCoupon })
  },
  onSwitchGroup(e) {
    let { couponGroups } = this.data
    const groupName = e.currentTarget.dataset.tag
    for (let group of couponGroups) {
      if (group.groupName == groupName) {
        group.open = !group.open
      }
    }
    this.setData({ couponGroups })
  },
  onSelectCoupon(e) {
    let { couponGroups, selectCouponList, productList } = this.data
    let coupon = e.currentTarget.dataset.coupon
    //取消选中
    if (coupon.select) {
      for (let group of couponGroups) {
        let couponIndex = group.coupons.findIndex(item => item.couponId == coupon.couponId)
        if (couponIndex != -1) {
          group.coupons[couponIndex].select = false
          selectCouponList = CouponSelectUtil.removeCouponFromSelectList(group.coupons[couponIndex], selectCouponList)
          break
        }
      }
    } else {
      //选中
      let selectResult = CouponSelectUtil.canSelectCoupon(productList, couponGroups, coupon, selectCouponList)
      if (selectResult.success) {
        for (let group of couponGroups) {
          let couponIndex = group.coupons.findIndex(item => item.couponId == coupon.couponId)
          if (couponIndex != -1) {
            group.coupons[couponIndex].select = true
            selectCouponList.push(group.coupons[couponIndex])
            break
          }
        }
        if (selectResult.desc) {
          $yjpDialog.open({
            dialogType: `defaultText`, title: `温馨提示`,
            hiddenCancel: true, confirmText: `我知道了`,
            dialogData: { text: selectResult.desc }
          })
        }
      } else {
        $yjpToast.show({ text: selectResult.desc })
      }
    }
    let couponReduceNotice = CouponSelectUtil.getSelectCouponReduce(selectCouponList, productList) //优惠金额
    this.setData({ couponGroups, selectCouponList, couponReduceNotice })

  },
  onConfirmSelect() {
    let { selectCouponList, couponReduceNotice } = this.data
    let pages = getCurrentPages()
    let prePage = pages.find(item => item.route == `pages/shopCart/orderSubmit`)
    App.WxService.navigateBack()
    //赠品券添加赠品
    prePage.onRemoveCouponGift()
    if (selectCouponList && selectCouponList.length && selectCouponList[0].couponTemplate.couponType == 2) {
      prePage.onAddCouponGift(selectCouponList[0])
    }
    prePage.setData({ selectCouponList, couponReduceNotice })
    prePage.reCalcPrice()
  }
})