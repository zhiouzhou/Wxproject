// pages/shopCart/selectBonus.js
const App = getApp()
import { $yjpToast, $yjpDialog } from '../../../components/yjp.js'
Page({
  data: {
    bonusList: [],
    selectBonusList: [],
    maxAmount: 0,
    hasSelectAmount: 0,
  },
  onLoad: function (options) {
    const bonusList = JSON.parse(options.bonusList) || []
    const selectBonusList = JSON.parse(options.selectBonusList) || []
    const maxAmount = parseFloat(options.maxAmount) || 0
    this.setData({ selectBonusList, maxAmount })
    this.initSelectState(selectBonusList, bonusList)
  },
  initSelectState(selectBonusList, bonusList) {
    let { hasSelectAmount, maxAmount } = this.data
    for (let bonus of bonusList) {
      bonus.select = selectBonusList.findIndex(item => item.bonusId == bonus.bonusId) != -1
    }
    for (let bonus of selectBonusList) {
      hasSelectAmount += bonus.amount
    }
    hasSelectAmount = hasSelectAmount > maxAmount ? maxAmount : hasSelectAmount
    this.setData({ bonusList, hasSelectAmount })
  },
  onSelectBonus(e) {
    let { bonusList, maxAmount, hasSelectAmount, selectBonusList } = this.data
    const bonusId = e.currentTarget.dataset.bonusId
    let bonus = bonusList.find(item => item.bonusId == bonusId)
    let bonusIndex = bonusList.findIndex(item => item.bonusId == bonusId)
    if (bonus.select) {
      hasSelectAmount -= bonus.amount
      hasSelectAmount = hasSelectAmount < 0 ? 0 : hasSelectAmount
      let bonusIndexInSelectList = selectBonusList.findIndex(item => item.bonusId == bonusId)
      selectBonusList.splice(bonusIndexInSelectList, 1)
      this.setData({ hasSelectAmount, [`bonusList[${bonusIndex}].select`]: false, selectBonusList })
    } else {
      if (hasSelectAmount < maxAmount) {
        hasSelectAmount += bonus.amount
        let diff = hasSelectAmount - maxAmount
        if (diff > 0) {
          $yjpDialog.open({
            dialogType: `defaultText`, title: `温馨提示`,
            hiddenCancel: true, confirmText: `我知道了`,
            dialogData: { text: `您选择了红包${bonus.amount}元，其中${(bonus.amount - diff).toFixed(2)}元有效` }
          })
        }
        hasSelectAmount = hasSelectAmount > maxAmount ? maxAmount : hasSelectAmount
        selectBonusList.push(bonus)
        this.setData({ hasSelectAmount, [`bonusList[${bonusIndex}].select`]: true, selectBonusList })
      } else {
        $yjpToast.show({ text: `所选金额超出最大可用金额` })
      }
    }
  },
  confirm() {
    let { selectBonusList, hasSelectAmount } = this.data
    let pages = getCurrentPages()
    let prePage = pages[pages.length - 2]
    prePage.setData({ selectBonusList, bonusReduce: hasSelectAmount })
    prePage.reCalcPrice()
    App.WxService.navigateBack()
  }
})