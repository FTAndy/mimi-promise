// Constructor
// var promise = new Promise(function(resolve, reject) { resolve(value) } )
// var promise = new Promise(function(resolve, reject) { reject(value)} )
function Promise (executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('Promise resolver ' + executor + ' is not a function')
  }
  if (!(this instanceof Promise)) return new Promise(executor)

  var self = this
  this.status = 'pending'
  this.executedData = undefined
  this.resolvedCallbacks = []
  this.rejectedCallbacks = []

  function resolve(value) {
    if (value instanceof Promise) {
      return value.then(resolve, reject)
    }
    setTimeout(function() {
      if (self.status !== 'pending') {
        return
      }
      self.status = 'resolved'
      self.executedData = value
      for (var i = 0; i < self.resolvedCallbacks.length; i++) {
        self.resolvedCallbacks[i](value)
      }
    })
  }

  function reject(reason) {
    setTimeout(function() {
      if (self.status !== 'pending') {
        return
      }
      self.status = 'rejected'
      self.executedData = reason
      for (var i = 0; i < self.rejectedCallbacks.length; i++) {
        self.rejectedCallbacks[i](reason)
      }
    })
  }

  try {
    executor(resolve, reject)
  } catch(e) {
    reject(e)
  }
}

// Then
// promise.then(function() {})
Promise.prototype.then = function(resolvedCallback, rejectedCallback) {
  var promise2
  var self = this

  resolvedCallback = typeof resolvedCallback === 'function' ? resolvedCallback : function(value) { return value }
  rejectedCallback = typeof rejectedCallback === 'function' ? rejectedCallback : function(reason) { throw reason }

  if (this.status == 'resolved') {
    return promise2 = new Promise(function (resolve, reject) {
      setTimeout(function() {
        try {
          var x = resolvedCallback(self.executedData)
          resolvePromise(promise2, x, resolve, reject )
        } catch(e) {
          return reject(e)
        }
      })
    })
  }

  if (this.status == 'rejected') {
    return promise2 = new Promise(function (resolve, reject) {
      setTimeout(function() {
        try {
          var x = rejectedCallback(self.executedData)
          resolvePromise(promise2, x, resolve, reject)
        } catch(e) {
          return reject(e)
        }
      })
    })
  }

  if (this.status == 'pending') {
    return promise2 = new Promise(function (resolve, reject) {
      self.resolvedCallbacks.push(function (value) {
        try {
          var value = resolvedCallback(value)
          resolvePromise(promise2, value, resolve, reject )
        } catch(e) {
          return reject(e)
        }
      })
      self.rejectedCallbacks.push(function (reason) {
        try {
          var value = rejectedCallback(reason)
          resolvePromise(promise2, value, resolve, reject)
        } catch(e) {
          return reject(e)
        }
      })
    })
  }
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

module.exports = Promise




