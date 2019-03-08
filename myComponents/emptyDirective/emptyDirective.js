/*
 */
Component({
  properties: { 
	  imgUrl : {
		  type : String,
      value: '/assets/images/pro_emptylist_icon.png'
	  },
	  text : {
		  type : String,
		  value: '没有找到相关商品'
	  },
	  firstBtnTxt :{
		  type : String,
		  value: ''
	  },
	  secondBtnTxt :{
		  type : String,
		  value: ''
	  } 
  },
  data: {
    
  },
  attached:function(){
     //* 取缓存一些相关的设置
  },
  methods: {
	 dispatchEvent(e){
		 const type = e.currentTarget.dataset.type
		 if(type==1){
			 this.triggerEvent('first-evt')
		 }
		 if(type==2){
			 this.triggerEvent('second-evt')
		 }
	 } 
	  
  }
})   