const canvas = document.querySelector("#circuitCanvas");
const ctx = canvas.getContext("2d");

const colors = {
  grid: "rgba(66, 242, 162, 0.08)",
  trace: "rgba(66, 242, 162, 0.35)",
  glow: "rgba(66, 242, 162, 0.95)",
  cyan: "rgba(56, 216, 197, 0.92)",
  node: "rgba(234, 255, 245, 0.7)",
  chip: "rgba(5, 18, 14, 0.64)",
  chipLine: "rgba(66, 242, 162, 0.28)",
};

let width = 0;
let height = 0;
let scale = 1;
let mouseX = 0;
let mouseY = 0;

const traces = [
  [[0.1, 0.25], [0.28, 0.25], [0.34, 0.42], [0.48, 0.42]],
  [[0.13, 0.72], [0.3, 0.72], [0.38, 0.57], [0.5, 0.57]],
  [[0.52, 0.22], [0.68, 0.22], [0.7, 0.43], [0.88, 0.43]],
  [[0.5, 0.76], [0.62, 0.76], [0.7, 0.6], [0.86, 0.6]],
  [[0.18, 0.48], [0.34, 0.48], [0.42, 0.3], [0.5, 0.3]],
  [[0.54, 0.48], [0.72, 0.48], [0.76, 0.82], [0.86, 0.82]],
];

const chips = [
  { x: 0.41, y: 0.35, w: 0.2, h: 0.2, label: "CORE" },
  { x: 0.19, y: 0.54, w: 0.16, h: 0.13, label: "I2C" },
  { x: 0.65, y: 0.27, w: 0.16, h: 0.12, label: "UART" },
  { x: 0.64, y: 0.63, w: 0.19, h: 0.13, label: "MQTT" },
];

function resize() {
  const rect = canvas.getBoundingClientRect();
  scale = window.devicePixelRatio || 1;
  width = rect.width;
  height = rect.height;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function project(pair, depth = 0) {
  const centerX = width / 2;
  const centerY = height / 2;
  const x = pair[0] * width;
  const y = pair[1] * height;
  const tilt = 0.18;
  const parallaxX = mouseX * depth * 18;
  const parallaxY = mouseY * depth * 12;

  return [
    centerX + (x - centerX) * (1 + depth * 0.04) + parallaxX,
    centerY + (y - centerY) * (1 - tilt + depth * 0.03) + parallaxY,
  ];
}

function drawTrace(trace, phase, index) {
  ctx.beginPath();
  trace.forEach((pair, pointIndex) => {
    const [x, y] = project(pair, 0.35);
    if (pointIndex === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = colors.trace;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const segment = (phase % 1) * (trace.length - 1);
  const startIndex = Math.floor(segment);
  const nextIndex = Math.min(startIndex + 1, trace.length - 1);
  const local = segment - startIndex;
  const [x1, y1] = project(trace[startIndex], 0.55);
  const [x2, y2] = project(trace[nextIndex], 0.55);
  const x = x1 + (x2 - x1) * local;
  const y = y1 + (y2 - y1) * local;

  ctx.beginPath();
  ctx.arc(x, y, 5 + Math.sin(phase * Math.PI * 2 + index) * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = index % 2 ? colors.cyan : colors.glow;
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 22;
  ctx.fill();
  ctx.shadowBlur = 0;

  trace.forEach((pair) => {
    const [nx, ny] = project(pair, 0.25);
    ctx.beginPath();
    ctx.arc(nx, ny, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = colors.node;
    ctx.fill();
  });
}

function drawChip(chip) {
  const [x, y] = project([chip.x, chip.y], 0.3);
  const w = chip.w * width;
  const h = chip.h * height;
  const radius = 8;

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = colors.chip;
  ctx.strokeStyle = colors.chipLine;
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(234, 255, 245, 0.9)";
  ctx.font = "700 13px JetBrains Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(chip.label, x + w / 2, y + h / 2);

  ctx.strokeStyle = "rgba(66, 242, 162, 0.42)";
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i += 1) {
    const py = y + (h / 6) * i;
    ctx.beginPath();
    ctx.moveTo(x - 10, py);
    ctx.lineTo(x, py);
    ctx.moveTo(x + w, py);
    ctx.lineTo(x + w + 10, py);
    ctx.stroke();
  }
}

function drawGrid(time) {
  ctx.save();
  ctx.translate(width / 2 + mouseX * 8, height * 0.56 + mouseY * 5);
  ctx.scale(1.25, 0.58);
  ctx.rotate(-0.02);
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;

  for (let x = -width; x <= width; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, -height);
    ctx.lineTo(x + Math.sin(time / 900 + x) * 8, height);
    ctx.stroke();
  }

  for (let y = -height; y <= height; y += 34) {
    ctx.beginPath();
    ctx.moveTo(-width, y);
    ctx.lineTo(width, y + Math.cos(time / 900 + y) * 8);
    ctx.stroke();
  }

  ctx.restore();
}

function render(time) {
  ctx.clearRect(0, 0, width, height);
  drawGrid(time);
  traces.forEach((trace, index) => drawTrace(trace, time / 3000 + index * 0.13, index));
  chips.forEach(drawChip);
  requestAnimationFrame(render);
}

window.addEventListener("pointermove", (event) => {
  mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
});

if ("ResizeObserver" in window) {
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
} else {
  window.addEventListener("resize", resize);
}

const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  reveals.forEach((item) => revealObserver.observe(item));
} else {
  reveals.forEach((item) => item.classList.add("is-visible"));
}

const profileImage = document.querySelector(".profile-image");
profileImage?.addEventListener("error", () => {
  profileImage.style.display = "none";
});

resize();
requestAnimationFrame(render);
