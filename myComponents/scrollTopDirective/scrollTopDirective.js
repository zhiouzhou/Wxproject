/*
 * author YZS  2018-05-17
 */
Component({

  data: {   
    bottom : 140,
    right : 12
  },
  methods: {

    touchM : function(e){
      var touchs = e.touches[0];
      var pageX = touchs.clientX;
      var pageY = touchs.clientY;
      //防止坐标越界,view宽高的一般  
      if (pageX < 30) return;
      if (pageX > this.data.scrollWidth - 30) return;
      if (this.data.scrollHeight - pageY <= 80) return;
      if (pageY <= 30) return; 
      //这里用right和bottom.所以需要将pageX pageY转换  
      var x = this.data.scrollWidth - pageX - 30;
      var y = this.data.scrollHeight - pageY - 30;
      this.setData({
        bottom: y,
        right: x
      }); 
    },
    ballClickEvent : function(e){
        //触发事件
      this.triggerEvent('scrollEvent')
    }
    
  },
  ready : function(){
    const systemInfo = getApp().globalData.systemInfo;
    this.setData({ scrollWidth: systemInfo.windowWidth, scrollHeight: systemInfo.windowHeight })
  }

})  