import InterceptorManager from './InterceptorManager'
import { authenticationUrl, ELKurl, deviceType } from '../../../../../version.config.js'
import { Route } from '../../../../../utils/Constants.js'
/**
 * Promise 封装 wx.request 请求方法
 * 
 * @param {Object} defaults 配置项
 * @param {String} defaults.suffix 方法名后缀字符串，默认值 Request
 * @param {String} defaults.baseURL 基础请求路径
 * @param {Object} defaults.header 请求头
 * @param {Array} defaults.transformRequest 转换请求数据
 * @param {Array} defaults.transformResponse 转换响应数据
 * @param {Function} defaults.validateStatus 基于响应状态返回成功或失败
 * 
 */
class WxRequest {
  constructor(defaults) {
    Object.assign(this, {
      defaults,
    })
    this.__init()
  }

  /**
   * 初始化
   */
  __init() {
    this.__initInterceptor()
    this.__initDefaults()
    this.__initMethods()
  }

  /**
   * 初始化默认拦截器
   */
  __initInterceptor() {
    this.interceptors = new InterceptorManager
    this.interceptors.use({
      request(request) {
        request.requestTimestamp = new Date().getTime()
        return request
      },
      requestError(requestError) {
        return Promise.reject(requestError)
      },
      response(response) {
        response.responseTimestamp = new Date().getTime()
        return response
      },
      responseError(responseError) {
        return Promise.reject(responseError)
      },
    })
  }

