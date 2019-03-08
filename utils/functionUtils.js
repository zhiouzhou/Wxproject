let App = getApp()
import  MD5  from '/md5.js'
import StringUtil from '/StringUtil.js'

//talkingData中的数量大于miniMumSubmit才生成文件提交
const miniMumSubmit = 30
//合并几个对象的参数，用于setData一次
function combineArguments() {
  if (!arguments){
    return 
  }
  let argumentsData={}
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i]!=undefined){
      for (let name in arguments[i]) {
        argumentsData[name] = arguments[i][name]
      }
    }
  }
  return argumentsData
}

//获取当前时间
function getcurrentTime() {
  const date = new Date()
  const Y = date.getFullYear() + '-';
  const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
  const D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
  const h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
  const m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
  const s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
  return Y + M + D + h + m + s
}
//保存缓存中的数据
function submitTalkingData(){
  wx.getStorage({
    key: 'TalkingData',
    success: function (res) {
      if (res.data && res.data.length > miniMumSubmit) {
        let canUpfile = checkVersionCanUpfile()
        //1，判断能否上传
        if (canUpfile) {
          //2,生成md5
          let fileData = JSON.stringify(res.data)
          let contentMd5 = MD5.hexMD5(fileData)
          let param = {
            content: fileData,
            contentMd5: contentMd5
          }
          //3,将talking中的数据上传到ucloud中
          dealTalkingData(param)
        }else{
          //如果不能上传，直接删除缓存中的数据
          wx.removeStorage({
            key: 'TalkingData',
            success: function (res) { },
          })
        }
      }
    }
  })
}
//如果当前微信版本不支持上传文件到本地
function checkVersionCanUpfile(){
  return !!wx.getFileSystemManager
}
//上传数据到ucloud中
function dealTalkingData(params) {
  let options = {
    contentMd5: params.contentMd5,
    content: params.content
  }
  //1，将缓存中的数据写到本地文件
  writeFileTolocaction(options, function (AuthData) {
    //2，获取用户签名验证，同时上传到uclod中
    getAuthorization(options, upfileToUcloud)
  })
}
//写文件到本地,获取用户签名
function writeFileTolocaction(options, getAuthorization) {
  let FileSystemManager = wx.getFileSystemManager()
  FileSystemManager.writeFile({
    filePath: `${wx.env.USER_DATA_PATH}/` + options.contentMd5 + '.json',
    data: options.content,
    encoding: 'utf8',
    success: function (data) {
      getAuthorization(options)
    }
  })
}
//获取用户签名,同时回调上传到ucloud
function getAuthorization(options, upfileToUcloud) {
  App.HttpService.FileAuthorization({
    contentMd5: options.contentMd5,
    contentType: 'application/json',
    key: options.contentMd5 + '.json',
    date: '',
    putPolicy: '',
    method: 'POST',
    fileType: 1
  }).then(data => {
    data.data.contentMd5 = options.contentMd5
    upfileToUcloud(data.data);
  })
}
//删除本地缓存及文件
function deleteFile(fileName){
  //1，删除缓存中的数据
  wx.removeStorage({
    key: 'TalkingData',
    success: function (res) { },
  })
  //2，删除本地文件
  let FileSystemManager = wx.getFileSystemManager()
  FileSystemManager.unlink({
    filePath: `${wx.env.USER_DATA_PATH}/` + fileName,
    success: function (res) {
      console.log(res)
    }
  })
}
//上传ucloud成功后调用回调,同时删除本地缓存信息及文件
function callBackToulcoud(url,fileName){
  //TODO :1，调用回调
  let geturl = 'https://apitrackdata.yijiupi.com/uploaded?filename=' + url + '&appcode=ShoppingMallWeChat&apptype=mall&appversion=4.2.0'
  wx.request({
    url: geturl,
    header: { chartset: `utf-8` },
    method: `GET`,
    success(res) {
    }
  })
  //删除本地缓存及文件
   deleteFile(fileName)
}
//上传文件到ucloud
function upfileToUcloud(options) {
  let fileName = options.folderName + '/' + options.fileName
  let authorization = options.authorization
  let url = 'https://yjp-trackdata.cn-bj.ufileos.com/' + fileName
  // let url =  'https://trackfile.yijiupi.com/' + fileName

  wx.uploadFile({
    url: url, //uloud存储该文件的地址
    filePath: `${wx.env.USER_DATA_PATH}/` + options.fileName,  //当前文件的路径
    name: 'flie',
    method: 'POST',
    formData: {
      'Authorization': authorization, //签名
      'FileName': fileName,//要存储的文件名
    },
    encoding: 'utf8',
    header: {
      'Content-Type': 'application/json',    
      'Content-MD5': options.contentMd5,  //文件md5内容
    },
    success: function (res) {
      if (res.statusCode==200){
        callBackToulcoud(url, options.fileName)
      }
    }
  }) 
}
//买点数据添加
function bindNomalTalkingDataEvent (params) {
  params.eventTime = getcurrentTime()
  if (App.globalData&&App.globalData.userDetail){
    params.userId = App.globalData.userDetail.userId
    params.cityId = App.globalData.userDetail.cityId
  }
  if (App.globalData&&App.globalData.talkingdataEventId){
    params.sessionId = App.globalData.talkingdataEventId
  }else{
    params.sessionId = StringUtil.UUID()
    App.globalData.talkingdataEventId = params.sessionId
  }
  if (App.globalData && App.globalData.systemInfo){
    params.systemversion = App.globalData.systemInfo.model +"-"+ App.globalData.systemInfo.system
  }
  params.devicetype = 'ShoppingMallWeChat'
  params.appversion = '4.2.0'
  if(!params.additionalData){
    params.additionalData=''
  }
  if (!params.subType){
    params.subType =0
  }
  if (!params.actionId){
    params.actionId=''
  }
  if (!params.actionFromType){
    params.actionFromType=''
  }
  if (!params.actionFromId) {
    params.actionFromId = ''
  }
  wx.getStorage({
    key: 'TalkingData',
    success: function (res) {
      res.data = res.data ||[]
      res.data.push(params)
      wx.setStorage({
        key: 'TalkingData',
        data: res.data,
        success: function (res) {}
      })
    }, fail: function (res) {
      wx.setStorage({
        key: 'TalkingData',
        data: [params],
        success: function (res) { }
      })
    }})
}
//talkingData 基础数据
function bindBaseTalkingDataEvent(label, params) {
  if (App.globalData.userDetail){
    params.talkingdataEventId = App.globalData.talkingdataEventId;
    App.tdsdk.event({
      id: label,
      label: label,
      params: {
        talkingdataEventId: App.globalData.talkingdataEventId,
        cityID: App.globalData.userDetail.cityId,
        userId: App.globalData.userDetail.userId,
        mobileNo: App.globalData.userDetail.mobileNo,
        systemVersion: App.versionConfig.appVersion
      }
    });
  }
}

module.exports = {
  combineArguments, bindNomalTalkingDataEvent, submitTalkingData, bindBaseTalkingDataEvent
}