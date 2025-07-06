import * as PIXI from 'pixi.js';
import { type DocumentId, type Lod } from './mock-meta-data';
import { TiledDocument } from './tiled-document';

export function createBackground(width: number, height: number): PIXI.Graphics {
  const background = new PIXI.Graphics();
  background.clear();
  background.fill(0xffffff); // white
  background.rect(0, 0, width, height);
  background.fill();
  return background;
}

export function createSprite(texture: PIXI.Texture): PIXI.Sprite {
  const sprite = new PIXI.Sprite(texture);
  sprite.label = 'tile';
  sprite.anchor.set(0);

  return sprite;
}

export function createEmptySprite(width: number, height: number): PIXI.Sprite {
  const texture = PIXI.Texture.EMPTY;
  const sprite = new PIXI.Sprite(texture);
  sprite.label = 'empty-tile';
  sprite.anchor.set(0);
  sprite.width = width;
  sprite.height = height;

  return sprite;
}

function scaledToWidth(targetWidth: number, origWidth: number, origHeight: number): { width: number; height: number } {
  const scale = targetWidth / origWidth;
  return {
    width: targetWidth,
    height: origHeight * scale,
  };
}

export function scaleContainerToWidth(targetWidth: number, container: PIXI.Container): void {
  const { width, height } = scaledToWidth(targetWidth, container.width, container.height);
  container.width = width;
  container.height = height;
}

export function withDebugBorder(sprite: PIXI.Sprite, color = 'red'): PIXI.Sprite {
  const border = new PIXI.Graphics();
  border.setStrokeStyle({ width: 5, color });
  border.rect(0, 0, sprite.width, sprite.height);
  border.stroke();
  sprite.addChild(border);

  return sprite;
}

export function createTiledDocument(documentId: DocumentId, lod: Lod): TiledDocument {
  const container = new TiledDocument(documentId);

  return container;
}