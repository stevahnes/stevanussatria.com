<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";

// ─────────────────────────────────────────────
//  Shader catalogue
// ─────────────────────────────────────────────

const SHADERS = [
  {
    id: "aurora",
    label: "Aurora",
    icon: "✦",
  },
  {
    id: "velodrome",
    label: "Velodrome",
    icon: "◎",
  },
  {
    id: "keys",
    label: "Keys",
    icon: "♩",
  },
  {
    id: "signal",
    label: "Signal",
    icon: "⟁",
  },
  {
    id: "topology",
    label: "Topology",
    icon: "⬡",
  },
] as const;

type ShaderId = (typeof SHADERS)[number]["id"];

// ─────────────────────────────────────────────
//  Shared vertex shader (full-screen quad)
// ─────────────────────────────────────────────

const VERT = `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

// ─────────────────────────────────────────────
//  1. AURORA  (original – kept intact)
// ─────────────────────────────────────────────

const FRAG_AURORA = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_bgColor;
  uniform vec2 u_centerA;
  uniform vec2 u_centerB;

  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec2 mod289v2(vec2 x){return x-floor(x*(1./289.))*289.;}
  vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
  float snoise(vec2 v){
    const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
    vec2 i=floor(v+dot(v,C.yy));
    vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
    vec4 x12=x0.xyxy+C.xxzz;
    x12.xy-=i1;
    i=mod289v2(i);
    vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
    vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
    m=m*m; m=m*m;
    vec3 x_=2.*fract(p*C.www)-1.;
    vec3 h=abs(x_)-.5;
    vec3 ox=floor(x_+.5);
    vec3 a0=x_-ox;
    m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x=a0.x*x0.x+h.x*x0.y;
    g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.*dot(m,g);
  }
  float fbm(vec2 p){
    float v=0.,a=.5,f=1.;
    for(int i=0;i<4;i++){v+=a*snoise(p*f);f*=2.;a*=.5;}
    return v;
  }
  void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    float aspect=u_resolution.x/u_resolution.y;
    vec2 ua=vec2(uv.x*aspect,uv.y);
    float t=u_time*.08;
    vec2 focal=vec2(u_centerA.x*aspect,u_centerA.y);
    vec2 q=vec2(fbm(ua*1.8+t*.6),fbm(ua*1.8+vec2(5.2,1.3)+t*.5));
    vec2 r=vec2(fbm(ua*1.8+q*3.2+vec2(1.7,9.2)+t*.4),fbm(ua*1.8+q*2.8+vec2(8.3,2.8)+t*.35));
    float pattern=fbm(ua*1.5+r*1.8+t*.3);
    float fd=distance(ua,focal);
    float fi=smoothstep(.7,0.,fd);
    vec2 focalB=vec2(u_centerB.x*aspect,u_centerB.y);
    float fib=smoothstep(.6,0.,distance(ua,focalB));
    float isStacked=smoothstep(960.,860.,u_resolution.x);
    float hGuard=smoothstep(.25,.55,uv.x);
    float vGuard=smoothstep(.55,.85,uv.y);
    float textGuard=mix(hGuard,vGuard,isStacked);
    float bgLuma=dot(u_bgColor,vec3(.299,.587,.114));
    float lm=step(.5,bgLuma);
    vec3 deepBlue=mix(vec3(.02,.20,.55),vec3(0.,.30,.70),lm);
    vec3 brightBlue=mix(vec3(.10,.50,.95),vec3(0.,.40,.85),lm);
    vec3 teal=mix(vec3(0.,.75,.70),vec3(0.,.55,.50),lm);
    vec3 cyan=mix(vec3(.05,.85,.90),vec3(0.,.60,.65),lm);
    float n1=smoothstep(-.4,.8,pattern);
    float n2=smoothstep(-.2,1.,pattern+q.x*.5);
    float n3=smoothstep(0.,.8,r.x+r.y);
    vec3 auroraColor=mix(deepBlue,brightBlue,n1);
    auroraColor=mix(auroraColor,teal,n2*.6);
    auroraColor=mix(auroraColor,cyan,n3*.3);
    float intensity=(fi*.65+fib*.45)*(0.5+0.5*smoothstep(-.5,.5,pattern))*textGuard;
    intensity=clamp(intensity,0.,1.);
    float tendrils=smoothstep(-.2,.6,pattern)*.12*smoothstep(.9,.2,fd)*textGuard;
    float totalAlpha=clamp(intensity+tendrils,0.,1.);
    vec3 color;
    if(lm>.5){color=mix(u_bgColor,auroraColor*1.4,totalAlpha*.5);}
    else{color=u_bgColor+auroraColor*totalAlpha*.95;}
    float vignette=1.-smoothstep(.5,1.,distance(uv,vec2(.5,.5))*1.2);
    color*=mix(.88,1.,vignette);
    gl_FragColor=vec4(color,1.);
  }
`;

