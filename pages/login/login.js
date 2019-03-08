// pages/login/login.js
const App = getApp()
const ROUTE = App.Constants.Route
import { $yjpCountDown, $yjpToast, $yjpDialog } from '../../components/yjp'
import sendCodeJS from 'sendCode.js'
Page({
  data: {
    codeNumFakeArr: [0, 1, 2, 3, 4, 5],
    codeValue: ``,//验证码
    codeId: ``,//验证码的ID 
    loginType: 0,//密码登录：0，验证码登录：1
    account: ``,//账号
    password: ``,//密码
    pswWrongTimes: 0,//密码输错的次数
    customServiceMobileNo: ``,//全国客服电话
  },
  onLoad: function (options) {
    const account = wx.getStorageSync(`account`)
    //上一次反馈弹窗记录的时间
    const deliveryPopupTime = wx.getStorageSync(`deliveryPopupTime`)
    Object.assign(this, sendCodeJS)
    if (options.logout == `true`) {
      //安全退出登录
      //清掉缓存会把App启动的一些信息清除，所以要再调一遍App启动的接口
      //deviceId每次生成随机字符串，清缓存的时候不能清掉，不然会触发多设备验证
      const deviceId = wx.getStorageSync(`deviceId`)
      const password = wx.getStorageSync(`password`)
      const talkingData = wx.getStorageSync(`TalkingData`)
      wx.clearStorageSync()
      App.globalData = {}
      wx.setStorageSync(`deviceId`, deviceId)
      wx.setStorageSync(`account`, account)
      wx.setStorageSync(`password`, password)
      wx.setStorageSync(`deliveryPopupTime`, deliveryPopupTime)
      wx.setStorage({
        key: 'TalkingData',
        data: talkingData, 
        success: function (res) { }
      })
      this.setData({ account, password })
      App.HttpService.onAppLaunch()
        .then(data => {
          this.onAutoLogin()
        }).catch(e => { console.warn(e) })
    } else if (options.openRegisterLogin == `true`) {
      //来自开放注册
      this.setData({ account: account, password: wx.getStorageSync(`password`) })
      this.login()
    } else if (options.shareFail == `true` || options.loginFail == `true`) {
      //分享失败或者自动登录失败
      this.setData({ account: account, password: wx.getStorageSync(`password`) })
    }
    else {
      //解决登录后需要验证码，但是关掉再进去，可以不用输入验证码的bug
      this.setData({ account: account, password: wx.getStorageSync(`password`) })
      let refreshToken = wx.getStorageSync(`refreshToken`)
      let needmultiDeviceUser = wx.getStorageSync(`needmultiDeviceUser`)
      if (refreshToken && needmultiDeviceUser && account == needmultiDeviceUser) {
      }else{
        this.onAutoLogin()
      }
    }
    //记录从文章中点击进入的人数有多少
    if (options.ArticleId) {
      const userMobile = account
      const articleId = options.ArticleId
      const sessionId = App.globalData.talkingdataEventId
      const userId = App.globalData.userDetail && App.globalData.userDetail.userId || ''
      let params = {
        articleId: articleId,
        sessionId: sessionId,
        userId: userId,
        userMobile: userMobile
      }
      App.HttpService.WeChatArticleAdd({ data: params, noToken: true, })
    }
  },
  //正常流程
  onAutoLogin() {
    if (wx.getStorageSync(`registerSetting`)){
      this.setData({
        customServiceMobileNo: wx.getStorageSync(`registerSetting`).customServiceMobileNo,
      })
    }    
    //先调用自动登录，没有refreshToken则走正常流程
    if (wx.getStorageSync(`refreshToken`)) {
      wx.showLoading({ title: '自动登录中' })
      App.HttpService.autoLogin().then(data => data ? this.goToHomePage() : wx.hideLoading())
    }
  },
  onSwitch(e) {
    switch (e.currentTarget.dataset.switch) {
      case `loginType`:
        this.setData({ loginType: parseInt(e.currentTarget.dataset.value) })
        this.resetLoginInfo()
        break;
      case `password`:
        this.setData({ showPsw: !this.data.showPsw })
        break;
      default:
        break;
    }
  },
  //密码输入完成
  onPasswordBlur(e) {
    this.setData({ password: e.detail.value })
  },
  //登录按钮
  login() {
    //先进行手机号密码或者验证码的校验
    switch (this.data.loginType) {
      case 0:
        if (!this.isAccountAndPswValid()) return
        wx.showLoading({ title: '登录中' })
        //手机号密码登录
        return App.HttpService.userLogin({
          appCode: App.globalData.isRegisterAndGroupBuy ? App.versionConfig.groupPurchaseAppCode:App.versionConfig.appCode,
          appVersion: App.versionConfig.appVersion,
          deviceId: wx.getStorageSync(`deviceId`),
          deviceType: App.versionConfig.deviceType,
          mobileNo: this.data.account,
          password: this.data.password,
          isAuth: true
        }).then(data => {
          //多设备验证需要账号发送验证码
          wx.setStorageSync(`account`, this.data.account)
          wx.setStorageSync(`password`, this.data.password)
          this.onStoreLoginInfo(data, true)
        }).catch(e => {
          //TODO 要用状态码匹配
          if (e === `登录失败，账号或密码错误` && this.data.pswWrongTimes >= 1) {
            this.showPswWrongDialog()
          } else if (e === `登录失败，账号或密码错误`) {
            this.setData({ [`pswWrongTimes`]: ++this.data.pswWrongTimes })
            $yjpToast.show({ text: e })
          } else {
            $yjpToast.show({ text: e })
          }
          wx.hideLoading()
        })
        break;
      case 1:
        if (!this.isAccountAndCodeValid()) return
        // if (!this.codeValidate()) return
        return this.codeValidate()
          .then(data => {
            if (data) {
              return Promise.resolve(``)
            } else {
              return Promise.reject(``)
            }
          })
          .then(data => {
            wx.showLoading({ title: '登录中' })
            //手机号验证码登录
            return App.HttpService.userLoginByCode({
              appCode: App.globalData.isRegisterAndGroupBuy ? App.versionConfig.groupPurchaseAppCode : App.versionConfig.appCode,
              appVersion: App.versionConfig.appVersion,
              deviceId: wx.getStorageSync(`deviceId`),
              deviceType: App.versionConfig.deviceType,
              mobileNo: this.data.account,
              code: this.data.codeValue,
              identifyingCodeId: this.data.codeId,
              isAuth: true
            }).then(data => {
              //多设备验证需要账号发送验证码
              wx.setStorageSync(`account`, this.data.account)
              this.onStoreLoginInfo(data)
            }).catch(e => {
              wx.hideLoading()
              $yjpToast.show({ text: e })
            })
          })
        break;
      default:
        break;
    }
  },
  //切换登录模式，重置数据
  resetLoginInfo() {
    this.setData({ account: '', password: ``, codeValue: ``, codeValid: false })
  },
  //微信登录
  onWeiXinLogin(e) {
    /**
     * 2018.4.30以后getUserInfo接口废弃，改用
     * <button open-type="getUserInfo" bindgetuserinfo="userInfoHandler"> Click me </button>
     * 这种形式去获取用户信息
     */
    wx.showLoading({ title: '登录中' })
    let encryptedData = e.detail.encryptedData
    let iv = e.detail.iv
    let weixinCode = ``
    var _this = this
    //查看是否已经授权
    App.WxService.getSetting()
      .then(data => {
        //没有授权则弹框请求授权
        if (!data.authSetting[`scope.userInfo`]) {
          return App.WxService.authorize({ scope: `scope.userInfo` }).catch(e => {
            wx.hideLoading()
            $yjpToast.show({ text: '获取权限失败' })})
        }
      })
      //调用微信login
      .then(data => {
        return App.WxService.login()
          .then(data => weixinCode = data.code)
          .catch(e => {
            wx.hideLoading()
            $yjpToast.show({ text: `登录失败` })
          })
      })
      //OAuth登陆
      .then(data => {
        wx.getUserInfo({
          success: function (aa) {
            encryptedData = aa.encryptedData
            iv = aa.iv
          },
          complete:function(){
           App.HttpService.loginOAuthWeApp({
              appCode: App.globalData.isRegisterAndGroupBuy ? App.versionConfig.groupPurchaseAppCode : App.versionConfig.appCode,
              authCode: weixinCode,
              authType: `WEAPP_SHOPMALL`,
              deviceId: wx.getStorageSync(`deviceId`),
              deviceType: App.versionConfig.deviceType,
              encryptedData: encryptedData,
              iv: iv,
              isAuth: true
           })
             //是去绑定手机还是去首页
           .then(data => {
              _this.onStoreLoginInfo(data, false)
             }).catch(e => {
               wx.hideLoading()
               $yjpToast.show({ text: '登录失败' })
             })
          }
        })
      })
  },
  //存储登录信息（token等等）并决定跳转的页面,needValidate:是否需要进行多设备验证
  onStoreLoginInfo(data, needValidate = false) {
    if (needValidate) {
      //手机号密码登录
      App.HttpService.saveLoginInfo(data)
        .then(data => App.HttpService.needValidate({
          data: { deviceId: wx.getStorageSync(`deviceId`) },
        }))
        .then(data => {
          if (data.data) {
            //需要多设备验证
            wx.hideLoading()
            App.WxService.navigateTo(ROUTE.multiDevice)
            //登录后需要验证码，关掉再进去，可以不用输入验证码的bug
            let currentUser =  wx.getStorageSync("account")
            wx.setStorage({
              key: 'needmultiDeviceUser',
              data: currentUser,
            })
          } else {
            this.goToHomePage()
          }
        }).catch(e => this.goToHomePage())//多设备验证失败的时候直接进首页
    } else if (data.data.alreadyBound !== undefined && !data.data.alreadyBound) {
      //微信登录，需要绑定手机号的情况,登录信息必须在绑定账号以后再保存
      wx.hideLoading()
      App.WxService.navigateTo(ROUTE.bindPhone, { loginInfo: data })
    } else {
      //验证码登录登录或者微信登录但是已经绑定过了
      App.HttpService.saveLoginInfo(data)
      this.goToHomePage()
    }
  },
  //去首页
  goToHomePage() {
    if (App.globalData.isRegisterAndGroupBuy) {
      //来自分享团购新注册
      App.WxService.reLaunch(App.Constants.Route.groupBuyDetail, { isFromRegister: true })
    } else {
      setTimeout(() => {
        App.WxService.switchTab(ROUTE.homePage)
      }, 1000)
    }
  },
  //忘记密码
  forgetPassword() {
    App.WxService.navigateTo(ROUTE.findPassword,
      { account: this.isAccountValid() ? this.data.account : `` })
  },
  //快速注册
  goToRegister() {
    App.WxService.navigateTo(ROUTE.registerStepOne)
  },
  visitor() {
    if (wx.getStorageSync(`haveGuided`)) {
      App.WxService.switchTab(ROUTE.homePage)
    } else {
      App.WxService.navigateTo(ROUTE.guide)
    }
  },
  //展示找回密码对话框
  showPswWrongDialog() {
    $yjpDialog.open({
      title: '温馨提示', dialogType: `passwordWrong`,
      dialogData: { num: this.data.customServiceMobileNo, call: `makePhoneCall` },
      confirmText: `找回密码`,
      onConfirm: () => { this.forgetPassword() },
    })
  },
  //拨打电话
  makePhoneCall(e) {
    wx.makePhoneCall({
      phoneNumber: e.currentTarget.dataset.num,
    })
  },

})
