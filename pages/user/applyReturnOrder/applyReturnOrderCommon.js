
import { $yjpToast } from '../../../components/yjp.js'

//单选 
function selectTap(e) { 
  let index = e.currentTarget.dataset.index
  let List = this.data.productList;
  if (!List[index].canSelected) {
     $yjpToast.show({text:'该商品不支持退货'})
     return ;
  }
  if (List[index].canSelected) {
    List[index].selected = !List[index].selected
  }
  this.setGoodList(List, this.allSelected(), this.ReadySelectedCount());
}
//点击全选 / 全不选
function allSelect() {  
  let List = this.data.productList;
  let currentAllSelect = this.data.allSelected
  if (currentAllSelect) {
    for (let item of List) {
      item.selected = false
    }
  } else {
    for (let item of List) {
      item.selected = false
      if (item.canSelected) {
        item.selected = true
      }
    }
  }
  this.setGoodList(List, this.allSelected(), this.ReadySelectedCount());
}
//是否全选
function allSelected() {
  let List = this.data.productList.filter(item => { return item.canSelected });
  let allSelected = true;
  for (let item of List) {
    if (item.selected) {
      allSelected = true
    } else {
      allSelected = false;
      break;
    }
  }
  return allSelected;
}

//已选数量
function ReadySelectedCount() {  
  let List = this.data.productList;
  let count = 0;
  for (let item of List) {
    if (item.selected) {
      count += item.showCount
    }
  }
  return count;
}
//统一setDAta 
function setGoodList(list, allSelected, selectedCount) {

  this.setData({
    productList: list,
    allSelected: allSelected,
    selectedCount: selectedCount
  })

}
//点击商品的减号
function onSubShopCartBuyNum(e) {

  let List = this.data.productList;
  let index = e.currentTarget.dataset.index;
  // List[index].returnCount 
  if (!List[index].selected){
    return ;
  }
  if (List[index].returnCount - 1<0){
    $yjpToast.show({text:`已达到最小可申请数量`})
  }
  let afterSubNum = (List[index].returnCount - 1) < 0 ? 0 : (List[index].returnCount - 1)
  List[index].returnCount = afterSubNum;
  List[index].showCount = afterSubNum * List[index].product.XS;
  this.setGoodList(List, this.allSelected(), this.ReadySelectedCount());
}
//点击商品的加号 
function onAddShopCartBuyNum(e) { 

  let List = this.data.productList;
  let index = e.currentTarget.dataset.index;
  // List[index].returnCount
  if (!List[index].selected) {
    return;
  } 
  if ((List[index].returnCount + 1) > List[index].canReturnNum) {
    $yjpToast.show({ text: `已达到最大可申请数量` })
  }
  let afterAddNum = (List[index].returnCount + 1) > List[index].canReturnNum ? List[index].returnCount :
    (List[index].returnCount + 1)
  List[index].returnCount = afterAddNum;
  List[index].showCount = afterAddNum * List[index].product.XS;
  this.setGoodList(List, this.allSelected(), this.ReadySelectedCount());
}

//直接输入商品数量
function onInputShopCartBuyNum(e) {

  let List = this.data.productList;
  let index = e.currentTarget.dataset.index;
  if (!List[index].selected) {
    return;
  }
  let item = List[index]
  let inputNum = parseInt(e.detail.value) || 0;
  if (item.product.productSkuId == item.product.productSaleSpecId) {
    inputNum = inputNum <= 0 ? 0 : inputNum > item.canReturnNum ? item.canReturnNum : inputNum;
    item.returnCount = inputNum;
    item.showCount = inputNum;
  } else {
    inputNum = inputNum <= 0 ? 0 : inputNum > item.canReturnNum * (item.product.XS || 1) ? item.canReturnNum * (item.product.XS || 1) : inputNum;
    let yu = inputNum % (item.product.XS || 1);
    inputNum -= yu;
    item.returnCount = inputNum / item.product.XS;
    item.showCount = inputNum;
  }
  List[index] = item;
  this.setGoodList(List, this.allSelected(), this.ReadySelectedCount());
}
module.exports = {
	selectTap , 
	allSelect ,
	allSelected ,
	ReadySelectedCount,
	setGoodList ,
	onSubShopCartBuyNum,
	onAddShopCartBuyNum ,
	onInputShopCartBuyNum		
}