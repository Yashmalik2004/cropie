function centroidFromRing(ring) {
  let twiceArea = 0, x = 0, y = 0;
  for (let i = 0, l = ring.length - 1; i < l; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const f = x1 * y2 - x2 * y1;
    twiceArea += f;
    x += (x1 + x2) * f;
    y += (y1 + y2) * f;
  }
  if (twiceArea === 0) {
    const sx = ring.reduce((a, p) => a + p[0], 0) / ring.length;
    const sy = ring.reduce((a, p) => a + p[1], 0) / ring.length;
    return [sx, sy];
  }
  const area = twiceArea * 0.5;
  return [x / (6 * area), y / (6 * area)];
}

module.exports = { centroidFromRing };
