// Constructor
// var promise = new Promise(function(resolve, reject) { resolve(value) } )
// var promise = new Promise(function(resolve, reject) { reject(value)} )
function Promise (executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('Promise resolver ' + executor + ' is not a function')
  }
  if (!(this instanceof Promise)) return new Promise(executor)

  this.status = 'pending'
  this.executedData = undefined
  this.resolvedCallbacks = []
  this.rejectedCallbacks = []
  try {
    executor(resolve.bind(this), reject.bind(this))
  } catch(e) {
    reject.bind(this)(e)
  }
}

function resolve(executedData) {
  if (executedData instanceof Promise) {
    return executedData.then(resolve, reject)
  }
  setTimeout(function() {
    if (this.status == 'pending') {
      this.status = 'resolved'
      this.executedData = executedData
      for (var i = 0; i < this.resolvedCallbacks.length; i++) {
        this.resolvedCallbacks[i](executedData)
      }
    } else {
      return
    }
  }.bind(this))
}

function reject(executedData) {
  setTimeout(function() {
    if (this.status == 'pending') {
      this.status = 'rejectd'
      this.executedData = executedData
      for (var i = 0; i < this.rejectedCallbacks.length; i++) {
        this.rejectedCallbacks[i](executedData)
      }
    } else {
      return
    }
  }.bind(this))
}

// Then
// promise.then(function() {})
Promise.prototype.then = function(resolvedCallback, rejectedCallback) {
  var promise2

  resolvedCallback = typeof resolvedCallback === 'function' ? resolvedCallback : function(value) { return value }
  rejectedCallback = typeof rejectedCallback === 'function' ? rejectedCallback : function(reason) { throw reason }

  var resolvedResult = function (resolve, reject) {
    setTimeout(function() {
      try {
        var x = resolvedCallback(this.executedData)
        resolvePromise(promise2, x, resolve, reject )
      } catch(e) {
        return reject(e)
      }
    }.bind(this))
  }.bind(this)

  var rejectedResult = function (resolve, reject) {
    setTimeout(function() {
      try {
        var x = rejectedCallback(this.executedData)
        resolvePromise(promise2, x, resolve, reject)
      } catch(e) {
        return reject(e)
      }
    }.bind(this))
  }.bind(this)

  var pendingResult = function (resolve, reject) {
    this.resolvedCallbacks.push(resolvedResult.bind(this, resolve, reject))
    this.rejectedCallbacks.push(rejectedResult.bind(this, resolve, reject))
  }.bind(this)

  if (this.status == 'resolved') {
    return promise2 = new Promise(resolvedResult)
  }

  if (this.status == 'rejected') {
    return promise2 = new Promise(rejectedResult)
  }

  if (this.status == 'pending') {
    return promise2 = new Promise(pendingResult)
  }
}

Promise.prototype.catch = function(rejectedCallback) {
  return this.then(null, rejectedCallback)
}

Promise.deferred = Promise.defer = function() {
    var dfd = {}
    dfd.promise = new Promise(function(resolve, reject) {
      dfd.resolve = resolve
      dfd.reject = reject
    })
    return dfd
}

function resolvePromise(promise, x, resolve, reject) {
  var then
  var thenCalledOrThrow = false

  if (promise === x) {
    return reject(new TypeError('Chaining cycle'))
  }

  if (x instanceof Promise) {
    if (x.status === 'pending') {
      x.then(function(value) {
        resolvePromise(promise, value, resolve, reject)
      }, reject)
    } else {
      x.then(resolve, reject)
    }
    return
  }

  if ((x !== null) && ((typeof x === 'object') || (typeof x === 'function'))) {
    try {

      then = x.then
      if (typeof then === 'function') {
        then.call(x, function rs(y) {
          if (thenCalledOrThrow) return
          thenCalledOrThrow = true
          return resolvePromise(promise, y, resolve, reject)
        }, function rj(r) {
          if (thenCalledOrThrow) return
          thenCalledOrThrow = true
          return reject(r)
        })
      } else {
        return resolve(x)
      }
    } catch (e) {
      if (thenCalledOrThrow) return
      thenCalledOrThrow = true
      return reject(e)
    }
  } else {
    return resolve(x)
  }

}

try { // CommonJS compliance
    module.exports = Promise
}
catch(e) {

}




