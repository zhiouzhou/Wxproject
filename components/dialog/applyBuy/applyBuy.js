
const App = getApp()
import $yjpToast from '../../toast/toast.js'
import $yjpDialog from '../../dialog/dialog.js'
/**
 * 弹出申请进货对话框
 */
function onApplyBuy(e) {
  let { productList, productDetail } = this.data
  const shopId = e.currentTarget.dataset.shopId
  const productSkuId = e.currentTarget.dataset.productSkuId
  let product
  if (productList) {
    product = productList.find(item => item.productSkuId == productSkuId)
  } else if (productDetail) {
    product = productDetail
  }
  $yjpDialog.open({
    applyBuyDialogType: `applyBuy`,
    dialogData: product,
    shopId: shopId
  })
}
/**
 * 申请进货减号
 */
function onSubApplyNum(e) {
  const originalNum = this.data.$yjp.dialog.dialogData.buyNum || 0
  if (originalNum <= 1) return
  this.setData({ [`$yjp.dialog.dialogData.buyNum`]: originalNum - 1 })
}
/**
 * 申请进货直接输入数字
 */
function onInputApplyNum(e) {
  const originalNum = this.data.$yjp.dialog.dialogData.buyNum || 0
  let afterNum = 0
  if (!parseInt(e.detail.value) || parseInt(e.detail.value) <= 0) {
    afterNum = 1
  } else {
    afterNum = parseInt(e.detail.value)
  }
  this.setData({ [`$yjp.dialog.dialogData.buyNum`]: afterNum })
}
/**
 * 申请进货加号
 */
function onAddApplyNum(e) {
  const originalNum = this.data.$yjp.dialog.dialogData.buyNum || 0
  this.setData({ [`$yjp.dialog.dialogData.buyNum`]: originalNum + 1 })
}
/**
 * 申请进货确认按钮
 */
function confirmApplyBuy(e) {
  let product = this.data.$yjp.dialog.dialogData
  const shopId = e.currentTarget.dataset.shopId || product.companyId
  if (product.buyNum <= 0) {
    return $yjpToast.show({ text: `进货数量不能小于1` })
  }
  App.HttpService.applyBuyProduct({
    data: {
      buyCount: product.buyNum,
      productSkuId: product.productSkuId,
      remark: product.remark,
      shopId: shopId
    }
  }).then(data => {
    $yjpToast.show({ text: `申请成功` })
    typeof this[`$yjp.dialog.hide`] === `function` && this[`$yjp.dialog.hide`]()
  })
    .catch(e => {
      $yjpToast.show({ text: e })
      typeof this[`$yjp.dialog.hide`] === `function` && this[`$yjp.dialog.hide`]()
    })
}
/**
 * 申请进货备注
 */
function onApplyBuyRemark(e) {
  this.setData({ [`$yjp.dialog.dialogData.remark`]: e.detail.value })
}



module.exports = {
  onApplyBuy,
  onSubApplyNum, onInputApplyNum, onAddApplyNum,
  confirmApplyBuy, onApplyBuyRemark
}