function watch(ctx, obj) {
  Object.keys(obj).forEach(key => {
    defineReactive(ctx, key, ctx[key], function (value) {
      obj[key].call(ctx, value)
    })
  })
} 

function computed(ctx, obj) {
  let keys = Object.keys(obj)
  let dataKeys = Object.keys(ctx.data)
  dataKeys.forEach(dataKey => {
    defineReactive(ctx.data, dataKey, ctx.data[dataKey])
  })
  let firstComputedObj = keys.reduce((prev, next) => {
    ctx.data.$target = function () {
      ctx.setData({ [next]: obj[next].call(ctx) })
    }
    prev[next] = obj[next].call(ctx)
    ctx.data.$target = null
    return prev
  }, {})
  ctx.setData(firstComputedObj)
}

function defineReactive(data, key, val, fn) {
  let subs = data['$' + key] || []
  Object.defineProperty(data, key, {
    configurable: true,
    enumerable: true,
    get: function () {
      if (data.$target) {
        subs.push(data.$target)
        data['$' + key] = subs
      }
      return val
    },
    set: function (newVal) {
      if (newVal === val) return
      fn && fn(newVal)
      if (subs.length) {
        subs.forEach(sub => sub())
      }
      val = newVal
    },
  })
}
function throttle (func, wait, options) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  if (!options) options = {};
  var later = function () {
    previous = options.leading === false ? 0 : new Date().getTime();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  return function () {
    var now = new Date().getTime();
    if (!previous && options.leading === false) previous = now;
    // 计算剩余时间
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      // options.trailing=true时，延时执行func函数
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
};
function debounce(func, wait, immediate) {
  // immediate默认为false
  var timeout, args, context, timestamp, result;

  var later = function () {
    var last = new Date().getTime() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function () {
    context = this;
    args = arguments;
    timestamp = new Date().getTime();
    // 第一次调用该方法时，且immediate为true，则调用func函数
    var callNow = immediate && !timeout;
    // 在wait指定的时间间隔内首次调用该方法，则启动计时器定时调用func函数
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};

function  equlObj(obj1, obj2) {
  if (JSON.stringify(obj1) == JSON.stringify(obj2)) {
    return 1;
  }
  if (Object.keys(obj1).length != Object.keys(obj2).length) {
    return 0;
  }
  Object.keys(obj1).forEach(function (item) {
    if (obj1[item] != obj2[item]) {
      return 0
    }
  })
  return 1;
}

module.exports = { watch, computed, throttle, debounce, equlObj}