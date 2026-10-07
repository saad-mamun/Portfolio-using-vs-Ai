uniform vec3 uColorBlue;
uniform vec3 uColorViolet;
uniform float uOpacity;
uniform float uScrollProgress;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vNoise;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDirection = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.4);
  float colorShift = clamp(0.3 + vNoise * 0.32 + uScrollProgress * 0.38, 0.0, 1.0);
  vec3 baseColor = mix(uColorBlue, uColorViolet, colorShift);
  vec3 glowColor = mix(uColorViolet, uColorBlue, vNoise * 0.6);
  vec3 color = mix(baseColor * 0.34, glowColor, fresnel * 0.92);
  float alpha = (0.12 + fresnel * 0.62 + vNoise * 0.08) * uOpacity;

  gl_FragColor = vec4(color, alpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
