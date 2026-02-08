import { clamp } from "../utils/math.js";

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = 0;
    this.height = 0;
  }

  resize({ width, height, dpr }) {
    this.width = width;
    this.height = height;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(state) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground(state.layout);
    this.drawGrid(state);
    this.drawAssistant(state);
    this.drawAimLine(state);

    if (state.movingBubble) {
      this.drawBubble(state.movingBubble.x, state.movingBubble.y, state.movingBubble.color, state.layout.radius, false);
    }

    this.drawShooter(state);
  }

  drawBackground(layout) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = "rgba(6, 10, 18, 0.22)";
    ctx.fillRect(0, 0, layout.width, layout.height);
    ctx.restore();
  }

  drawBubble(x, y, color, radius, highlight) {
    const { ctx } = this;

    ctx.save();
    const gradient = ctx.createRadialGradient(
      x - radius * 0.28,
      y - radius * 0.3,
      radius * 0.22,
      x,
      y,
      radius * 1.15,
    );

    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.44, color);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.68)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (highlight) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawGrid(state) {
    const { grid, layout } = state;
    grid.forEachBubble(({ row, col, bubble }) => {
      const world = state.gridToWorld(row, col);
      this.drawBubble(world.x, world.y, bubble.color, layout.radius, false);
    });
  }

  drawShooter(state) {
    const { ctx } = this;
    const { shooter, currentColor, nextColor, layout } = state;

    const baseY = shooter.y + layout.radius * 1.22;

    ctx.save();
    ctx.fillStyle = "rgba(12, 21, 36, 0.8)";
    ctx.beginPath();
    ctx.arc(shooter.x, baseY, layout.radius * 1.86, Math.PI, Math.PI * 2);
    ctx.fill();

    if (currentColor) {
      this.drawBubble(shooter.x, shooter.y, currentColor, layout.radius, false);
    }

    if (nextColor) {
      this.drawBubble(shooter.x + layout.radius * 2.6, shooter.y + layout.radius * 0.6, nextColor, layout.radius * 0.76, false);
    }

    ctx.restore();
  }

  drawAimLine(state) {
    if (!state.aim.active) {
      return;
    }

    const { ctx } = this;
    const { layout, shooter, config } = state;
    const maxLength = layout.height * 0.82;

    let startX = shooter.x;
    let startY = shooter.y;
    let angle = clamp(state.aim.angle, config.minAngle, config.maxAngle);
    let remaining = maxLength;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.52)";
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let segment = 0; segment < 2; segment += 1) {
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      let endX = startX + dirX * remaining;
      let endY = startY + dirY * remaining;
      const left = layout.padding + layout.radius;
      const right = layout.width - layout.padding - layout.radius;
      let hitWall = false;

      if (endX < left) {
        const t = (left - startX) / (endX - startX);
        endX = left;
        endY = startY + (endY - startY) * t;
        hitWall = true;
      }

      if (endX > right) {
        const t = (right - startX) / (endX - startX);
        endX = right;
        endY = startY + (endY - startY) * t;
        hitWall = true;
      }

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);

      if (!hitWall) {
        break;
      }

      remaining -= Math.hypot(endX - startX, endY - startY);
      startX = endX;
      startY = endY;
      angle = Math.PI - angle;
    }

    ctx.stroke();
    ctx.restore();
  }

  drawAssistant(state) {
    if (!state.hintsEnabled || !state.assistant.target) {
      return;
    }

    const { ctx } = this;
    const target = state.gridToWorld(state.assistant.target.row, state.assistant.target.col);

    ctx.save();
    ctx.strokeStyle = "rgba(91, 228, 231, 0.9)";
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(target.x, target.y, state.layout.radius + 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(state.shooter.x, state.shooter.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.restore();
  }
}
