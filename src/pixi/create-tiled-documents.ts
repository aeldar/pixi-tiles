import * as PIXI from "pixi.js";
import { delay, type DocumentId, type Lod } from "./mock-meta-data";
import { TiledDocument } from "./tiled-document";
import { TILE_SIZE_PX } from "./constants";

export type Size = [w: number, h: number];

export function createBackground(width: number, height: number): PIXI.Graphics {
  const background = new PIXI.Graphics();
  background.clear();
  background.fill(0xffffff); // white
  background.rect(0, 0, width, height);
  background.fill();
  return background;
}

export function createEmptySprite(width: number, height: number): PIXI.Sprite {
  const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
  sprite.label = "empty-tile";
  sprite.setSize(width, height);

  return sprite;
}

/**
 * Adds an invisible bounds graphic to the container.
 * This is useful for setting local bounds for the container
 * without rendering anything visible.
 * @param container The container to which the bounds will be added.
 * @param width The width of the bounds.
 * @param height The height of the bounds.
 */
export function createInvisibleBounds(
  width: number,
  height: number
): PIXI.Graphics {
  const bounds = new PIXI.Graphics();
  bounds.label = "invisible-bounds";
  bounds.fill({ color: 0xffffff, alpha: 0.5 }); // semi-transparent white
  bounds.rect(0, 0, width, height);
  bounds.fill();

  return bounds;
}

export function removeInvisibleBounds(container: PIXI.Container): void {
  const bound = container.getChildByLabel("invisible-bounds");
  if (bound) {
    container.removeChild(bound);
    bound.destroy();
  }
}

export function createTiledDocument(documentId: DocumentId): TiledDocument {
  const container = new TiledDocument(documentId);
  return container;
}

export const getOptimalLodForWidth =
  (sizesPerLod: readonly Size[]) =>
  (width: number): Lod => {
    // width = width * 3; // TODO: remove after debugging.
    // Determine the optimal LOD based on the width of the document
    for (let lod = 0; lod < sizesPerLod.length; lod++) {
      if (sizesPerLod[lod][0] >= width) {
        return lod as Lod;
      }
    }
    return (sizesPerLod.length - 1) as Lod; // Return the highest LOD if no match found
  };

  export function createTilesContainer(urlMatrix: string[][], size: Size): PIXI.Container {
    const container = new PIXI.Container();
    const [width, height] = size;
    container.label = "tiles-container";

    urlMatrix.forEach((row, rowIndex) => {
      row.forEach((url, columnIndex) => {
        // calculate last row and column corrections for the sprite size.
        const isLastRow = rowIndex === urlMatrix.length - 1;
        const isLastCol = columnIndex === row.length - 1;
        const spriteWidth = isLastCol
          ? width % TILE_SIZE_PX || TILE_SIZE_PX
          : TILE_SIZE_PX;
        const spriteHeight = isLastRow
          ? height % TILE_SIZE_PX || TILE_SIZE_PX
          : TILE_SIZE_PX;

        const sprite = createEmptySprite(spriteWidth, spriteHeight);

        sprite.setSize(spriteWidth, spriteHeight);
        sprite.position.set(
          columnIndex * TILE_SIZE_PX,
          rowIndex * TILE_SIZE_PX
        );

        container.addChild(sprite);

        PIXI.Assets.load(url)
          // simulate network delay
          .then(delay(Math.random() * 1000))
          .then((texture) => {
            sprite.texture = texture;
            sprite.label = "tile";
            sprite.setSize(spriteWidth, spriteHeight);
          });
      });
    });

    return container;
  }