  /**
   * 初始化默认参数
   */
  __initDefaults() {
    const defaults = {
      // 方法名后缀字符串，默认值 Request
      suffix: 'Request',
      // 基础请求路径
      baseURL: '',
      // 请求头
      header: {
        'chartset': 'utf-8',
        'content-type': 'application/json',
      },
      // 转换请求数据
      transformRequest: [
        (data, header) => {
          return data
        },
      ],
      // 转换响应数据
      transformResponse: [
        (data, header) => {
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data)
            } catch (e) { /* Ignore */ }
          }
          return data
        },
      ],
      // 基于响应状态返回成功或失败
      validateStatus: status => status >= 200 && status < 300,
    }

    // 合并参数
    this.defaults = Object.assign({}, defaults, this.defaults)
  }

  /**
   * 遍历对象构造方法，方法名以小写字母+后缀名
   */
  __initMethods() {
    // 方法名后缀字符串
    const suffix = this.defaults.suffix

    // 发起请求所支持的方法
    const instanceSource = {
      method: [
        'OPTIONS',
        'GET',
        'HEAD',
        'POST',
        'PUT',
        'DELETE',
        'TRACE',
        'CONNECT',
      ],
    }

    // 遍历对象构造方法
    for (let key in instanceSource) {
      instanceSource[key].forEach((method, index) => {
        this[method.toLowerCase() + suffix] = (url, config) => {
          return this.__defaultRequest(Object.assign({}, config, {
            method,
            url,
          }))
        }
      })
    }

    // request - 基础请求方法
    this.request = (...args) => this.__defaultRequest(...args)

    // Promise.all - 合并处理请求
    this.all = promises => Promise.all(promises)
  }

  /**
   * 以 wx.request 作为底层方法
   * @param {Object|String} config 配置项|接口地址
   * @param {String} config.method 请求方法
   * @param {String} config.url    接口地址
   * @param {Object} config.data 请求参数
   * @param {Object} config.header 设置请求的 header
   * @param {String} config.dataType 请求的数据类型
   */
  __defaultRequest(config) {

    // 判断参数类型，如果第一个参数为字符串则赋值于 url，第二个参数为 config 配置
    if (typeof config === 'string') {
      config = Object.assign({}, {
        url: arguments[1]
      }, arguments[2])
    }

    // 合并参数
    const defaults = Object.assign({
      method: 'GET',
      dataType: 'json',
    }, this.defaults, config)

    const { baseURL, header, validateStatus } = defaults

    //EJP在每次请求或者响应的时候改造参数，修改defaults默认的transformRequest，transformResponse，这两个都是数组，可以进行一系列操作
    defaults.transformRequest = [(data = {}, header) => {
      //配置请求地址
      if (data.baseUrl) {
        defaults.url = data.url = `${data.baseUrl}${defaults.url}`
      } else if (data.isAuth) {
        defaults.url = data.url = `${authenticationUrl}${defaults.url}`
      } else if (data.isELK) {
        defaults.url = data.url = `${ELKurl}${defaults.url}`
      } else {
        let businessUrl = wx.getStorageSync(`businessUrl`)
        defaults.url = data.url = `${businessUrl}${defaults.url}`
      }
      //存储接口名


      //游客必须传的字段
      if (wx.getStorageSync(`isVisitor`)) {
        data.cityId = wx.getStorageSync(`cityId`)
        data.userClassId = wx.getStorageSync(`userClassId`)
        data.userDisplayClass = wx.getStorageSync(`userDisplayClass`)
      }
      //每个接口必须传的公共参数
      data.deviceType = deviceType
      if (data.addressId) {
        data.addressId = data.addressId
      } else if (wx.getStorageSync(`isVisitor`)) {
        data.addressId = ``
      } else {
        data.addressId = getApp().globalData.addressId
      }
      //配置header
      if (data.noToken || wx.getStorageSync(`isVisitor`)) {
        defaults.header.token = ``
      } else {
        defaults.header.token = wx.getStorageSync(`token`) || ``
      }
      return data
    }]

    // 配置请求参数
    const $$config = {
      url: defaults.url,
      data: defaults.data,
      header: defaults.header,
      method: defaults.method,
      dataType: defaults.dataType,
    }

    // 注入拦截器
    const chainInterceptors = (promise, interceptors) => {
      for (let i = 0, ii = interceptors.length; i < ii;) {
        let thenFn = interceptors[i++]
        let rejectFn = interceptors[i++]
        promise = promise.then(thenFn, rejectFn)
      }
      return promise
    }

    // 转换数据
    const transformData = (data, header, status, fns) => {
      fns.forEach(fn => {
        data = fn(data, header, status)
      })
      return data
    }

    // 转换响应数据
    const transformResponse = res => {
      const __res = Object.assign({}, res, {
        data: transformData(res.data, res.header, res.statusCode, defaults.transformResponse),
      })
      //  console.info(`response`, res.data.data)
      //记录服务器返回的时间
      if (res.data.serviceTime) {
        wx.setStorageSync(`serviceTime`, res.data.serviceTime)
      }
      //Token过期,目前先只跳转到登录页面自动登录，TODO:后面处理，重新登录同时重新请求
      if (res.data.message == `100102009`) {
        wx.redirectTo({
          url: Route.login
        })
      }
      return validateStatus(res.statusCode) && res.data.success ? __res.data :
        validateStatus(res.statusCode) && res.data.status == 0 ? __res.data ://此行为了兼容百度地图定位的返回
          validateStatus(res.statusCode) && res.data.openid ? __res.data ://此行为了兼容获取openid的接口
            __res.data.desc ? Promise.reject(__res.data.desc) :
              __res.data.message ? Promise.reject(__res.data.message) :
                __res.errMsg ? Promise.reject(__res.errMsg) : ``
    }

    // 发起HTTPS请求
    const serverRequest = config => {
      let data = transformData($$config.data, $$config.header, undefined, defaults.transformRequest)
      const __config = Object.assign({}, config, { data: data, url: data.url })
      // console.info(`url`, data.url)
      // console.info(`params`, data.data)
      // this.retryUrl = $$config.url
      this.retryParams = $$config.data
      //TODO:此时如果用户的账号未通过审核，不能下单
      return this.__http(__config).then(transformResponse, transformResponse)
    }

    let requestInterceptors = []
    let responseInterceptors = []
    let promise = Promise.resolve($$config)

    // 缓存拦截器
    this.interceptors.forEach(n => {
      if (n.request || n.requestError) {
        requestInterceptors.push(n.request, n.requestError)
      }
      if (n.response || n.responseError) {
        responseInterceptors.unshift(n.response, n.responseError)
      }
    })

    // 注入请求拦截器
    promise = chainInterceptors(promise, requestInterceptors)

    // 发起HTTPS请求
    promise = promise.then(serverRequest)

    // 注入响应拦截器
    promise = chainInterceptors(promise, responseInterceptors)

    return promise
  }

  /**
   * __http - wx.request
   */
  __http(obj) {
    return new Promise((resolve, reject) => {
      obj.success = (res) => resolve(res)
      obj.fail = (res) => reject(res)
      wx.request(obj)
    })
  }
}

export default WxRequest