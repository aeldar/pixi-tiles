import * as PIXI from "pixi.js";
import { TILE_SIZE } from "./constants";
import { delay, type Lod } from "./mock-meta-data";

export type Size = [width: number, height: number];

function createEmptySprite(width: number, height: number): PIXI.Sprite {
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

export const optimalLodForWidthFn =
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

export function createTilesContainer(
  urlMatrix: string[][],
  size: Size
): PIXI.Container {
  const [containerWidth, containerHeight] = size;

  const container = new PIXI.Container();
  container.label = "tiles-container";

  const lastRowHeight = containerHeight % TILE_SIZE;
  const lastColWidth = containerWidth % TILE_SIZE;

  // m - row, n - column
  urlMatrix.forEach((rowUrls, row) => {
    rowUrls.forEach((url, col) => {
      // calculate tile size with correction for the last one in a row or a column
      const spriteWidth =
        (col + 1) * TILE_SIZE > containerWidth ? lastColWidth : TILE_SIZE;
      const spriteHeight =
        (row + 1) * TILE_SIZE > containerHeight ? lastRowHeight : TILE_SIZE;

      const sprite = createEmptySprite(spriteWidth, spriteHeight);

      sprite.position.set(col * TILE_SIZE, row * TILE_SIZE);

      container.addChild(sprite);

      // Async code here!
      // TODO: improve!
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
