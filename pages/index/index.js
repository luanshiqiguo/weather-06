//index.js
//获取应用实例
const app = getApp()
var jsonData = require('../../data/json.js');
const { weatherList } = require('../../data/json.js');

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    weatherList: jsonData.weatherList,
    searchCity: '',
    pics:[],
    isShow: true,
    fromLogin: true
  },
  
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    this.getWeather("北京")
    this.animatFn()
  },
  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo || {},
      hasUserInfo: e.detail.userInfo ? true : false,
      fromLogin: true
    })
  },
  getWeather: function(e) {
    let that = this
    // 获取实况天气
    wx.request({
      url: 'https://free-api.heweather.net/s6/weather/now?key=a05653a9f5f64c309b6b70e8001b450c&location=' + e,
      success: function(res) {
        if (res.data.HeWeather6[0].status == 'unknown location') {
          wx.showToast({
            title: '抱歉！没有该城市的天气预报',
            icon: 'none',
            duration: 2000
          })
          return;
        }
        //console.log(res)
        that.setData({
          city: e,
          // 温度
          tmp: res.data.HeWeather6[0].now.tmp,
          // 实况天气状态码
          imgsrc: res.data.HeWeather6[0].now.cond_code,
          // 风向
          wind_dir: res.data.HeWeather6[0].now.wind_dir,
          // 风力
          wind_sc: res.data.HeWeather6[0].now.wind_sc,
          // 相对湿度
          hum: res.data.HeWeather6[0].now.hum,
          // 大气压强
          pres: res.data.HeWeather6[0].now.pres
        })
        var weekArr = new Array("周日", "周一", "周二", "周三", "周四", "周五", "周六");
        // 未来24h天气状况
        wx.request({
          url: 'https://www.tianqiapi.com/api?version=v1&appid=15622329&appsecret=wPKwZiu4&city=' + e,
          success: function(res){
            var arr = res.data.data;
            var daily_arr = [], hourly_arr = [];
            for(var i=0; i<arr.length; i++){
              if(i == 0){
                var h_arr = arr[i].hours
                for(var j=0; j<h_arr.length; j++){
                  hourly_arr[j] = {
                    h_time: h_arr[j].day.split('日')[1].split('时')[0]+":00",
                    h_wea: h_arr[j].wea,
                    h_imgsrc: weatherList[h_arr[j].wea] || "999",
                    h_tmp: h_arr[j].tem,
                    h_wind_dir: h_arr[j].win,
                    h_wind_sc: h_arr[j].win_speed
                  }
                }
              }
              daily_arr[i] = {
                // 周几
                d_txt: i == 0 ? "今天" : weekArr[new Date(arr[i].date).getDay()],
                // 日期
                d_date: arr[i].date.substring(5),
                // 天气图标
                d_imgsrc: arr[i].wea_img,
                // 天气图标n
                d_imgsrc_n: weatherList[arr[i].hours[0].wea] || "999",
                // 最高温
                tmp_max: arr[i].tem1,
                // 最低温
                tmp_min: arr[i].tem2,
                // 风向
                wind_dir: arr[i].win[0],
                // 风力
                wind_sc: arr[i].win_speed,
                // 天气描述
                wea: arr[i].wea
              }
            }
            that.setData({
              hourly_arr: hourly_arr,
              daily_arr: daily_arr
            })
          }
        })
      }
    })
    
  },
  bindKeyInput: function(e){
    this.data.searchCity = e.detail.value
  },
  clickSearch: function(){
    this.getWeather(this.data.searchCity)
  },
  //事件处理函数
  bindViewTap: function() {
    // wx.navigateTo({
    //   url: '../logs/logs'
    // })
    this.setData({
      fromLogin: false
    })
    console.log('跳转上传页')
  },

  /**上传图片 */
  uploadImage: function(){
    let that=this;
    let pics = that.data.pics;
    console.log('上传图片')
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'], 
      sourceType: ['album', 'camera'], 
      success: function(res) {
        // 获取上传图片地址
        let imgSrc = res.tempFilePaths;
        pics.push(imgSrc);
        if(pics.length > 1){
          wx.showToast({
            title: '抱歉！只能选择一张图片哦',
            icon: 'none',
            duration: 2000
          })
          return;
        }
        that.setData({
          isShow: false,
          pics: pics,
          fromLogin: true
        })
      },
    })
  },
  /**删除图片 */
  deleteImg: function(e){
    let that = this;
    let deleteImg = e.currentTarget.dataset.img;
    let pics = that.data.pics;
    let newPics = [];
    console.log('删除图片')
    for (let i=0; i<pics.length; i++){
     //判断字符串是否相等
      if (pics[i]["0"] !== deleteImg["0"]){
        newPics.push(pics[i])
      }
    }
    that.setData({
      pics: newPics,
      isShow: true
    })
  },
  animatFn: function(){
    var animat = wx.createAnimation({
      timingFunction: "ease",
      delay: 0,
    })
    var next = true;
    setInterval(() => {
      if(next){
        animat.width("50rpx").height("50rpx").translate(200, 20).step({duration: 3500})
        animat.width("250rpx").height("250rpx").translate(420, 0).step({duration: 3500})
        next = !next
      }else{
        animat.width("50rpx").height("50rpx").translate(200, 20).step({duration: 3500})
        animat.width("250rpx").height("250rpx").translate(0, 0).step({duration: 3500})
        next = !next
      }
      this.setData({
        animat: animat.export()
      })
    }, 7000)
  }
})
