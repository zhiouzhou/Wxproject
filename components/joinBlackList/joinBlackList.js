const App = getApp();
import $yjpDialog from '../dialog/dialog.js'
import $yjpToast from '../toast/toast.js'
function popUp() {
  App.HttpService.getBlackProductList({ currentPage: 1, pageSize: 60, data: this.data.activityId})
  .then(data=>{
    $yjpDialog.open({
      halfWindowDialogType: `popUpBlackList`, title: `以下商品不参与凑单金额累计`,
      dialogData: {
        blackList:data.data
      }
    })
  })
  .catch(e=>{console.log(e)})
}
module.exports = {
  popUp
}