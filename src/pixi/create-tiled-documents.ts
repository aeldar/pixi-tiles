import * as PIXI from "pixi.js";
import { type DocumentId, type Lod } from "./mock-meta-data";
import { TiledDocument } from "./tiled-document";

export function createBackground(width: number, height: number): PIXI.Graphics {
  const background = new PIXI.Graphics();
  background.clear();
  background.fill(0xffffff); // white
  background.rect(0, 0, width, height);
  background.fill();
  return background;
}

export function createEmptySprite(width: number, height: number): PIXI.Sprite {
  const texture = PIXI.Texture.EMPTY;
  const sprite = new PIXI.Sprite(texture);
  sprite.label = "empty-tile";
  sprite.anchor.set(0);
  sprite.width = width;
  sprite.height = height;

  return sprite;
}

function scaledToWidth(
  targetWidth: number,
  origWidth: number,
  origHeight: number
): { width: number; height: number } {
  const scale = targetWidth / origWidth;
  return {
    width: targetWidth,
    height: origHeight * scale,
  };
}

/**
 * Adds an invisible bounds graphic to the container.
 * This is useful for setting local bounds for the container
 * without rendering anything visible.
 * @param container The container to which the bounds will be added.
 * @param width The width of the bounds.
 * @param height The height of the bounds.
 */
export function addInvisibleBounds(
  container: PIXI.Container,
  width: number,
  height: number
): void {
  const bounds = new PIXI.Graphics();
  bounds.label = "invisible-bounds";
  bounds.fill({ color: 0xff0000, alpha: 0.1 }); // transparent red
  bounds.rect(0, 0, width, height);
  bounds.fill();

  container.addChild(bounds);
}

export function removeInvisibleBounds(container: PIXI.Container): void {
  const bound = container.getChildByLabel("invisible-bounds");
  if (bound) {
    container.removeChild(bound);
    bound.destroy();
  }
}

export function scaleContainerToWidth(
  targetWidth: number,
  container: PIXI.Container
): void {
  const { width, height } = scaledToWidth(
    targetWidth,
    container.width,
    container.height
  );
  container.width = width;
  container.height = height;
}

export function withDebugBorder(
  sprite: PIXI.Container,
  color = "red"
): PIXI.Container {
  const border = new PIXI.Graphics();
  border.setStrokeStyle({ width: 1, color });
  border.rect(0, 0, sprite.width, sprite.height);
  border.stroke();
  sprite.addChild(border);

  return sprite;
}

export function createTiledDocument(documentId: DocumentId): TiledDocument {
  const container = new TiledDocument(documentId);
  return container;
}
