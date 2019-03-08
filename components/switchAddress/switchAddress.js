const App = getApp()
import $yjpDialog from '../dialog/dialog.js'
import $yjpToast from '../toast/toast.js'

function onSwitchAddress() {
  $yjpDialog.open({
    halfWindowDialogType: `selectAddress`, title: `选择地址`,
    dialogData: {
      addressList: this.data.userAddress,
      selectAddressId: App.globalData.addressId
    }
  })
}

function onSelectAddress(e) {
  const address = e.currentTarget.dataset.address
  this.setData({ detailAddressText: this.getDetailAddressText([address], address.addressId) })
  if (this.deliveryModeAddressTip){
    this.deliveryModeAddressTip(address.deliveryMode);
  }
  App.globalData.addressId = address.addressId
  typeof this[`$yjp.dialog.hide`] === `function` && this[`$yjp.dialog.hide`]()
}

function getDetailAddressText(userAddress, addressId) {
  if (!userAddress || !userAddress.length) return ``
  let defaultAddress = userAddress.find(item => item.addressId == addressId) || userAddress[0]
  return (defaultAddress.province || ``) + (defaultAddress.city || ``) + (defaultAddress.county || ``) + (defaultAddress.street || ``) + (defaultAddress.detailAddress || ``)
}

module.exports = {
  onSwitchAddress, onSelectAddress, getDetailAddressText
}