type DrawOpts = {
  indices?: number[];
  showLabels?: boolean;
  pointRadius?: number;
  color?: string;
  mirror?: boolean;
  label?: boolean;
  size?: number;
};

export function drawFacePoints(canvas: HTMLCanvasElement, landmarks: Array<{ x: number; y: number }>, opts?: DrawOpts) {
  if (!canvas || !landmarks || !landmarks.length) return;
  const { indices, showLabels = true, pointRadius = 2, color = 'rgba(0,200,255,0.95)', mirror = false, label, size } = opts || {};
  const showLbl = (label === undefined) ? showLabels : label;
  const pr = size || pointRadius;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.clientWidth || canvas.width;
  const ch = canvas.clientHeight || canvas.height;
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.scale(dpr, dpr);
  }


  ctx.clearRect(0, 0, canvas.clientWidth || canvas.width, canvas.clientHeight || canvas.height);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const pick = indices && indices.length ? indices : [
    10, 33, 61, 133, 152, 263, 291, 362, 374, 145, 159, 385, 386, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477,
  ];

  const W = canvas.clientWidth || canvas.width;
  const H = canvas.clientHeight || canvas.height;

  for (let i = 0; i < pick.length; i++) {
    const idx = pick[i];
    const p = landmarks[idx];
    if (!p) continue;
  const x = (mirror ? (1 - p.x) : p.x) * W;
  const y = p.y * H;
    // point
    ctx.beginPath();
  ctx.arc(x, y, pr, 0, Math.PI * 2);
    ctx.fill();
    // label
    if (showLbl) {
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(String(idx), x + 4, y - 4);
      ctx.fillStyle = color;
    }
  }
}

export default drawFacePoints;