// ─────────────────────────────────────────────
//  2. VELODROME  — concentric speed rings
//  Inspired by cycling: motion blur, pace lines,
//  the tunnel-vision of a fast descent.
// ─────────────────────────────────────────────

const FRAG_VELODROME = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_bgColor;
  uniform vec2 u_centerA;
  uniform vec2 u_centerB;

  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
               mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
  }

  void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    float aspect=u_resolution.x/u_resolution.y;
    vec2 ua=vec2(uv.x*aspect,uv.y);

    // focal: hero image centre
    vec2 focal=vec2(u_centerA.x*aspect,u_centerA.y);
    vec2 delta=ua-focal;
    float dist=length(delta);
    float angle=atan(delta.y,delta.x);

    float t=u_time*.35;

    // speed rings radiate outward from focal
    float ring=fract(dist*4.5-t*1.4);
    float ringGlow=pow(smoothstep(1.,0.,ring)*.85+smoothstep(0.,.15,ring)*.15,2.2);

    // angular spokes – like a spinning wheel
    float spoke=abs(sin(angle*12.+t*2.2))*.3;

    // motion-blur streaks: radial noise warped by time
    float streak=noise(vec2(angle*3.+t*.5, dist*6.-t));
    streak=smoothstep(.45,.75,streak)*.5;

    // text / layout guard (same logic as original)
    float isStacked=smoothstep(960.,860.,u_resolution.x);
    float hGuard=smoothstep(.2,.5,uv.x);
    float vGuard=smoothstep(.52,.82,uv.y);
    float guard=mix(hGuard,vGuard,isStacked);

    float bgLuma=dot(u_bgColor,vec3(.299,.587,.114));
    float lm=step(.5,bgLuma);

    // palette: brand deep-blue → mid-blue → teal  (#0066b2 → #3387cc → #00c2a8)
    // light-mode values are deeper so they read against near-white bg
    vec3 rimColor   =mix(vec3(.0,.25,.44),vec3(.0,.20,.50),lm);
    vec3 midColor   =mix(vec3(.0,.40,.70),vec3(.0,.35,.72),lm);
    vec3 coreColor  =mix(vec3(.0,.76,.66),vec3(.0,.58,.52),lm);

    float focalFade=smoothstep(.75,.0,dist);
    float combined=(ringGlow*.6+spoke*.25+streak*.15)*focalFade*guard;
    combined=clamp(combined,0.,1.);

    vec3 c=mix(rimColor,midColor,ringGlow);
    c=mix(c,coreColor,pow(focalFade,3.)*.6);

    vec3 color;
    if(lm>.5){color=mix(u_bgColor,c*1.3,combined*.55);}
    else{color=u_bgColor+c*combined*.9;}

    float vignette=1.-smoothstep(.4,.9,distance(uv,vec2(.5,.5))*1.3);
    color*=mix(.82,1.,vignette);
    gl_FragColor=vec4(color,1.);
  }
