import QUnit from "steal-qunit"
import propgun from "../src/propgun.js"

const { test } = QUnit

QUnit.module("propgun by PropJockey", function (hooks) {
  test("import should work", t => {
    t.ok(propgun, "exists")
  })
  test("create and destroy should work", t => {
    const gradientpropgun = propgun({ "0": "#ff0000", "0.333": "#ff00ff", "90.25%": "#00ff88" })
    t.equal(typeof gradientpropgun, "function", "propgun created")
    t.equal(typeof gradientpropgun.destroy, "function", "propgun has destroy function")
    t.ok(gradientpropgun(0.5), "should be able to get a value from propgun")
    t.equal(gradientpropgun(0.25), gradientpropgun(0.25), "should be able to get a value from propgun and should be consistent")
    gradientpropgun.destroy()
    try {
      gradientpropgun(1.0)
    } catch (e) {
      t.ok(e.message.includes("destroyed"), "should throw if used after being destroyed")
    }
  })
  test("values should be correct without unit", t => {
    const valpropgun = propgun({ "0%": 10, "1.00": 20 })
    t.strictEqual(valpropgun(0.5), 15, "Value should be half way between 10px and 20px")
    t.strictEqual(valpropgun(0), 10, "Value should equal the 0 position")
    t.strictEqual(valpropgun(1), 20, "Value should equal the 1 position")
    t.strictEqual(valpropgun(-111), 10, "Value should equal the 0 position")
    t.strictEqual(valpropgun(111), 20, "Value should equal the 1 position")
    t.strictEqual(valpropgun(3/10), 13, "Value should equal 0 position plus 3/10ths of the range between 10px and 20px")
    t.strictEqual(valpropgun(7/20), 13.5, "Value should include decimals when needed")
    valpropgun.destroy()
  })
  test("string number values without unit return as a string", t => {
    const valpropgun = propgun({ "0%": "10", "1.00": "20" })
    t.strictEqual(valpropgun(0.5), "15", "Value should be half way between 10px and 20px")
    t.strictEqual(valpropgun(0), "10", "Value should equal the 0 position")
    t.strictEqual(valpropgun(1), "20", "Value should equal the 1 position")
    t.strictEqual(valpropgun(-111), "10", "Value should equal the 0 position")
    t.strictEqual(valpropgun(111), "20", "Value should equal the 1 position")
    t.strictEqual(valpropgun(3/10), "13", "Value should equal 0 position plus 3/10ths of the range between 10px and 20px")
    t.strictEqual(valpropgun(7/20), "13.5", "Value should include decimals when needed")
    valpropgun.destroy()
  })
  test("unknown value types will throw", t => {
    try {
      propgun({ "0": "ostrich", "1": "flamingo" })
      t.ok(false, "I think Greys is a pretty cool guy. eh tweens dna and doesn't afraid of anything.")
    } catch (e) {
      t.ok(e.message.includes("unknown"), "Cannot tween ostiches to flamingos.")
    }
  })
  test("values should be correct with unit", t => {
    const pxpropgun = propgun({ "0.0": "10px", "100%": "20px" })
    t.equal(pxpropgun(0.5), "15px", "Value should be half way between 10px and 20px")
    t.equal(pxpropgun(0), "10px", "Value should equal the 0 position")
    t.equal(pxpropgun(1), "20px", "Value should equal the 1 position")
    t.equal(pxpropgun(-111), "10px", "Value should equal the 0 position")
    t.equal(pxpropgun(111), "20px", "Value should equal the 1 position")
    t.equal(pxpropgun(3/10), "13px", "Value should equal 0 position plus 3/10ths of the range between 10px and 20px")
    t.equal(pxpropgun(7/20), "13.5px", "Value should include decimals when needed")
    pxpropgun.destroy()
  })
  test("0 position can be ommitted and next value will be used at 0", t => {
    const percentpropgun = propgun({ "0.5": "50%", "1.00": "200%" })
    t.equal(percentpropgun(0.25), "50%", "The time range 0 to 0.5 is all 50% in this case")
    t.equal(percentpropgun(0), "50%", "The 0 position should be the first chronological value specified")
    t.equal(percentpropgun(1), "200%", "Value should equal the 1 position")
    t.equal(percentpropgun(0.75), "125%", "Value should still tween later")
    percentpropgun.destroy()
  })
  test("1 position can be ommitted and previous value will be used at 1", t => {
    const valpropgun = propgun({ "0": 0, "60%": 60, "75%": 90 })
    t.equal(valpropgun(0.3), 30, "Left values still tween")
    t.equal(valpropgun(0.7), 80, "Tweens are as expected")
    t.equal(valpropgun(0.9), 90, "Value at or past last position are all equal")
    t.equal(valpropgun(1), 90, "Value is 90 at position 1")
    valpropgun.destroy()
  })
  test("both 0 and 1 position can be ommitted", t => {
    const valpropgun = propgun({ "60%": 60, "75%": 90 })
    t.equal(valpropgun(0), 60, "0 position is 60")
    t.equal(valpropgun(0.7), 80, "Middle tweens are as expected")
    t.equal(valpropgun(1), 90, "Value is 90 at position 1")
    valpropgun.destroy()
  })
  test("0 and 1 position can be implied by overflow values", t => {
    const gradientpropgun = propgun({"-50%": "#000000", "50%": "#888888", "150%": "#ffffff"})
    t.equal(gradientpropgun(0), "#444444", "0 position is correctly interpolated as #444444")
    t.equal(gradientpropgun(0.5), "#888888", "Middle value as specified")
    t.equal(gradientpropgun(1), "#c4c4c4", "1 position is correctly interpolated as #c4c4c4")
    t.equal(gradientpropgun(-2), "#444444", "time passed in is truncated to range [0, 1] so 0 position is lowest available unless easing overflows")
    t.equal(gradientpropgun(2), "#c4c4c4", "time passed in is truncated to range [0, 1] so 1 position is highest available unless easing overflows")
    gradientpropgun.destroy()
  })
  test("custom easing functions work and can swing into overflow values", t => {
    const gradientpropgun = propgun({"-50%": "#000000", "50%": "#888888", "1.5": "#ffffff"})
    const bigOverflowLeftAtPosition = 0.125
    const overflowLeftAtPosition = 0.25
    const overflowRightAtPosition = 0.75
    const bigOverflowRightAtPosition = 0.875
    const nonOverflowAtPosition = 0.66
    const myBadEasingFn = time => {
      if (time <= 0) {
        return 0
      }
      if (time >= 1) {
        return 1
      }
      if (time === bigOverflowLeftAtPosition) {
        return -1
      }
      if (time === overflowLeftAtPosition) {
        return -0.5
      }
      if (time === overflowRightAtPosition) {
        return 1.5
      }
      if (time === bigOverflowRightAtPosition) {
        return 2
      }
      return 0.5
    }
    t.equal(gradientpropgun(bigOverflowLeftAtPosition, myBadEasingFn), "#000000", "easing that goes past lowest overflow position returns lowest overflow value")
    t.equal(gradientpropgun(overflowLeftAtPosition, myBadEasingFn), "#000000", "easing that lands at lowest overflow position returns that overflow value")
    t.equal(gradientpropgun(overflowRightAtPosition, myBadEasingFn), "#ffffff", "easing that lands at highest overflow position returns that overflow value")
    t.equal(gradientpropgun(bigOverflowRightAtPosition, myBadEasingFn), "#ffffff", "easing that goes past highest overflow position returns highest overflow value")
    t.equal(gradientpropgun(0, myBadEasingFn), "#444444", "Easing function is working for <= 0 times")
    t.equal(gradientpropgun(1, myBadEasingFn), "#c4c4c4", "Easing function is working for >= 1 times")
    t.equal(gradientpropgun(nonOverflowAtPosition, myBadEasingFn), "#888888", "Easing function is working for other values")
    gradientpropgun.destroy()
  })
  test("can specify easing functions using PropJockey's hydrationStore format", t => {
    const valpropgun = propgun({ "0": 100, "1": 50 })
    t.equal(valpropgun(0, ["factory.steps", 1, "jump-end"]), 100, "step-end factory easing is working as expected for position 0")
    t.equal(valpropgun(0.5, ["factory.steps", 1, "jump-end"]), 100, "step-end factory easing is working as expected for position 0.5")
    t.equal(valpropgun(0.5, ["factory.steps", 1, "jump-start"]), 50, "different easing functions can be used against the same propgun")
    t.equal(valpropgun(0.99, ["factory.steps", 1, "jump-end"]), 100, "step-end factory easing is working as expected for position 0.99")
    t.equal(valpropgun(1, ["factory.steps", 1, "jump-end"]), 50, "step-end factory easing is working as expected for position 1")
    valpropgun.destroy()
  })
})
