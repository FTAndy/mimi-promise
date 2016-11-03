const Mimi = require('./mimi-core')
module.exports = Mimi

// If value is a promise, return this promise
// else just resolve this value and return a new promise
Mimi.resolve = (value) => {
  if (value instanceof Mimi)
    return value
  return new Mimi(r => r(value))
}

// Just to reject a promise with reason
Mimi.reject = (reason) => {
  return new Mimi((rs, rj) => rj(reason))
}

Mimi.all = (promiseArray) => {
  if (!Array.isArray(promiseArray))
    throw new TypeError("params is not a Array")

  let resolvePromiseCount = 0
  const promiseResults = []

  return new Mimi((resolve, reject) => {
    for (const promise of promiseArray) {
      promise.then((data) => {
        resolvePromiseCount += 1
        promiseResults.push(data)
        if (promiseResults.length === promiseArray.length)
          resolve(promiseResults)
      })
      .catch((err) => {
        reject(err)
      })
    }
  })
}

Mimi.race = (promiseArray) => {
  if (!Array.isArray(promiseArray))
    throw new TypeError("params is not a Array")

  return new Mimi((resolve, reject) => {
    for (const promise of promiseArray) {
      promise.then((data) => {
        resolve(data)
      })
      .catch((err) => {
        reject(err)
      })
    }
  })
}
