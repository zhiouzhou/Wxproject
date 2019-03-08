/*
 * author YZS  2018-04-27
 * 适用于大宗 临期 
 */
const App = getApp()
Component({
    relations: {
      '../../myComponents/numberPicker/numberPicker': {
        type: 'child'
      }
    },
  properties: { 
    isVisitor : {
      type : Boolean
    },
    bulk:{
      type: Number, //bulk==1为大宗 bulk==2为临期特价
      value : 0
    }, 
    productItem: {
      type: Object, //类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
      observer: '_propertyChange'//执行的函数（可选），也可以写成在methods段中定义的方法名字符串, 如：'_propertyChange'
    }
  },
  data: {
  },
  attached:function(){
      //* 取缓存一些相关的设置
  },
  methods: {
    _propertyChange:function(newVal,oldVal){
      if(typeof newVal != 'object'){
        this.updateProductStorage(this.data.productItem);
      }
    },
   updateProductStorage : function(productItem){
          let _this = this;
          const productStorageKey = this.data.bulk == 1 ? 'bulkProductData' : 'adventProductData';
          wx.getStorage({
          key: productStorageKey,
          success: function (res) {
              let adventProductData = res.data || [];
              //临期产品判断用到nearExpireId
               let index = adventProductData.findIndex(item => item.productSkuId == productItem.productSkuId
                  && item.productSaleSpecId == productItem.productSaleSpecId && item.nearExpireId == productItem.nearExpireId);
              if(index>=0){
                 adventProductData[index].buyNum = productItem.buyNum;
                 if (!adventProductData[index].buyNum) { //如果为0 从缓存中删除该商品 
                    adventProductData.splice(index, 1);
                 }
              }else{
                   adventProductData.push(productItem);
              }
              wx.setStorage({
                key: productStorageKey,
                data: adventProductData,
                success :function(res){
                    _this.triggerEvent('update');
                }
              })
          },
          fail: function (res) {
            //第一次做缓存 
            let adventProductData = [];
            adventProductData.push(productItem);
            wx.setStorage({
              key: productStorageKey,
              data: adventProductData,
              success: function (res) {
                _this.triggerEvent('update');
              }
            })
          }
        })
   },
   goToProductDetail(e) {
     //可带参数判断 
     const bulk = this.data.bulk
     const productSkuId = e.currentTarget.dataset.productSkuId
     const nearExpireId = this.data.productItem.nearExpireId || ''
     App.WxService.navigateTo(App.Constants.Route.adventProductDetail, { productSkuId: productSkuId, nearExpireId: nearExpireId, bulk:bulk})
   }
   
  }
})  