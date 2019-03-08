const App = getApp()
import $yjpDialog from '../dialog/dialog.js'
import $yjpToast from '../toast/toast.js'
function ruleDetail(item) {
  $yjpDialog.open({
    halfWindowDialogType: `checkRuleDetail`, title: `产品满赠`,
    dialogData: {
      ruleDetail: item.tagDetail,
    }
  })
}
function fullCutDetail(item) {
  $yjpDialog.open({
    halfWindowDialogType: `fullCutDetail`, title: `满减促销`,
    dialogData: {
      fullCutDetail: item,
    }
  })
}

module.exports = {
  ruleDetail, fullCutDetail
}
