const App = getApp();


// 三级联动地址组件
class AddressSelect {
  data = {
    addressSelectShow: false,
    finish: true,//提示显示
    provinceList: [],//省份列表
    activeName: 'province',
    addressInfo: {}
  }
  finish= true;
  addressData = [];
  provinceList =  [];//省份列表
  cityList = [];//城市列表
  countyData = []
  countyList = [];//县，行政区域列表
  streetList = [];//街道列表
  showList = [];//当前展示的数据列表
  addressInfo = {};//已经选择的地址
  isAdd = false;//是否新增地址
  activeName = 'province';
  isOk = false;
  constructor(params={}, options = {}) {
    Object.assign(this,{
      options,
      })
    Object.assign(this, params)
    // this._init()
  };

  //初始化
  _init(that) {
    // this.options.page.prototype = this;
    App.HttpService.getCityList().then(data => {
      if (data.success) {
        this.addressData = data.data;
        data.data.forEach( (item) => {
          if (this.provinceList.indexOf(item.province) <0 ) {
            this.provinceList.push(item.province);
          }
        })
        // 拼音首字母排序
        this.provinceList = this._sortArray(this.provinceList);
        this._startSelect()
        // this.options.Rendering(['provinceList', 'finish','changeProvince']);
        
        //如果省份存在，除了注册选择地址，其他的地方都不允许选择省份
        if (this.isAdd) {
          App.HttpService.getStreetList(this.addressInfo.province, this.addressInfo.city).then( data => {
            this.countyData = data.data;
            let arr = [];
            data.data.forEach(item => {
              arr.push(item.countyName)
            })
            this.countyList = this.countyList.concat(arr);
            this.activeName = 'county';
            this.finish = true;
            that.setData({
              countyList: arr,

              addressSelectShow: true,
              "addressInfo.province": this.addressInfo.province,
              "addressInfo.city": this.addressInfo.city,
              "addressInfo.county": this.addressInfo.county,
              activeName: 'county'
            })
          })
        } else{
          that.setData({
            provinceList: this.provinceList,
            addressSelectShow: true
          })
        }
      }
    })
  }
  //数组按拼音首字母排序
  _sortArray(arr) {
    let resultArray = arr.sort(
      function compareFunction(param1, param2) {
        return param1.localeCompare(param2, "zh");
      }
    );
    return resultArray;
  }
   //根据省份查找城市列表
  _filterCity(province) {
    var arr = [];
    this.addressData.forEach( item => {
      if( item.province == province) {
        arr.push(item.city);
      }
    })
    return arr;
  }
  //选择省份
  selectProvince(that) {
    if (this.isAdd) {
      return;
    }
    this.cityList = [];
    this.addressInfo.city = '';
    this.provinceList.forEach(province => {
      if (province == this.addressInfo.province) {
        this.cityList = this._filterCity(province);
        this.activeName = 'city';
        this.countyList = [];
        this.finish = true;
      
        that.setData({
          activeName: 'city',
          cityList: this.cityList,
          "addressInfo.city": '',
          "addressInfo.county": ''
        })
      }
    })
  }
  //选择城市
  selectCity(that) {
    this.countyList = [];
    this.addressInfo.county = "";
    App.HttpService.getStreetList(this.addressInfo.province,this.addressInfo.city).then(data => {
      if (data.success) {
        if (data.data && data.data.length) {
          this.countyData = data.data;
          let arr = [];
          data.data.forEach(item => {
            arr.push(item.countyName) 
          })
          this.countyList = this.countyList.concat(arr);
          this.activeName = 'county';
          this.finish = true;
          that.setData({
            countyList: this.countyList,
            activeName: 'county',
            finish: true,
            "addressInfo.county": ""
          })
        } else {
          this.finish = false;
          // this._backAddress()
        }
      }
    })
  }
  //切换省份
  changeProvince(that, province) {
    this.addressInfo.province = province;
    that.setData({
      "addressInfo.province": province
    })
    this.selectProvince(that)
  }
  //切换城市
  changeCity(that,city) {
    this.addressInfo.city = city;
    that.setData({
      "addressInfo.city": city
    })
    this.selectCity(that)
  }
  //切换区域
  changeCounty(that,county) {
    this.addressInfo.county = county;
    that.setData({
      "addressInfo.county": county,
      "finish": false,
    })
    this.activeName = "county"
    this.finish = false;
    // this._backAddress();
    this.isOk = true;
  }
  //开始选择地址
  _startSelect() {
    if(this.isAdd) {
      return;
    }
    this.finish = true;
    this.activeName = 'province';
    this.addressInfo.province = "";
    this.cityList = [];
    this.countyList = [];
    this.addressInfo.city = "";
    this.addressInfo.county = "";
  }
  onDismiss (that) {
    if(this.isOk) {
      if (that.route == "pages/user/receiveAddress/addNewAddress") {
        that.setData({
          addressSelectShow: false,
          "address.province": this.addressInfo.province,
          "address.city": this.addressInfo.city,
          "address.county": this.addressInfo.county,
          "address.street": ''
        })
      } else {
        that.setData({
          addressSelectShow: false,
          province: this.addressInfo.province,
          city: this.addressInfo.city,
          county: this.addressInfo.county,
          street: ''
        })
      }
      
    } else{
      that.setData({
        addressSelectShow: false
      })
    }
  }
  startSelect(that) {
    if (this.isAdd) {
      this.finish = false;
      this.activeName = 'county';
      that.setData({
        activeName: 'county',
        "addressInfo.province": this.addressInfo.province,
        "addressInfo.city": this.addressInfo.city,
        "addressInfo.county": this.addressInfo.county,
        addressSelectShow: true
      })
      return;
    }  else{
      this.finish = this.addressInfo.county?false: true;
      let activeName = this.activeName || "county";
      let ready = activeName == 'province' ? 'provinceList' : activeName == 'city' ? 'cityList' : activeName == 'county' ? 'countyList' : 'provinceList';
      that.setData({
        activeName: activeName,
        "addressInfo.province": this.addressInfo.province || '',
        "addressInfo.city": this.addressInfo.city || '',
        "addressInfo.county": this.addressInfo.county || '',
        addressSelectShow: true,
        finish: this.finish,
        [ready]: this[ready]
      })
    }  
  }
  beginProvince(that) {
    this.finish = true;
    this.cityList = [];
    this.countyList = [];
    this.countyData = [];
    this.addressInfo.city = "";
    this.addressInfo.county = "";
    this.activeName = "province";
    that.setData({
      finish: true,
      "addressInfo.province": this.addressInfo.province,
      "addressInfo.city": "",
      "addressInfo.county": "",
      activeName: "province"
    })
  }
  beginCity(that) {
    this.finish = true;
    this.countyList = [];
    this.countyData = [];
    this.addressInfo.county = "";
    this.activeName = "city";
    that.setData({
      finish: true,
      activeName: "city",
      "addressInfo.province": this.addressInfo.province,
      "addressInfo.city": this.addressInfo.city,
      "addressInfo.county": "",
    })
  }
}
export default AddressSelect;