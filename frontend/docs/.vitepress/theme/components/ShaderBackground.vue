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
const centerUniform = ref<[number, number]>([0.7, 0.65]);

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

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    float aspect = u_resolution.x / u_resolution.y;
    vec2 uvAspect = vec2(uv.x * aspect, uv.y);

    float sf = clamp(u_resolution.x / 1400.0, 0.5, 0.92);

    // --- BLOB A (blue) ---
    vec2 centerA = vec2(u_centerA.x * aspect, u_centerA.y);
    float distA = distance(uvAspect, centerA);
    float breathA = sin(u_time * 1.1) * 0.5 + 0.1;
    float radiusA = 0.001 + breathA * 0.04;
    float glowA = smoothstep(radiusA + 0.45 * sf, radiusA, distA) * (0.35 + breathA * 0.15);

    // --- BLOB B (teal) ---
    vec2 centerB = vec2(u_centerB.x * aspect, u_centerB.y);
    float distB = distance(uvAspect, centerB);
    float drift = sin(u_time * 0.26) * 3.14159;
    float basePulse = sin(u_time * 1.1 + drift);
    float microPulse = sin(u_time * 3.2) * 0.15;
    float breathB = (basePulse + microPulse) * 0.3 + 0.15;
    float radiusB = 0.001 + breathB * 0.03;
    float glowB = smoothstep(radiusB + 0.38 * sf, radiusB, distB) * (0.3 + breathB * 0.12);

    float innerGlow = smoothstep(0.10 * sf, 0.0, distA) * (0.15 + breathA * 0.08);

    float bgLuma = dot(u_bgColor, vec3(0.299, 0.587, 0.114));
    float lightMode = step(0.5, bgLuma);

    vec3 activeBlue = mix(vec3(0.1, 0.5, 0.95), vec3(0.0, 0.35, 0.82), lightMode);
    vec3 activeTeal = mix(vec3(0.05, 0.9, 0.8), vec3(0.0, 0.58, 0.55), lightMode);

    vec3 blobColor = (activeBlue * glowA) + (activeTeal * glowB) + (activeTeal * innerGlow);

    vec3 color;
    if (lightMode > 0.5) {
        float alpha = clamp((glowA + glowB + innerGlow) * 1.5, 0.0, 1.0);
        color = mix(u_bgColor, blobColor * 1.6, alpha);
    } else {
        color = u_bgColor + blobColor * 1.15;
    }

    // --- VIGNETTE ---
    float vignette = 1.0 - smoothstep(0.5, 1.0, distance(uv, vec2(0.5, 0.5)) * 1.2);
    color *= mix(0.9, 1.0, vignette);

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
