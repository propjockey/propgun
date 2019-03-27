import PropJockey from "propjockey"
const hydrationStore = PropJockey.hydrationStore
const TimingPool = PropJockey.TimingPool

const valMinMax = (val, min, max) => Math.min(Math.max(val, min), max)

function Propgun (config) {
  this.reusableCacheEaseFunctions = []
  this.jockeyMe = { propgun: 0 }
  this.lastEase = undefined
  // animation keyframe position meta data and is offset from the time [0, 1] passed to pew
  this.minEasedAmount = undefined
  this.maxEasedAmount = undefined
  this.animationOffset = undefined
  // this.animation is expected to have props.propgun configured and repeat:true
  this.animation = undefined
  // this.timingPool is expected to be a manual timingPool and used on the animation
  this.timingPool = undefined

  Object.assign(this, config)

  this.animation.play(this.jockeyMe)
}

Propgun.prototype = {
  constructor: Propgun,

  pew: function (time, ease) {
    if (!this.animation) {
      throw new Error("this propgun has been destroyed")
    }
    // ease the time value manually
    if (ease && typeof ease !== "function") {
      const tempease = hydrationStore.get(ease)
      if (Array.isArray(ease) && typeof ease[0] === "string" && ease[0].startsWith("reuse-cache.")) {
        this.reusableCacheEaseFunctions.push(tempease)
      }
      ease = tempease
    }
    this.lastEase = ease
    time = valMinMax(time, 0, 1)
    if (typeof ease === "function") {
      time = ease(time)
    }
    time = valMinMax(time, this.minEasedAmount, this.maxEasedAmount)
    time += this.animationOffset

    this.animation.seek(this.jockeyMe, time)
    this.timingPool.tick(0)
    return this.jockeyMe.propgun
  },

  free: function (easeFn, details) {
    const thisCache = this.reusableCacheEaseFunctions
    const cacheIndex = thisCache.indexOf(easeFn)
    if (cacheIndex >= 0) {
      thisCache.splice(cacheIndex, 1)
    }
    return PropJockey.freeReusableCache(easeFn, details || { from: "The cache for this ease function was cleared by a propgun instance free()" })
  },

  destroy: function () {
    this.animation.stop(this.jockeyMe)
    this.lastEase = undefined
    this.jockeyMe = undefined
    this.animation = undefined
    this.timingPool = undefined
    if (this.reusableCacheEaseFunctions.length) {
      this.reusableCacheEaseFunctions.forEach(fn => {
        PropJockey.freeReusableCache(fn, { from: "The propgun that initiated this ease's cache was destroyed" })
      })
      this.reusableCacheEaseFunctions.length = 0
    }
  }
}

const colorTestRx = /^#[0-9a-f]{6,8}$/i
const unitRx = /^\d+(?:\.\d+)?(.*)$/
const asis = x => x
const numberSort = (a, b) => a - b
const keyframePositionPrep = positions => {
  // { "0": "#ff0000", "0.333": "#ff00ff", "90.25%": "#00ff88" }
  const strVals = Object.keys(positions)
  const sorted = []
  const posMap = new Map()
  strVals.map(pos => {
    let val = pos.endsWith("%") ? parseFloat(pos) / 100 : parseFloat(pos)
    posMap.set(val, pos)
    sorted.push(val)
  })
  sorted.sort(numberSort)
  let minEasedAmount = sorted[0]
  let maxEasedAmount = sorted[sorted.length - 1]

  if (minEasedAmount > 0) {
    sorted.unshift(0)
    posMap.set(0, "0")
    positions["0"] = positions[posMap.get(minEasedAmount)]
    minEasedAmount = 0
  }
  if (maxEasedAmount < 1) {
    sorted.push(1)
    posMap.set(1, "1")
    positions["1"] = positions[posMap.get(maxEasedAmount)]
    maxEasedAmount = 1
  }

  return { posMap, sorted, minEasedAmount, maxEasedAmount }
}

// Wrapper to set up a PropJockey animation from simple positions definition for easy config of Propgun
const propgun = function (positions) {
  // convert positions object into keyframes and determine PropJockey slider and setter etc
  const { posMap, sorted, minEasedAmount, maxEasedAmount } = keyframePositionPrep(positions)
  const animationOffset = 0 - minEasedAmount
  const firstVal = positions[posMap.get(minEasedAmount)]
  const firstValIsString = typeof firstVal === "string"
  const firstValueAsString = firstVal + ""
  let slide, setter, unit, parser
  if (colorTestRx.test(firstValueAsString)) {
    slide = firstValueAsString.length > 7 ? "slide.color.hexa" : "slide.color.hex"
    setter = "setter.object.prop"
    parser = asis
  } else {
    slide = "slide.number"
    unit = firstValueAsString.replace(unitRx, "$1")
    if (unit === firstValueAsString) {
      throw new Error("unknown value format")
    }
    setter = unit || firstValIsString ? "setter.object.prop.unit" : "setter.object.prop"
    parser = parseFloat
  }

  const keyframes = sorted.map(pos => {
    return {
      position: pos + animationOffset,
      value: parser(positions[posMap.get(pos)])
    }
  })

  const timingPool = new TimingPool()

  const animation = new PropJockey({
    timingPool,
    repeat: true,
    props: {
      propgun: { slide, setter, unit, keyframes }
    }
  })

  return new Propgun({
    animation,
    timingPool,
    minEasedAmount,
    maxEasedAmount,
    animationOffset
  })
}

export { propgun, Propgun }
export default propgun
