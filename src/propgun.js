import PropJockey from "propjockey/dist/cjs/propjockey"
const hydrationStore = PropJockey.hydrationStore
const TimingPool = hydrationStore.TimingPool

const valMinMax = (val, min, max) => Math.min(Math.max(val, min), max)
const colorTestRx = /^#[0-9a-f]{6}$/i
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

// Factory wrapper for PropJockey functionality
const propgun = function (positions) {
  // convert positions object into keyframes and determine PropJockey slider and setter etc
  let { posMap, sorted, minEasedAmount, maxEasedAmount } = keyframePositionPrep(positions)
  const animationOffset = 0 - minEasedAmount
  const firstVal = positions[posMap.get(minEasedAmount)]
  const firstValIsString = typeof firstVal === "string"
  const firstValueAsString = firstVal + ""
  let slide, setter, unit, parser
  if (colorTestRx.test(firstValueAsString)) {
    slide = "slide.color.hex"
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

  let keyframes = sorted.map(pos => {
    return {
      position: pos + animationOffset,
      value: parser(positions[posMap.get(pos)])
    }
  })
  sorted.length = 0
  sorted = undefined
  posMap.clear()
  posMap = undefined

  let timingPool = new TimingPool()

  let animation = new PropJockey({
    timingPool,
    repeat: true,
    props: {
      propgun: { slide, setter, unit, keyframes }
    }
  })
  keyframes = undefined

  let jockeyMe = { propgun: 0 }

  animation.play(jockeyMe)

  let propgunbang = function (time, ease) {
    if (!animation) {
      throw new Error("this propgun has been destroyed")
    }
    // ease the time value manually
    if (ease && typeof ease !== "function") {
      ease = hydrationStore.get(ease)
    }
    time = valMinMax(time, 0, 1)
    if (typeof ease === "function") {
      time = ease(time)
    }
    time = valMinMax(time, minEasedAmount, maxEasedAmount)
    time += animationOffset

    animation.seek(jockeyMe, time)
    timingPool.tick(0)
    return jockeyMe.propgun
  }

  propgunbang.destroy = function () {
    animation.stop(jockeyMe)
    jockeyMe = undefined
    animation = undefined
    timingPool = undefined
    propgunbang = undefined
  }

  return propgunbang
}

export { propgun }
export default propgun