`;

// ─────────────────────────────────────────────
//  3. KEYS  — piano waveform / interference
//  Soft standing waves reminiscent of piano
//  harmonics and the sustain pedal's bloom.
// ─────────────────────────────────────────────

const FRAG_KEYS = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_bgColor;
  uniform vec2 u_centerA;
  uniform vec2 u_centerB;

  void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    float aspect=u_resolution.x/u_resolution.y;
    vec2 ua=vec2(uv.x*aspect,uv.y);

    vec2 focal=vec2(u_centerA.x*aspect,u_centerA.y);
    float dist=distance(ua,focal);
    float t=u_time*.18;

    // standing harmonic waves — piano overtone series (1,2,3,5,8 ratio)
    float w1=sin(dist*18.-t*3.1)*sin(ua.x*6.+t*.7);
    float w2=sin(dist*36.-t*6.0)*sin(ua.y*4.5+t*.4)*.6;
    float w3=sin(dist*54.-t*9.2)*sin((ua.x+ua.y)*3.+t*.5)*.35;
    float w4=sin(dist*90.-t*14.)*sin(ua.x*8.-ua.y*3.+t*.9)*.2;
    float wave=(w1+w2+w3+w4)*0.45+0.5;

    // envelope: tightest around focal, fading like sustain pedal
    float env=smoothstep(.85,.0,dist)*smoothstep(.0,.1,dist);

    // text guard
    float isStacked=smoothstep(960.,860.,u_resolution.x);
    float hGuard=smoothstep(.22,.52,uv.x);
    float vGuard=smoothstep(.54,.84,uv.y);
    float guard=mix(hGuard,vGuard,isStacked);

    float bgLuma=dot(u_bgColor,vec3(.299,.587,.114));
    float lm=step(.5,bgLuma);

    // palette: deep blue → brand blue → teal highlight (#0066b2 family)
    // light-mode: keep hues saturated, prevent wash-out against white bg
    vec3 deep  =mix(vec3(.0,.18,.42),vec3(.0,.15,.48),lm);
    vec3 mid   =mix(vec3(.0,.40,.70),vec3(.0,.32,.70),lm);
    vec3 bright=mix(vec3(.44,.84,.90),vec3(.0,.62,.82),lm);
    vec3 teal  =mix(vec3(.0,.76,.66),vec3(.0,.55,.50),lm);

    float n=clamp(wave,0.,1.);
    vec3 c=mix(deep,mid,n);
    c=mix(c,bright,pow(n,3.)*.7);
    c=mix(c,teal,smoothstep(.75,.95,wave)*env*.5);

    float intensity=env*(.4+.6*abs(w1))*.85*guard;
    intensity=clamp(intensity,0.,1.);

    vec3 color;
    if(lm>.5){color=mix(u_bgColor,c*1.35,intensity*.5);}
    else{color=u_bgColor+c*intensity*.9;}

    float vignette=1.-smoothstep(.45,.95,distance(uv,vec2(.5,.5))*1.25);
    color*=mix(.84,1.,vignette);
    gl_FragColor=vec4(color,1.);
  }
`;

// ─────────────────────────────────────────────
//  4. SIGNAL  — data / connectivity mesh
//  Clean hexagonal Voronoi cells with drifting
//  edges — a nod to platform infrastructure,
//  APIs, and payment networks.
// ─────────────────────────────────────────────

