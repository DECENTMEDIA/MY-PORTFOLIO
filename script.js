const canvas = document.querySelector("#circuitCanvas");
const ctx = canvas.getContext("2d");
const profileUpload = document.querySelector("#profileUpload");
const profilePreview = document.querySelector("#profilePreview");
const profileFrame = document.querySelector(".profile-photo-frame");
const profileSlug = document.querySelector("#profileSlug");
const slugPreview = document.querySelector("#slugPreview");

const colors = {
  trace: "rgba(142, 229, 210, 0.28)",
  glow: "rgba(142, 229, 210, 0.95)",
  node: "rgba(255, 255, 255, 0.78)",
  chip: "rgba(255, 255, 255, 0.1)",
  chipLine: "rgba(255, 255, 255, 0.24)",
};

let width = 0;
let height = 0;
let scale = 1;

const traces = [
  [[0.1, 0.18], [0.28, 0.18], [0.28, 0.38], [0.48, 0.38]],
  [[0.12, 0.72], [0.32, 0.72], [0.32, 0.58], [0.5, 0.58]],
  [[0.52, 0.2], [0.68, 0.2], [0.68, 0.46], [0.88, 0.46]],
  [[0.48, 0.74], [0.62, 0.74], [0.62, 0.58], [0.86, 0.58]],
  [[0.18, 0.45], [0.36, 0.45], [0.36, 0.28], [0.48, 0.28]],
  [[0.54, 0.48], [0.7, 0.48], [0.7, 0.82], [0.84, 0.82]],
];

const chips = [
  { x: 0.42, y: 0.36, w: 0.2, h: 0.22, label: "STM32" },
  { x: 0.2, y: 0.52, w: 0.17, h: 0.14, label: "I2C" },
  { x: 0.65, y: 0.26, w: 0.16, h: 0.13, label: "UART" },
  { x: 0.63, y: 0.62, w: 0.2, h: 0.14, label: "MQTT" },
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

function point(pair) {
  return [pair[0] * width, pair[1] * height];
}

function drawTrace(trace, phase) {
  ctx.beginPath();
  trace.forEach((pair, index) => {
    const [x, y] = point(pair);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = colors.trace;
  ctx.lineWidth = 3;
  ctx.stroke();

  const segment = (phase % 1) * (trace.length - 1);
  const startIndex = Math.floor(segment);
  const nextIndex = Math.min(startIndex + 1, trace.length - 1);
  const local = segment - startIndex;
  const [x1, y1] = point(trace[startIndex]);
  const [x2, y2] = point(trace[nextIndex]);
  const x = x1 + (x2 - x1) * local;
  const y = y1 + (y2 - y1) * local;

  ctx.beginPath();
  ctx.arc(x, y, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = colors.glow;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 22;
  ctx.fill();
  ctx.shadowBlur = 0;

  trace.forEach((pair) => {
    const [nx, ny] = point(pair);
    ctx.beginPath();
    ctx.arc(nx, ny, 4, 0, Math.PI * 2);
    ctx.fillStyle = colors.node;
    ctx.fill();
  });
}

function drawChip(chip) {
  const x = chip.x * width;
  const y = chip.y * height;
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

  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  ctx.font = "700 13px JetBrains Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(chip.label, x + w / 2, y + h / 2);

  const pinCount = 6;
  ctx.strokeStyle = "rgba(142, 229, 210, 0.42)";
  ctx.lineWidth = 2;
  for (let i = 1; i < pinCount; i += 1) {
    const py = y + (h / pinCount) * i;
    ctx.beginPath();
    ctx.moveTo(x - 10, py);
    ctx.lineTo(x, py);
    ctx.moveTo(x + w, py);
    ctx.lineTo(x + w + 10, py);
    ctx.stroke();
  }
}

function render(time) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
  for (let x = 0; x < width; x += 36) {
    for (let y = 0; y < height; y += 36) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  traces.forEach((trace, index) => drawTrace(trace, time / 3200 + index * 0.14));
  chips.forEach(drawChip);
  requestAnimationFrame(render);
}

if ("ResizeObserver" in window) {
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
} else {
  window.addEventListener("resize", resize);
}

resize();
requestAnimationFrame(render);

const savedPhoto = localStorage.getItem("decentProfilePhoto");
const hashSlug = window.location.hash.startsWith("#/")
  ? window.location.hash.replace("#/", "")
  : "";
const savedSlug = hashSlug || localStorage.getItem("decentProfileSlug");

function updateProfilePhoto(source) {
  if (!source) return;
  profilePreview.src = source;
  profileFrame.classList.add("has-image");
}

function normalizeSlug(value) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "decent";
}

function updateSlug(value) {
  const slug = normalizeSlug(value);
  profileSlug.value = slug;
  slugPreview.textContent = slug;
  localStorage.setItem("decentProfileSlug", slug);
  history.replaceState(null, "", `#/${slug}`);
}

updateProfilePhoto(savedPhoto);
if (savedSlug) updateSlug(savedSlug);

profileUpload.addEventListener("change", () => {
  const [file] = profileUpload.files;
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const imageUrl = reader.result;
    updateProfilePhoto(imageUrl);
    localStorage.setItem("decentProfilePhoto", imageUrl);
  });
  reader.readAsDataURL(file);
});

profileSlug.addEventListener("input", () => {
  slugPreview.textContent = normalizeSlug(profileSlug.value);
});

profileSlug.addEventListener("blur", () => {
  updateSlug(profileSlug.value);
});
