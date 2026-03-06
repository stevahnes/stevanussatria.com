<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isMounted = ref(false);
let animationId: number;
let gl: WebGLRenderingContext | null = null;
let themeObserver: MutationObserver | null = null;
let ro: ResizeObserver | null = null;

let centerALoc: WebGLUniformLocation | null = null;
let centerBLoc: WebGLUniformLocation | null = null;

const bgColorUniform = ref<[number, number, number]>([0.094, 0.094, 0.102]);
let bgColorLoc: WebGLUniformLocation | null = null;

function getBgColor(): [number, number, number] {
  const isDark = document.documentElement.classList.contains("dark");
  return isDark ? [0.094, 0.094, 0.102] : [0.99, 0.99, 0.99];
}

function getHeroImageCenter(): [number, number] {
  const img = document.querySelector(".VPHero .image-container") as HTMLElement;
  const canvas = canvasRef.value;
  if (!img || !canvas) return [0.7, 0.65];

  const imgRect = img.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();

  const x = (imgRect.left + imgRect.width / 2 - canvasRect.left) / canvasRect.width;
  const y = 1.0 - (imgRect.top + imgRect.height / 2 - canvasRect.top) / canvasRect.height;

  return [x, y];
}

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_bgColor;
  uniform vec2 u_centerA;
  uniform vec2 u_centerB;

  // Hash-based pseudo-random for noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,   // (3.0-sqrt(3.0))/6.0
      0.366025403784439,   // 0.5*(sqrt(3.0)-1.0)
     -0.577350269189626,   // -1.0 + 2.0 * C.x
      0.024390243902439    // 1.0 / 41.0
    );

    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289v2(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;

    vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x_) - 0.5;
    vec3 ox = floor(x_ + 0.5);
    vec3 a0 = x_ - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;

    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
      value += amp * snoise(p * freq);
      freq *= 2.0;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uvAspect = vec2(uv.x * aspect, uv.y);

    float t = u_time * 0.08;

    // Focal point from hero image position
    vec2 focal = vec2(u_centerA.x * aspect, u_centerA.y);

    // Domain warping: feed noise into itself for organic fluid motion
    vec2 q = vec2(
      fbm(uvAspect * 1.8 + vec2(0.0, 0.0) + t * 0.6),
      fbm(uvAspect * 1.8 + vec2(5.2, 1.3) + t * 0.5)
    );

    vec2 r = vec2(
      fbm(uvAspect * 1.8 + q * 3.2 + vec2(1.7, 9.2) + t * 0.4),
      fbm(uvAspect * 1.8 + q * 2.8 + vec2(8.3, 2.8) + t * 0.35)
    );

    float pattern = fbm(uvAspect * 1.5 + r * 1.8 + t * 0.3);

    // Distance from focal point (aurora concentrates tightly around hero image)
    float focalDist = distance(uvAspect, focal);
    float focalInfluence = smoothstep(0.7, 0.0, focalDist);

    // Secondary focal point
    vec2 focalB = vec2(u_centerB.x * aspect, u_centerB.y);
    float focalDistB = distance(uvAspect, focalB);
    float focalInfluenceB = smoothstep(0.6, 0.0, focalDistB);

    // Responsive text guard:
    // Desktop (wide): suppress left side where text sits beside the image.
    // Mobile  (tall): suppress lower 2/3 where text sits below the image.
    // Blend between the two based on aspect ratio.
    float isMobile = smoothstep(1.0, 0.7, aspect);
    float hGuard = smoothstep(0.25, 0.55, uv.x);
    float vGuard = smoothstep(0.55, 0.85, uv.y);
    float textGuard = mix(hGuard, vGuard, isMobile);

    // Light/dark mode detection
    float bgLuma = dot(u_bgColor, vec3(0.299, 0.587, 0.114));
    float lightMode = step(0.5, bgLuma);

    // Color palette - blue and teal brand colors, richer in dark mode
    vec3 deepBlue  = mix(vec3(0.02, 0.20, 0.55), vec3(0.0, 0.30, 0.70), lightMode);
    vec3 brightBlue = mix(vec3(0.10, 0.50, 0.95), vec3(0.0, 0.40, 0.85), lightMode);
    vec3 teal      = mix(vec3(0.0, 0.75, 0.70), vec3(0.0, 0.55, 0.50), lightMode);
    vec3 cyan      = mix(vec3(0.05, 0.85, 0.90), vec3(0.0, 0.60, 0.65), lightMode);

    // Layer colors using warped noise values
    float n1 = smoothstep(-0.4, 0.8, pattern);
    float n2 = smoothstep(-0.2, 1.0, pattern + q.x * 0.5);
    float n3 = smoothstep(0.0, 0.8, r.x + r.y);

    vec3 auroraColor = mix(deepBlue, brightBlue, n1);
    auroraColor = mix(auroraColor, teal, n2 * 0.6);
    auroraColor = mix(auroraColor, cyan, n3 * 0.3);

    // Combine: concentrate aurora around focal points, apply text guard
    float intensity = (focalInfluence * 0.65 + focalInfluenceB * 0.45) *
                      (0.5 + 0.5 * smoothstep(-0.5, 0.5, pattern)) *
                      textGuard;
    intensity = clamp(intensity, 0.0, 1.0);

    // Subtle glow tendrils, also guarded away from text
    float tendrils = smoothstep(-0.2, 0.6, pattern) * 0.12 *
                     smoothstep(0.9, 0.2, focalDist) * textGuard;

    float totalAlpha = clamp(intensity + tendrils, 0.0, 1.0);

    vec3 color;
    if (lightMode > 0.5) {
      float alpha = totalAlpha * 0.5;
      color = mix(u_bgColor, auroraColor * 1.4, alpha);
    } else {
      color = u_bgColor + auroraColor * totalAlpha * 0.95;
    }

    // Vignette
    float vignette = 1.0 - smoothstep(0.5, 1.0, distance(uv, vec2(0.5, 0.5)) * 1.2);
    color *= mix(0.88, 1.0, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

onMounted(() => {
  if (typeof window === "undefined") return;
  isMounted.value = true;

  bgColorUniform.value = getBgColor();

  themeObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.attributeName === "class") {
        bgColorUniform.value = getBgColor();
      }
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true });

  const canvas = canvasRef.value;
  if (!canvas) return;

  gl = canvas.getContext("webgl");
  if (!gl) return;

  const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vs || !fs) return;

  const program = createProgram(gl, vs, fs);
  if (!program) return;

  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, "a_position");
  const resLoc = gl.getUniformLocation(program, "u_resolution");
  const timeLoc = gl.getUniformLocation(program, "u_time");
  bgColorLoc = gl.getUniformLocation(program, "u_bgColor");

  centerALoc = gl.getUniformLocation(program, "u_centerA");
  centerBLoc = gl.getUniformLocation(program, "u_centerB");

  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);

  ro = new ResizeObserver(() => {
    if (!canvas || !gl) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  });
  ro.observe(canvas);
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);

  const startTime = performance.now();

  const render = () => {
    if (!gl) return;
    const t = (performance.now() - startTime) / 1000;
    const [cx, cy] = getHeroImageCenter();
    gl.uniform2f(centerALoc, cx + 0.01, cy - 0.1);
    gl.uniform2f(centerBLoc, cx - 0.01, cy);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.uniform1f(timeLoc, t);
    gl.uniform3f(bgColorLoc, ...bgColorUniform.value);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animationId = requestAnimationFrame(render);
  };

  render();
});

onUnmounted(() => {
  themeObserver?.disconnect();
  ro?.disconnect();
  cancelAnimationFrame(animationId);
  gl = null;
});
</script>

<template>
  <canvas v-show="isMounted" ref="canvasRef" class="shader-bg" aria-hidden="true" />
</template>

<style scoped>
.shader-bg {
  position: absolute;
  inset: 0;
  bottom: -20px;
  width: 100%;
  height: calc(100% + 20px);
  display: block;
  pointer-events: none;
  z-index: 0;
  -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
}
</style>
