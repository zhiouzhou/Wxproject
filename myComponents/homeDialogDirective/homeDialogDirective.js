let WxParse = require('../../wxParse/wxParse.js');
const App = getApp()
Component({
    relations: {
      
    },
  properties: { 
    dialogData: {
      type: Object, 
    }
  },
  data: {
  },
  ready: function(){
    WxParse.wxParse('article', 'html', this.data.dialogData.templateContent, this, 0);
  },
  methods: {
    closeActivityDialog(){
      this.triggerEvent('close');
    }
  }
})  