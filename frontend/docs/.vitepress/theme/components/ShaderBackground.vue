<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isMounted = ref(false);
let animationId: number;
let gl: WebGLRenderingContext | null = null;
let themeObserver: MutationObserver | null = null;
let ro: ResizeObserver | null = null;

const bgColorUniform = ref<[number, number, number]>([0.094, 0.094, 0.102]);
let bgColorLoc: WebGLUniformLocation | null = null;

function getBgColor(): [number, number, number] {
  const isDark = document.documentElement.classList.contains("dark");
  return isDark ? [0.094, 0.094, 0.102] : [0.99, 0.99, 0.99];
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

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    float aspect = u_resolution.x / u_resolution.y;
    vec2 uvAspect = vec2(uv.x * aspect, uv.y);

    // --- MOBILE DETECTION ---
    // isMobile = 1.0 if screen is portrait (mobile), 0.0 if landscape (desktop)
    float isMobile = step(aspect, 1.0); 

    // --- BLOB A ---
    // If mobile, center is (0.5, 0.5). If desktop, it uses your original coords.
    vec2 desktopCenterA = vec2(0.71 * aspect, 0.65);
    vec2 mobileCenterA  = vec2(0.55 * aspect, 0.65);
    vec2 centerA = mix(desktopCenterA, mobileCenterA, isMobile);

    float distA = distance(uvAspect, centerA);
    float breathA = sin(u_time * 0.8) * 0.5 + 0.1;
    float radiusA = 0.001 + breathA * 0.08;
    float glowA = smoothstep(radiusA + 0.55, radiusA - 0.05, distA) * (0.55 + breathA * 0.25);

    // --- BLOB B ---
    // Offset slightly from center on mobile so they still "interact" 
    vec2 desktopCenterB = vec2(0.66 * aspect, 0.75);
    vec2 mobileCenterB  = vec2(0.45 * aspect, 0.75); 
    vec2 centerB = mix(desktopCenterB, mobileCenterB, isMobile);

    float distB = distance(uvAspect, centerB);
    float basePulse = sin(u_time * 0.8 + 1.5708);
    float microPulse = sin(u_time * 2.1) * 0.2;
    float breathB = (basePulse + microPulse) * 0.4 + 0.2;
    float radiusB = 0.001 + breathB * 0.06;
    float glowB = smoothstep(radiusB + 0.45, radiusB - 0.05, distB) * (0.45 + breathB * 0.20);

    float innerGlow = smoothstep(0.12, 0.0, distA) * (0.3 + breathA * 0.15);

    // --- UPDATED COLORS ---
    // Blue: rgb(0, 102, 178) -> vec3(0.0, 0.4, 0.698)
    // Teal: rgb(0, 194, 168) -> vec3(0.0, 0.76, 0.658)
    vec3 lightBlue = vec3(0.0, 0.4, 0.698);
    vec3 lightTeal = vec3(0.0, 0.76, 0.658);

    // For Dark Mode, we can use slightly more vibrant versions if desired,
    // but here we'll use your exact colors for Light Mode logic.
    float bgLuma = dot(u_bgColor, vec3(0.299, 0.587, 0.114));
    float lightMode = step(0.5, bgLuma);

    // We apply your exact RGB colors here
    vec3 activeBlue = mix(vec3(0.0, 0.45, 0.8), lightBlue, lightMode);
    vec3 activeTeal = mix(vec3(0.0, 0.85, 0.75), lightTeal, lightMode);

    vec3 blobColor = (activeBlue * glowA) + (activeTeal * glowB) + (activeTeal * innerGlow);

    vec3 color;
    if (lightMode > 0.5) {
        // LIGHT MODE: Softly blend your 2 colors over the background
        float alpha = clamp(glowA + glowB + innerGlow, 0.0, 1.0);
        color = mix(u_bgColor, blobColor, alpha);
    } else {
        // DARK MODE: Additive glow
        color = u_bgColor + blobColor;
    }

    // --- VIGNETTE ---
    float vignette = 1.0 - smoothstep(0.5, 1.0, distance(uv, vec2(0.5, 0.5)) * 1.2);
    color *= mix(0.85, 1.0, vignette);

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
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.uniform1f(timeLoc, t);
    gl.uniform3f(bgColorLoc, ...bgColorUniform.value);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animationId = requestAnimationFrame(render);
  };

  render();
});

// Top-level — this is the fix. onUnmounted must NOT be nested inside onMounted.
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
