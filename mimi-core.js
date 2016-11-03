// The main logic of create Promise and process then callback is that:
// 1. When sync process resolve/reject function in constructor,
// don't do anything, just async process then callback function
// 2. When async process resolve/reject function in constructor,
// sync register all then callbacks to Promise instance.
// Wait for the resolve/reject function processed, and async process all
// then registered then callbaks

// Simply choose a microtask
const asyncFn = (function () {
  if (typeof process === 'object' && process !== null && typeof (process.nextTick) === 'function')
    return process.nextTick
  if (typeof (setImmediate) === 'function')
    return setImmediate
  return setTimeout
}())

// States
const PENDING = 'PENDING'

const RESOLVED = 'RESOLVED'

const REJECTED = 'REJECTED'

// Constructor
function MimiPromise(executor) {
  this.state = PENDING
  this.executedData = undefined
  this.multiPromise2 = []

  const resolve = (value) => {
    settlePromise(this, RESOLVED, value)
  }

  const reject = (reason) => {
    settlePromise(this, REJECTED, reason)
  }

  executor(resolve, reject)
}

MimiPromise.prototype.then = function (resolvedCallback, rejectedCallback) {
  const promise2 = new MimiPromise(() => {})

  if (typeof resolvedCallback === "function") {
    promise2.resolvedCallback = resolvedCallback;
  }
  if (typeof rejectedCallback === "function") {
    promise2.rejectedCallback = rejectedCallback;
  }

  if (this.state === PENDING) {
    this.multiPromise2.push(promise2)
  } else if (this.state === RESOLVED) {
    asyncProcessCallback(this, promise2, promise2.resolvedCallback)
  } else if (this.state === REJECTED) {
    asyncProcessCallback(this, promise2, promise2.rejectedCallback)
  }

  return promise2
}

MimiPromise.prototype.catch = function (rejectedCallback) {
  return this.then(null, rejectedCallback)
}

// Settle any promise, set state and value, check if there is
// any then callback and async process them with the origin promise,
// return promise2(aka promise2), and callback itself.
function settlePromise(promise, executedState, executedData) {
  if (promise.state !== PENDING)
    return

  promise.state = executedState
  promise.executedData = executedData

  if (promise.multiPromise2.length > 0) {
    const callbackType = executedState === RESOLVED ? "resolvedCallback" : "rejectedCallback"

    for (const promise2 of promise.multiPromise2) {
      asyncProcessCallback(promise, promise2, promise2[callbackType])
    }
  }
}

// Async process callback with origin promise and promise2
function asyncProcessCallback(promise, promise2, callback) {
  asyncFn(() => {
    if (!callback) {
      settlePromise(promise2, promise.state, promise.executedData);
      return;
    }

    let x

    try {
      x = callback(promise.executedData)
    } catch (e) {
      settlePromise(promise2, REJECTED, e)
      return
    }

    settleWithX(promise2, x)
  })
}

function settleWithX(p, x) {
  if (x === p && x) {
    settlePromise(p, REJECTED, new TypeError("promise_circular_chain"));
    return;
  }

  let xthen
  const type = typeof x;

  if (x !== null && (type === "function" || type === "object")) {
    try {
      xthen = x.then;
    } catch (err) {
      settlePromise(p, REJECTED, err);
      return;
    }
    if (typeof xthen === "function") {
      settleXthen(p, x, xthen);
    } else {
      settlePromise(p, RESOLVED, x);
    }
  } else {
    settlePromise(p, RESOLVED, x);
  }
}

function settleXthen(p, x, xthen) {
  try {
    xthen.call(x, (y) => {
      if (!x) return;
      x = null;

      settleWithX(p, y);
    }, (r) => {
      if (!x) return;
      x = null;

      settlePromise(p, REJECTED, r);
    });
  } catch (err) {
    if (x) {
      settlePromise(p, REJECTED, err);
      x = null;
    }
  }
}

MimiPromise.deferred = MimiPromise.defer = function () {
  const dfd = {}
  dfd.promise = new MimiPromise((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}

module.exports = MimiPromise;
