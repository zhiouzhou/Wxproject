/*
 * author YZS  2018-04-27
 * 适用于大宗   临期
 */
import { $yjpToast, $yjpDialog } from '../../components/yjp.js'
Component({
  relations: {
    '../../myComponents/productDirective/productDirective': {
      type: 'parent' // 关联的目标节点应为父节点
    }
  },
  properties: {
	 buyNum :{
		 type: Number
	 },  
	 minBuyNum :{
		 type: Number
	 },  
	 maxBuyNum :{
		 type: Number
	 }
  },
  data: {   

  },
  methods: {
    decrease : function(e){
    	const currentVal = e.currentTarget.dataset.currentVal;
    	const minBuyNum = this.data.minBuyNum;
    	const maxBuyNum = this.data.maxBuyNum;
       let afterSubNum = (currentVal - 1) < minBuyNum ? 0 :
         (currentVal - 1) > maxBuyNum ? maxBuyNum :
           (currentVal - 1)
       if(minBuyNum > maxBuyNum) {
         $yjpToast.show({ text: `最低购买数量大于可购买数量!` });
         afterSubNum = 0;
       }
       this.setData({ buyNum: afterSubNum });
       const nodes = this.getRelationNodes('../../myComponents/productDirective/productDirective');
       const component = nodes[0];  
       component.setData({ [`productItem.buyNum`]: afterSubNum})
    },
    increase : function(e){
      const currentVal = e.currentTarget.dataset.currentVal;
    	const minBuyNum = this.data.minBuyNum;
    	const maxBuyNum = this.data.maxBuyNum;
      if (minBuyNum > maxBuyNum){
        $yjpToast.show({ text: `最低购买数量大于可购买数量!` })
        return ;
      }
    	let afterAddNum = (currentVal + 1) < minBuyNum ? minBuyNum :
    	        (currentVal + 1) > maxBuyNum ? maxBuyNum :
    	           (currentVal + 1)
    	this.setData({buyNum : afterAddNum});  
        const nodes = this.getRelationNodes('../../myComponents/productDirective/productDirective');
        const component = nodes[0];  
        component.setData({ [`productItem.buyNum`]: afterAddNum})
        
    },
    editNumber : function(e){
       const currentVal =  parseInt(e.detail.value) || 0;
       const minBuyNum = this.data.minBuyNum;//2
       const maxBuyNum = this.data.maxBuyNum;//1 
       let targetNum = currentVal < minBuyNum ? minBuyNum :
         currentVal > maxBuyNum ? maxBuyNum :
          currentVal ; 
       if (minBuyNum > maxBuyNum) {
         $yjpToast.show({ text: `最低购买数量大于可购买数量!` });
         targetNum = 0;
       }
       this.setData({ buyNum: targetNum });
       const nodes = this.getRelationNodes('../../myComponents/productDirective/productDirective');
       const component = nodes[0];
       component.setData({ [`productItem.buyNum`]: targetNum })
    }
  }

})  