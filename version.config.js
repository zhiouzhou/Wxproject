
// 2018.1.24 首页homePageNew改为homePage，公众号跳转需要测试
//版本配置
const deviceType = 5 //小程序的设备类型为5
const environmentType = 'Release'
const appVersion = "4.2.0"
const appCode = "ShoppingMallWeChat"
const groupPurchaseAppCode = "ShoppingMallGrouppurchase"
const appReleaseDate = '20180418'
//认证中心：baseUrl，ELK日志收集：ELKurl
let authenticationUrl =
  environmentType === 'Dev' ? 'http://197.255.20.34:9080/himalaya-ApiService-UA2/' :
    environmentType === 'Test' ? 'http://ua2.test.yijiupidev.com/himalaya-ApiService-UA2/' :
      environmentType === 'Release' ? 'http://ua2.release.yijiupidev.com/himalaya-ApiService-UA2/' :
        environmentType === 'Online' ? 'https://ua2.yijiupi.com/himalaya-ApiService-UA2/' :
          environmentType === 'Pre' ? 'http://ua2.pre.yijiupi.com/himalaya-ApiService-UA2/' : '';
let ELKurl =
  environmentType === 'Test' ? 'http://logcollection.test.yijiupidev.com/himalaya-ApiService-LogCollection/' :
    environmentType === 'Release' ? 'http://logcollection.release.yijiupidev.com/himalaya-ApiService-LogCollection/' :
      environmentType === 'Online' ? 'https://logcollection.yijiupi.com/himalaya-ApiService-LogCollection/' :
        environmentType === 'Pre' ? 'http://logcollection.pre.yijiupi.com/himalaya-ApiService-LogCollection/' : '';

module.exports = { 
  deviceType,
  appCode,
  groupPurchaseAppCode,
  appVersion,
  authenticationUrl,
  ELKurl
}