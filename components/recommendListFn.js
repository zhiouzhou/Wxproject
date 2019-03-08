/**
 * 为你推荐    
 * */ 
import $yjpToast from './toast/toast.js'
import { ProductUtil } from '../utils/CommonUtils.js'
function onlyRecommendInit(_this){
  _this.recommendCurrentPage = 1;
  _this.recommendPageSize = 20;
  }
  //ListProductRecommend
 function ListProductRecommend(_this){
    wx.showLoading({
      title: '加载中'
    })
   _this.recommendLoading = true;
    let params = {
      currentPage: _this.recommendCurrentPage,
      pageSize: _this.recommendPageSize,
      addressId : '', 
      data: _this.data && _this.data.recommendType||0
    }
    getApp().HttpService.ListProductRecommend(params).then(res =>{
      if (!res.data && _this.recommendCurrentPage > _this.recommendtotalPage){
         $yjpToast.show({ text: '没有更多数据了' })
        _this.recommendLoading = false;
         wx.hideLoading()
         return ;
      }
      //由于购物车中的为你推荐，直接更新购物车
      if (params.data==2){
        for (let product of res.data) {
          product.isAddFromShopCar =true
        }
      }
      if (_this.recommendCurrentPage === 1) {
        _this.recommendtotalPage = Math.ceil(res.totalCount / _this.recommendPageSize)
        _this.setData({ recommendList: transformRecommendList(res.data) })
      } else {
        _this.data.recommendList = _this.data.recommendList.concat(transformRecommendList(res.data))
        _this.setData({ recommendList: _this.data.recommendList })
      }
      _this.recommendCurrentPage += 1
      _this.recommendLoading = false;
      wx.hideLoading()
    }).catch(e => { _this.recommendLoading = false;wx.hideLoading() })
  }
  
  function transformRecommendList(list){
	let newList = ProductUtil.rebuildProducts(list,`productList`);
	newList.length = Math.floor(newList.length/2)*2;
    return newList;
  }
function loadMoreRecommendList(_this){
   if (_this.recommendLoading){
        return;
    }else{
     ListProductRecommend(_this)
    }
  }
 module.exports = {
	 onlyRecommendInit, ListProductRecommend,transformRecommendList,loadMoreRecommendList	 
 }