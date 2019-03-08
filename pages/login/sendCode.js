// const App = getApp()
const App = getApp()
const CodeNum = App.Constants.CodeNum
import { $yjpCountDown, $yjpToast, $yjpDialog } from '../../components/yjp'

function onAccountBlur(e) {
  this.setData({ account: e.detail.value })
}
//检查手机号是否已经注册过
function checkIsSigned(e) {
  if (!this.isAccountValid()) return
  App.HttpService.validateMobileNoIsExists({
    data: this.data.account,
    noToken: true,
  }).then(data => {
    if (data.data) {
      if (e.currentTarget.dataset.register == `true`) {
        $yjpToast.show({ text: `账号已注册` })
      } else {
        this[e.currentTarget.dataset.type]()
      }
    } else {
      if (e.currentTarget.dataset.register == `true`) {
        this[e.currentTarget.dataset.type]()
      } else {
        this.showRegisterDialog(e.currentTarget.dataset.fromQuickRegister == `true`)
      }
    }
  }).catch(e => $yjpToast.show({ text: e }))
}
//发送验证码
function vcode() {
  if (!this.isAccountValid()) return
  if (this.c2 && this.c2.interval) return !1
  App.HttpService.sendValidateCode({
    appCode: App.versionConfig.appCode,
    appVersion: App.versionConfig.appVersion,
    deviceId: wx.getStorageSync(`deviceId`),
    deviceType: App.versionConfig.deviceType,
    mobileNo: this.data.account,
    isAuth: true
  })
    .then(data => {
      this.setData({ codeId: data.data.identifyingCodeId })
      $yjpToast.show({ text: '验证码已发送，请注意查收' })
    })
    .catch(e => $yjpToast.show({ text: e }))
  //添加倒计时
  this.c2 = new $yjpCountDown({
    date: +(new Date) + 60000,
    onEnd() { this.setData({ c2: '重新获取验证码' }) },
    render(date) {
      const sec = this.leadingZeros(date.sec, 2) + `秒后重新获取`
      date.sec !== 0 && this.setData({ c2: sec })
    },
  })
}
//发送语音验证码
function sendVoiceCode() {
  App.HttpService.sendVoiceValidateCode({
    appCode: App.versionConfig.appCode,
    appVersion: App.versionConfig.appVersion,
    deviceId: wx.getStorageSync(`deviceId`),
    deviceType: App.versionConfig.deviceType,
    mobileNo: this.data.account,
    isAuth: true
  })
    .then(data => {
      this.setData({ codeId: data.data.identifyingCodeId })
      $yjpToast.show({ text: '请注意接听电话' })
    })
    .catch(e => $yjpToast.show({ text: e }))
}
//验证码输入
function onCodeInput(e) {
  this.setData({ codeValue: e.detail.value })
}
//失去焦点
function blur(e){
  this.setData({
    codeValue:''
  })
}
//去注册对话框
function showRegisterDialog(fromQuickRegister = false) {
  $yjpDialog.open({
    title: '温馨提示', dialogType: `defaultText`,
    dialogData: { text: `您还不是久批会员，是否立即注册?` },
    confirmText: `立即注册`,
    onConfirm: () => {
      App.WxService.navigateTo(App.Constants.Route.registerStepOne,
        {
          account: this.isAccountValid() ? this.data.account : ``,
          fromQuickRegister
        })
    }
  })
}
//是否拨打语音电话对话框
function showVoiceCallDialog() {
  if (!this.isAccountValid()) return
  const voiceNum = wx.getStorageSync(`registerSetting`).voiceMobileNo
  $yjpDialog.open({
    title: '温馨提示', dialogType: `defaultText`,
    dialogData: { text: `易久批将给您拨打电话，通过语音播报验证码，请接听${voiceNum}号码的来电` },
    onConfirm: () => {
      this.sendVoiceCode()
    }
  })
}
function isAccountAndPswValid() {
  return this.data.account.trim().length == 11 && this.data.password.trim().length > 5 && this.data.password.trim().length < 19
}
function isPswRepeatAndPswValid() {
  return this.data.password.trim() == this.data.passwordRepeat.trim() && this.data.password.trim().length > 5 && this.data.password.trim().length < 19
}
function isPswRepeatAndPswSame() {
  return this.data.password.trim() == this.data.passwordRepeat.trim()
}
function isAccountAndCodeValid() {
  return this.data.account.trim().length == 11 && this.data.codeValue.trim().length == 6
}
function isAccountValid() {
  return this.data.account.trim().length == 11
}
//检验验证码是否正确
function codeValidate() {
  if (this.data.codeValue.length != 6) return
  return App.HttpService.codeValidate({
    data: { code: this.data.codeValue, codeId: this.data.codeId, mobileNo: this.data.account }
  }).then(data => {
    if (!data.data) {
      this.setData({ codeValid: false })
      $yjpToast.show({ text: `验证码不正确` })
      return Promise.resolve(false)
    } else {
      this.setData({ codeValid: true })
      return Promise.resolve(true)
    }
  })
    .catch(e => {
      $yjpToast.show({ text: e })
      return Promise.resolve(false)
    })
}

module.exports = {
  isAccountAndPswValid,
  isAccountAndCodeValid,
  isPswRepeatAndPswValid,
  isPswRepeatAndPswSame,
  isAccountValid,
  onAccountBlur,
  checkIsSigned,
  vcode,
  sendVoiceCode,
  onCodeInput,
  codeValidate,
  showRegisterDialog,
  showVoiceCallDialog
}