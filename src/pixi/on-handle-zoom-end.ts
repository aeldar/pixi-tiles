import type { Viewport } from "pixi-viewport";

export interface OnHandleZoomedEnd {
  handleZoomedEnd: (event: Viewport) => void;
}

export function isOnHandleZoomedEnd(obj: object): obj is OnHandleZoomedEnd {
  return "handleZoomedEnd" in obj && typeof obj.handleZoomedEnd === "function";
}