const App = getApp()
import $yjpToast from '../../toast/toast.js'
import $yjpDialog from '../../dialog/dialog.js'

/**
 * 弹出领券对话框
 */
function onReceiveCoupons(e) {
  const shopName = e.currentTarget.dataset.shopName
  const shopId = e.currentTarget.dataset.shopId
  App.HttpService.listShopCouponReceive({ data: shopId, currentPage: 1, pageSize: 60 })
    .then(data => {
      if (data.data && data.data.length) {
        $yjpDialog.open({
          halfWindowDialogType: `dealerReceiveCoupons`, title: `${shopName}优惠券`,
          dialogData: { coupons: data.data }
        })
      }
    })
}

/**
 * 确认领券
 */
function onConfirmReceiveCoupons(e) {
  const id = e.currentTarget.dataset.id
  const index = e.currentTarget.dataset.index
  App.HttpService.receiveCoupon({ data: id })
    .then(data => {
      $yjpToast.show({ text: `领取成功` })
      this.setData({ [`$yjp.dialog.dialogData.coupons[${index}].alreadyReceived`]: true })
    })
    .catch(e => {
      $yjpToast.show({ text: e })
    })
}
/**
 * 点击已领完的券
 */
function onConfirmAlreadyReceiveCoupons() {
  $yjpToast.show({ text: `优惠券已领完` })
}
module.exports = { onReceiveCoupons, onConfirmReceiveCoupons, onConfirmAlreadyReceiveCoupons }