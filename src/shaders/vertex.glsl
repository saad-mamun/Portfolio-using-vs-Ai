uniform float uTime;
uniform float uScrollProgress;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vNoise;

vec3 mod289(vec3 value) {
  return value - floor(value * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 value) {
  return value - floor(value * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 value) {
  return mod289(((value * 34.0) + 1.0) * value);
}

vec4 taylorInvSqrt(vec4 value) {
  return 1.79284291400159 - 0.85373472095314 * value;
}

float snoise(vec3 value) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 cell = floor(value + dot(value, C.yyy));
  vec3 x0 = value - cell + dot(cell, C.xxx);
  vec3 stepOrder = step(x0.yzx, x0.xyz);
  vec3 inverseStepOrder = 1.0 - stepOrder;
  vec3 i1 = min(stepOrder.xyz, inverseStepOrder.zxy);
  vec3 i2 = max(stepOrder.xyz, inverseStepOrder.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  cell = mod289(cell);
  vec4 permutation = permute(
    permute(
      permute(cell.z + vec4(0.0, i1.z, i2.z, 1.0))
      + cell.y + vec4(0.0, i1.y, i2.y, 1.0)
    )
    + cell.x + vec4(0.0, i1.x, i2.x, 1.0)
  );

  float n = 1.0 / 7.0;
  vec3 ns = n * D.wyz - D.xzx;

  vec4 j = permutation - 49.0 * floor(permutation * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 g0 = vec3(a0.xy, h.x);
  vec3 g1 = vec3(a0.zw, h.y);
  vec3 g2 = vec3(a1.xy, h.z);
  vec3 g3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(
    dot(g0, g0), dot(g1, g1), dot(g2, g2), dot(g3, g3)
  ));
  g0 *= norm.x;
  g1 *= norm.y;
  g2 *= norm.z;
  g3 *= norm.w;

  vec4 attenuation = max(0.6 - vec4(
    dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)
  ), 0.0);
  attenuation *= attenuation;

  return 42.0 * dot(
    attenuation * attenuation,
    vec4(dot(g0, x0), dot(g1, x1), dot(g2, x2), dot(g3, x3))
  );
}

void main() {
  float slowTime = uTime * 0.14;
  float broadNoise = snoise(normal * 1.35 + vec3(slowTime, -slowTime * 0.7, slowTime * 0.55));
  float detailNoise = snoise(position * 2.2 + vec3(-slowTime * 0.45, slowTime, uScrollProgress * 2.0));
  float displacement = broadNoise * 0.17 + detailNoise * 0.055;
  vec3 displacedPosition = position + normal * displacement;

  vec4 viewPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewPosition = -viewPosition.xyz;
  vNoise = broadNoise * 0.5 + 0.5;
  gl_Position = projectionMatrix * viewPosition;
}
