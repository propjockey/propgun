![James0x57](https://img.shields.io/badge/James0x57%20%F0%9F%91%BD-I%20made%20a%20thing!-blueviolet.svg?labelColor=222222)

# propgun by PropJockey

Has 1 dependency, PropJockey, that is not yet ready for use

```js
  // propgun() expects a range of position:value pairs
  // position is a stringified float number between 0 and 1 or string percentage values between "0.0%" and "100%"
  // Overflow positions (beyond the range [0, 1]) are typically unused.
  // An easing function that overflows [0, 1] will use the values at 0 or 1 unless overflow positions are defined.
  // values can be numbers, hex colors in the form "#RRGGBB" or "#RRGGBBAA", or numbers with units as strings "87px"
  // does not support conversion between values with different units. The earliest position defined will determine the unit/type.
  const gradientpropgun = propgun({ "0": "#ff0000", "0.333": "#ff00ff", "90.25%": "#00ff88" }) // position 1.0 is also #00ff88

  // Takes a value time in range [0, 1] and returns the corresponding value tweened to that position
  // values > 1 are treated as 1
  // values < 0 are treated as 0
  const colorAtHalf = gradientpropgun.pew(0.5) // --> "#b44bdc"

  // Optionally takes an ease fn argument interpreted by PropJockey (TODO: link to easing docs). The default value is "ease.linear".
  // Eases apply to the series as a whole so any ease that produces an overflow position where
  // easedAmount >= 1 is treated as 1 if there are no overflow positions defined beyond 1.0 (eg "175%": "#000000")
  // likewise, easedAmounts <= 0 are treated as 0 unless there are negative overflow positions defined
  const colorAtHalfEaseOut = gradientpropgun.pew(0.5, "ease.ease-out") // --> "#629db6"

  // Any ease supported by PropJockey works
  const colorAtThirdCustomBezier = gradientpropgun.pew(0.333, ["reuse-cache.cubic-bezier", 1, 1, 0.3962, -0.4541]) // --> "#ff00de"
  // (note if you use a "memoize." ease it will be cached for reuse anywhere or pulled from an existing instance)

  // the last ease function used is available here. If an array or named ease was used, this will be the function it resolved to.
  // If it was a ["reuse-cache.*", ...] ease then lastEase will become invalid if destroy() is called. See propjockey docs [TODO link]
  gradientpropgun.lastEase

  // destroy method also attached in case use is temporary
  // Every time an array was passed in for "ease" and index 0 was a string starting with "reuse-cache." then
  // calling destroy will also clear the cache for each of those ease functions.
  gradientpropgun.destroy() // tears down the underlying animation and timingPool, and clears own properties so garbage collection can happen

  // An ease function that was created from PropJockey's hydrationStore before being passed into your
  // propgun will not have their cache cleared on destroy(). Completely custom ease functions can also be used.

  // Memoize eases from PropJockey are stored and cannot be individually freed. Anything using PropJockey outside of propgun will
  // have access to the same instance too. Example use:
  let my4values = []
  my4values.push( gradientpropgun.pew(0.25, ["memoize.quadratic-bezier", 0.3962, -0.4541]) )
  my4values.push( gradientpropgun.pew(0.50, ["memoize.quadratic-bezier", 0.3962, -0.4541]) )
  my4values.push( gradientpropgun.pew(0.75, ["memoize.quadratic-bezier", 0.3962, -0.4541]) )
  my4values.push( gradientpropgun.pew(1.00, ["memoize.quadratic-bezier", 0.3962, -0.4541]) )
  gradientpropgun.destroy()
  // The same cache and function is used each time and its cache is only calculated once.
  // Calling destroy does not free the cache, it remains memoized in PropJockey.

  // Example of best use of a propgun eased with "reuse-cache.":
  let my4values = []
  my4values.push( gradientpropgun.pew(0.25, ["reuse-cache.cubic-bezier", 1, 1, 0.3962, -0.4541]) )
  let resolvedEaseFn = gradientpropgun.lastEase
  my4values.push( gradientpropgun.pew(0.50, resolvedEaseFn) )
  my4values.push( gradientpropgun.pew(0.75, resolvedEaseFn) )
  my4values.push( gradientpropgun.pew(1.00, resolvedEaseFn) )
  gradientpropgun.destroy()
  // The ease function is created and its cache is built on the first call to gradientpropgun.pew. Subsequent calls use the easeFn directly.
  // If the array definition was used every time, it will re-create the function and cache each time. Calling destroy would free all 4 in that case.

  // If you want to use multiple eases on a single propgun, you can use the free method on reuseable cache eases that are no longer needed:
  gradientpropgun.free(myEaseFnWithReuseCache)
  // This makes a call to PropJockey.freeReusableCache with the ease function provided.

  // Example:
  const gradientpropgun = propgun({ "0": "#ff0000", "0.333": "#ff00ff", "90.25%": "#00ff88" })
  const my4values = []
  my4values.push( gradientpropgun.pew(0.25, ["reuse-cache.cubic-bezier", 1, 1, 0.3962, -0.4541]) )
  let myEaseFnWithReuseCache = gradientpropgun.lastEase
  my4values.push( gradientpropgun.pew(0.50, myEaseFnWithReuseCache) )
  gradientpropgun.free(myEaseFnWithReuseCache) // myEaseFnWithReuseCache is now invalid (bound to freed memory)
  myEaseFnWithReuseCache = undefined // the ease function itself can be garbage collected now because the internal instance was removed
  my4values.push( gradientpropgun.pew(0.75, "ease.ease-out") )
  my4values.push( gradientpropgun.pew(1.00, "ease.ease-out") )
  gradientpropgun.destroy() // does normal animation cleanup so everything can be garbage collected. No further reuse-cache was needed.
```