const FRAG_SIGNAL = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_bgColor;
  uniform vec2 u_centerA;
  uniform vec2 u_centerB;

  vec2 hash2(vec2 p){
    p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
    return fract(sin(p)*43758.5453);
  }

  // Voronoi returning edge distance
  float voronoi(vec2 p, float t){
    vec2 i=floor(p), f=fract(p);
    float minD1=8., minD2=8.;
    for(int y=-2;y<=2;y++) for(int x=-2;x<=2;x++){
      vec2 g=vec2(float(x),float(y));
      vec2 o=hash2(i+g);
      o=.5+.45*sin(t*.4+6.2831*o);
      vec2 r=g+o-f;
      float d=dot(r,r);
      if(d<minD1){minD2=minD1;minD1=d;}
      else if(d<minD2){minD2=d;}
    }
    return sqrt(minD2)-sqrt(minD1); // edge distance
  }

  void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    float aspect=u_resolution.x/u_resolution.y;
    vec2 ua=vec2(uv.x*aspect,uv.y);

    vec2 focal=vec2(u_centerA.x*aspect,u_centerA.y);
    float dist=distance(ua,focal);
    float t=u_time;

    float zoom=mix(4.5,6.5,smoothstep(0.,.8,dist));
    float edge=voronoi(ua*zoom,t);
    // map edge to thin bright lines
    float line=smoothstep(.06,.0,edge);
    float glow=smoothstep(.18,.0,edge)*.35;

    // pulse along edges from focal
    float pulse=sin(dist*22.-t*2.8)*.5+.5;
    float signal=line*(.5+.5*pulse)+glow;

    // fade into focal point (data converges)
    float env=smoothstep(.8,.05,dist);

    // text guard
    float isStacked=smoothstep(960.,860.,u_resolution.x);
    float hGuard=smoothstep(.2,.5,uv.x);
    float vGuard=smoothstep(.52,.82,uv.y);
    float guard=mix(hGuard,vGuard,isStacked);

    float bgLuma=dot(u_bgColor,vec3(.299,.587,.114));
    float lm=step(.5,bgLuma);

    vec3 edgeColor=mix(vec3(.0,.32,.56),vec3(.0,.28,.62),lm);
    vec3 nodeColor=mix(vec3(.0,.53,.80),vec3(.0,.42,.78),lm);
    vec3 pulseColor=mix(vec3(.44,.90,.84),vec3(.0,.65,.60),lm);

    float n=clamp(signal,0.,1.);
    vec3 c=mix(edgeColor,nodeColor,line);
    c=mix(c,pulseColor,pulse*line*.6);

    float intensity=n*env*guard;
    intensity=clamp(intensity,0.,1.);

    vec3 color;
    if(lm>.5){color=mix(u_bgColor,c*1.5,intensity*.68);}
    else{color=u_bgColor+c*intensity*.85;}

    float vignette=1.-smoothstep(.4,.9,distance(uv,vec2(.5,.5))*1.3);
    color*=mix(.83,1.,vignette);
    gl_FragColor=vec4(color,1.);
  }
