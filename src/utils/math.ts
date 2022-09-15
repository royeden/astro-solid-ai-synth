// Based in p5js constrain function https://github.com/processing/p5.js/blob/v1.4.2/src/math/calculation.js#L110
export function constrain(value: number, min: number, max: number) {
  return Math.max(Math.min(value, max), min);
}

// Based in p5js map function https://github.com/processing/p5.js/blob/v1.4.2/src/math/calculation.js#L448
export function map(
  value: number,
  min: number,
  max: number,
  targetMin: number,
  targetMax: number,
  bound?: boolean
) {
  const result =
    ((value - min) / (max - min)) * (targetMax - targetMin) + targetMin;
  return bound
    ? constrain(
        result,
        Math.min(targetMax, targetMin),
        Math.max(targetMax, targetMin)
      )
    : result;
}

export function round(value: number) {
  return (value + 0.5) << 0;
}
