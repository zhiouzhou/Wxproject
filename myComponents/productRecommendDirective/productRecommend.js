/*
 * 为你推荐 --产品指令 
 */
const App = getApp()
import { $yjpToast, $yjpDialog, AddToShopCartJs } from '../../components/yjp.js'
import { FunctionUtils } from '../../utils/CommonUtils.js'

Component({
  properties: { 
    isVisitor : {
      type : Boolean,
      value : false
    }, 
    product: {
      type: Object, //类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
    //  observer: '_propertyChange'//执行的函数（可选），也可以写成在methods段中定义的方法名字符串, 如：'_propertyChange'
    }
  },
  data: {
    
  },
  attached:function(){
      //* 取缓存一些相关的设置
  },
  methods: {
    onAddProductBuyNum(e){
      let product = e.currentTarget.dataset.product;
      AddToShopCartJs.recommendGoodAddToCart(e)
      //TODO;如果父页面是购物车，直接调用购物车中的onshow方法
      if (product.isAddFromShopCar){
        var pages = getCurrentPages();
        if (pages.length > 0) {
          //上一个页面实例对象 
          var prePage = pages[0];
          //关键在这里,这里面是触发上个界面的方法 
          prePage.onShow()
        }
      }      
      FunctionUtils.bindNomalTalkingDataEvent({ eventName: '加入购物车', eventType: 701, actionId: product.productSkuId, subType:6 })
    },
    goToProductDetail(e) {
     //可带参数判断 
     const productSkuId = e.currentTarget.dataset.productSkuId
     App.WxService.navigateTo(App.Constants.Route.productDetail, { productSkuId: productSkuId})
     FunctionUtils.bindNomalTalkingDataEvent({ eventName: '为你推荐商品点击', eventType: 801, actionId: productSkuId })
   }
  }
})  