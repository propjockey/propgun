![James0x57](https://img.shields.io/badge/James0x57%20%F0%9F%91%BD-I%20made%20a%20thing!-blueviolet.svg?labelColor=222222)

# propgun by PropJockey

Has 1 dependency, PropJockey, that is not yet ready for use

```js
  // propgun() expects a range of position:value pairs
  // position is a stringified float number between 0 and 1 or string percentage values between "0.0%" and "100%"
  // Overflow positions (beyond the range [0, 1]) are typically unused.
  // An easing function that overflows [0, 1] will use the values at 0 or 1 unless overflow positions are defined.
  // values can be numbers, hex colors in the form "#RRGGBB", or numbers with units as strings "87px"
  // does not support conversion between values with different units. The earliest position defined will determine the unit/type.
  const gradientpropgun = propgun({ "0": "#ff0000", "0.333": "#ff00ff", "90.25%": "#00ff88" }) // position 1.0 is also #00ff88

  // Takes a value time in range [0, 1] and returns the corresponding value tweened to that position
  // values > 1 are treated as 1
  // values < 0 are treated as 0
  const colorAtHalf = gradientpropgun(0.5) // 

  // Optionally takes an ease fn argument interpreted by PropJockey (TODO: link to easing docs). The default value is "ease.linear".
  // Eases apply to the series as a whole so any ease that produces an overflow position where
  // easedAmount >= 1 is treated as 1 if there are no overflow positions defined beyond 1.0 (eg "175%": "#000000")
  // likewise, easedAmounts <= 0 are treated as 0 unless there are negative overflow positions defined
  const colorAtHalfEaseOut = gradientpropgun(0.5, "ease.ease-out") // 

  // Any ease supported by PropJockey works (note PropJockey memoizes and stores factory ease caches for reuse anywhere)
  const colorAtThirdCustomBezier = gradientpropgun(0.333, ["factory.cubic-bezier", 1, 1, 0.3962, -0.4541]) // 

  // destroy method also attached in case use is temporary
  gradientpropgun.destroy() // clears everything so garbage collection can happen
```