`;

// ─────────────────────────────────────────────
//  5. TOPOLOGY  — elevation contour map
//  Layered contour lines like a cycling route
//  elevation profile or a UX flow diagram.
// ─────────────────────────────────────────────

const FRAG_TOPOLOGY = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_bgColor;
  uniform vec2 u_centerA;
  uniform vec2 u_centerB;

  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec2 mod289v2(vec2 x){return x-floor(x*(1./289.))*289.;}
  vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
  float snoise(vec2 v){
    const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
    vec2 i=floor(v+dot(v,C.yy));
    vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
    vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
    i=mod289v2(i);
    vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
    vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
    m=m*m;m=m*m;
    vec3 x_=2.*fract(p*C.www)-1.;
    vec3 h=abs(x_)-.5;
    vec3 ox=floor(x_+.5);
    vec3 a0=x_-ox;
    m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
    vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.*dot(m,g);
  }
  float fbm(vec2 p){
    float v=0.,a=.5,f=1.;
    for(int i=0;i<4;i++){v+=a*snoise(p*f);f*=2.;a*=.5;}
    return v;
  }

  // Sharp contour line at elevation bands
  float contour(float h, float band, float width){
    float f=fract(h*band);
    return smoothstep(width,0.,min(f,1.-f));
  }

  void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    float aspect=u_resolution.x/u_resolution.y;
    vec2 ua=vec2(uv.x*aspect,uv.y);

    vec2 focal=vec2(u_centerA.x*aspect,u_centerA.y);
    float dist=distance(ua,focal);
    float t=u_time*.05;

    // elevation field centred on focal
    float elevation=fbm(ua*2.2+t*.4+vec2(focal.x*2.,focal.y*2.));
    elevation=(elevation*.5+.5); // 0..1

    // multi-band contours (major + minor)
    float major=contour(elevation, 6., .015);
    float minor=contour(elevation,18., .008)*.45;
    float line=clamp(major+minor,0.,1.);

    // hillshade — faux lighting from top-right
    float ex=snoise(ua*2.2+vec2(.01,0.)+t*.4);
    float ey=snoise(ua*2.2+vec2(0.,.01)+t*.4);
    float shade=dot(normalize(vec3(ex-elevation,ey-elevation,.3)),normalize(vec3(1.,1.,2.)))*.5+.5;

    float env=smoothstep(.85,.0,dist);

    float isStacked=smoothstep(960.,860.,u_resolution.x);
    float hGuard=smoothstep(.22,.52,uv.x);
    float vGuard=smoothstep(.54,.84,uv.y);
    float guard=mix(hGuard,vGuard,isStacked);

    float bgLuma=dot(u_bgColor,vec3(.299,.587,.114));
    float lm=step(.5,bgLuma);

    // palette: brand navy → mid-blue → teal (#0066b2 → #00c2a8)
    // light mode: much deeper so contour lines are clearly legible on white
    vec3 lowColor  =mix(vec3(.0,.15,.38),vec3(.0,.15,.50),lm);
    vec3 midColor  =mix(vec3(.0,.35,.65),vec3(.0,.30,.68),lm);
    vec3 highColor =mix(vec3(.0,.65,.72),vec3(.0,.50,.60),lm);
    vec3 lineColor =mix(vec3(.44,.90,.84),vec3(.0,.50,.70),lm);

    vec3 terrain=mix(lowColor,midColor,elevation);
    terrain=mix(terrain,highColor,smoothstep(.55,.85,elevation));
    terrain*=mix(.7,1.1,shade);

    vec3 c=mix(terrain,lineColor,line);

    float intensity=(shade*.3+line*.7)*env*guard;
    intensity=clamp(intensity*.9,0.,1.);

    vec3 color;
    if(lm>.5){color=mix(u_bgColor,c*1.5,intensity*.65);}
    else{color=u_bgColor+c*intensity*.88;}

    float vignette=1.-smoothstep(.45,.95,distance(uv,vec2(.5,.5))*1.25);
    color*=mix(.85,1.,vignette);
    gl_FragColor=vec4(color,1.);
  }
`;

const FRAG_MAP: Record<ShaderId, string> = {
  aurora: FRAG_AURORA,
  velodrome: FRAG_VELODROME,
  keys: FRAG_KEYS,
  signal: FRAG_SIGNAL,
  topology: FRAG_TOPOLOGY,
};

// ─────────────────────────────────────────────
//  Component state
// ─────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isMounted = ref(false);
const showPicker = ref(false);

// Pick a random shader once per hard page load, persist through SPA navigation.
// sessionStorage survives Vue-router pushes but is cleared on a true reload —
// exactly the behaviour we want (random on refresh, stable while browsing).
function pickInitialShader(): ShaderId {
  const stored = sessionStorage.getItem("activeShader") as ShaderId | null;
  if (stored && stored in FRAG_MAP) return stored;
  const ids = SHADERS.map(s => s.id);
  const picked = ids[Math.floor(Math.random() * ids.length)];
  sessionStorage.setItem("activeShader", picked);
  return picked;
}

const activeShader = ref<ShaderId>(typeof window !== "undefined" ? pickInitialShader() : "aurora");

let animationId: number;
let gl: WebGLRenderingContext | null = null;
let currentProgram: WebGLProgram | null = null;
let themeObserver: MutationObserver | null = null;
let ro: ResizeObserver | null = null;

