export class InputController {
  constructor(canvas, gameEngine) {
    this.canvas = canvas;
    this.gameEngine = gameEngine;
    this.pointerActive = false;
  }

  init() {
    this.canvas.addEventListener("pointerdown", (event) => {
      if (this.gameEngine.isInteractionLocked()) {
        return;
      }

      this.pointerActive = true;
      this.canvas.setPointerCapture(event.pointerId);
      const position = this.toCanvasPosition(event);
      this.gameEngine.startDrag(position.x, position.y);
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointerActive) {
        return;
      }
      const position = this.toCanvasPosition(event);
      this.gameEngine.moveDrag(position.x, position.y);
    });

    const endPointer = (event) => {
      if (!this.pointerActive) {
        return;
      }

      this.pointerActive = false;
      if (this.canvas.hasPointerCapture(event.pointerId)) {
        this.canvas.releasePointerCapture(event.pointerId);
      }
      const position = this.toCanvasPosition(event);
      this.gameEngine.endDrag(position.x, position.y);
    };

    this.canvas.addEventListener("pointerup", endPointer);
    this.canvas.addEventListener("pointercancel", endPointer);
    this.canvas.addEventListener("pointerleave", endPointer);

    document.addEventListener("keydown", (event) => {
      if (this.gameEngine.isInteractionLocked()) {
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        this.gameEngine.nudgeAim(-0.07);
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        this.gameEngine.nudgeAim(0.07);
      }

      if (event.code === "Space") {
        event.preventDefault();
        this.gameEngine.shootFromAim();
      }
    });
  }

  toCanvasPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;

    return {
      x: relativeX * this.gameEngine.layout.width,
      y: relativeY * this.gameEngine.layout.height,
    };
  }
}
