const App = getApp();
import $yjpDialog from '../dialog/dialog.js'
import $yjpToast from '../toast/toast.js'
function promotions(item){
  $yjpDialog.open({
    halfWindowDialogType: `promotions`, title: `促销信息`,
    dialogData: {
      promotionsInfo:item
    }
  })
}
module.exports = {
  promotions
}