const bgColorUniform = ref<[number, number, number]>([0.094, 0.094, 0.102]);
let uniformLocs: {
  res: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  bg: WebGLUniformLocation | null;
  centerA: WebGLUniformLocation | null;
  centerB: WebGLUniformLocation | null;
} = { res: null, time: null, bg: null, centerA: null, centerB: null };

// Cache compiled programs so switching is instant after first compile
const programCache = new Map<ShaderId, WebGLProgram>();

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

function createShader(g: WebGLRenderingContext, type: number, src: string) {
  const s = g.createShader(type)!;
  g.shaderSource(s, src);
  g.compileShader(s);
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) {
    console.error(g.getShaderInfoLog(s));
    g.deleteShader(s);
    return null;
  }
  return s;
}

function buildProgram(g: WebGLRenderingContext, fragSrc: string): WebGLProgram | null {
  const vs = createShader(g, g.VERTEX_SHADER, VERT);
  const fs = createShader(g, g.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return null;
  const prog = g.createProgram()!;
  g.attachShader(prog, vs);
  g.attachShader(prog, fs);
  g.linkProgram(prog);
  if (!g.getProgramParameter(prog, g.LINK_STATUS)) {
    console.error(g.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

function switchShader(id: ShaderId) {
  if (!gl) return;

  // Use cached program if available, otherwise compile now
  let prog = programCache.get(id) ?? null;
  if (!prog) {
    prog = buildProgram(gl, FRAG_MAP[id]);
    if (!prog) return;
    programCache.set(id, prog);
  }

  currentProgram = prog;
  gl.useProgram(prog);

  const posLoc = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  uniformLocs = {
    res: gl.getUniformLocation(prog, "u_resolution"),
    time: gl.getUniformLocation(prog, "u_time"),
    bg: gl.getUniformLocation(prog, "u_bgColor"),
    centerA: gl.getUniformLocation(prog, "u_centerA"),
    centerB: gl.getUniformLocation(prog, "u_centerB"),
  };

  activeShader.value = id;
  showPicker.value = false;
  sessionStorage.setItem("activeShader", id);
}

watch(activeShader, id => switchShader(id));

// Pre-compile remaining shaders during browser idle time so switching feels instant.
// Uses requestIdleCallback so it never competes with the initial render or user input.
function precompileOthers(active: ShaderId) {
  const rest = SHADERS.map(s => s.id).filter(id => id !== active);
  let i = 0;
  const step = (deadline: IdleDeadline) => {
    while (i < rest.length && deadline.timeRemaining() > 4) {
      const id = rest[i++];
      if (gl && !programCache.has(id)) {
        const prog = buildProgram(gl, FRAG_MAP[id]);
        if (prog) programCache.set(id, prog);
      }
    }
    if (i < rest.length) requestIdleCallback(step);
  };
  // Fallback for Safari which lacks requestIdleCallback
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(step, { timeout: 4000 });
  } else {
    setTimeout(
      () =>
        rest.forEach(id => {
          if (gl && !programCache.has(id)) {
            const prog = buildProgram(gl, FRAG_MAP[id]);
            if (prog) programCache.set(id, prog);
          }
        }),
      2000,
    );
  }
}

// ─────────────────────────────────────────────
//  Lifecycle
// ─────────────────────────────────────────────

let startTime = 0;

onMounted(() => {
  if (typeof window === "undefined") return;
  isMounted.value = true;
  bgColorUniform.value = getBgColor();

  themeObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.attributeName === "class") bgColorUniform.value = getBgColor();
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true });

  const initGL = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    gl = canvas.getContext("webgl");
    if (!gl) return;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    switchShader(activeShader.value);
    precompileOthers(activeShader.value);

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

    startTime = performance.now();

    const render = () => {
      if (!gl || !currentProgram) return;
      const t = (performance.now() - startTime) / 1000;
      const [cx, cy] = getHeroImageCenter();
      gl.uniform2f(uniformLocs.centerA, cx + 0.01, cy - 0.1);
      gl.uniform2f(uniformLocs.centerB, cx - 0.01, cy);
      gl.uniform2f(uniformLocs.res, canvas.width, canvas.height);
      gl.uniform1f(uniformLocs.time, t);
      gl.uniform3f(uniformLocs.bg, ...bgColorUniform.value);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    };

    render();
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(initGL, { timeout: 3000 });
  } else {
    setTimeout(initGL, 100);
  }
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

  <!-- Shader picker -->
  <Transition name="fade">
    <div v-if="isMounted" class="shader-picker" :class="{ open: showPicker }">
      <!-- Toggle button -->
      <button
        class="picker-toggle"
        :title="`Current: ${SHADERS.find(s => s.id === activeShader)?.label}`"
        @click="showPicker = !showPicker"
        aria-label="Switch background"
      >
        <span class="toggle-icon">{{ SHADERS.find(s => s.id === activeShader)?.icon }}</span>
        <span class="toggle-chevron" :class="{ rotated: showPicker }">›</span>
      </button>

      <!-- Option list -->
      <Transition name="slide">
        <div v-if="showPicker" class="picker-options">
          <button
            v-for="shader in SHADERS"
            :key="shader.id"
            class="picker-option"
            :class="{ active: activeShader === shader.id }"
            @click="switchShader(shader.id)"
          >
            <span class="option-icon">{{ shader.icon }}</span>
            <span class="option-label">{{ shader.label }}</span>
          </button>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Canvas ──────────────────────────────── */
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

/* ── Picker wrapper ──────────────────────── */
.shader-picker {
  /*
   * Fixed so it escapes .VPHero's overflow:hidden.
   * Sits just below the navbar (~64px) and hugs the
   * content column's right edge like the chat widget.
   */
  position: fixed;
  top: calc(64px + 0.75rem);
  right: max(1rem, calc(50vw - 720px + 1.5rem));
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

/* ── Toggle pill ─────────────────────────── */
.picker-toggle {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.8rem 0.38rem 0.65rem;
  border-radius: 99px;
  /* Glassmorphic — matches site's --glass-bg + --glass-border variables */
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  font-family: inherit;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    transform 0.15s;
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* Light-mode variant */
:root:not(.dark) .picker-toggle {
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(255, 255, 255, 0.7);
  color: rgba(0, 60, 120, 0.85);
  box-shadow:
    0 2px 12px rgba(0, 102, 178, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.picker-toggle:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
}
:root:not(.dark) .picker-toggle:hover {
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(255, 255, 255, 0.9);
}

.toggle-icon {
  font-size: 0.95rem;
  line-height: 1;
}

.toggle-chevron {
  font-size: 1rem;
  line-height: 1;
  display: inline-block;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: rotate(90deg);
  opacity: 0.6;
}
.toggle-chevron.rotated {
  transform: rotate(-90deg);
}

/* ── Options card ────────────────────────── */
.picker-options {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.35rem;
  border-radius: 14px;
  /* Same glass system as navbar / feature cards */
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  min-width: 130px;
}

:root:not(.dark) .picker-options {
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(255, 255, 255, 0.7);
  box-shadow:
    0 8px 32px rgba(0, 102, 178, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

/* ── Option button ───────────────────────── */
.picker-option {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.4rem 0.65rem;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.77rem;
  font-family: inherit;
  letter-spacing: 0.025em;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  width: 100%;
  text-align: left;
}

:root:not(.dark) .picker-option {
  color: rgba(0, 50, 100, 0.6);
}

.picker-option:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
}
:root:not(.dark) .picker-option:hover {
  background: rgba(0, 102, 178, 0.08);
  color: rgba(0, 60, 130, 0.9);
}

.picker-option.active {
  background: rgba(0, 102, 178, 0.3);
  color: rgba(180, 225, 255, 0.95);
}
:root:not(.dark) .picker-option.active {
  background: rgba(0, 102, 178, 0.12);
  color: rgba(0, 60, 140, 0.95);
}

.option-icon {
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
}

.option-label {
  flex: 1;
}

/* ── Transitions ─────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
