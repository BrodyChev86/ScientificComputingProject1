// Classic Euclidean algorithm. Returns 1 for gcd(0,0) so callers can divide safely.
export function gcd(a, b) {
  a = Math.abs(Math.trunc(a));
  b = Math.abs(Math.trunc(b));
  while (b !== 0) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}
