import type { Viewport } from "pixi-viewport";
import * as PIXI from "pixi.js";
import { TILE_SIZE_PX } from "./constants";
import {
  addInvisibleBounds,
  createEmptySprite,
  removeInvisibleBounds,
} from "./create-tiled-documents";
import {
  delay,
  documentSizes,
  tileImgUrlsForDocumentAndLod,
  type DocumentId,
  type Lod,
} from "./mock-meta-data";

export class TiledDocument extends PIXI.Container implements OnHandleZoomedEnd {
  readonly label = "tiled-document";
  readonly #documentId: DocumentId;

  // We have to maintain the bounds whenever the internal LOD changes.
  // These are set during the initialisation only.
  readonly localWidth: number;
  readonly localHeight: number;

  #lod: Lod = 0;
  #tilesContainer: PIXI.Container | null = null;

  #boundsContainer: PIXI.Container = new PIXI.Container();

  debug = false;

  handleZoomedEnd(): void {
    const globalWidth = this.getBounds().width;

    const optimalLod = this.#getOptimalLodForWidth(globalWidth);

    if (this.#lod !== optimalLod) {
      const newSize = this.#getSizeForLod(optimalLod);
      console.log("LOD changed, removing tiles and adding new ones");
      console.log("New sizes for LOD", optimalLod, ":", newSize);
      this.#lod = optimalLod;

      removeInvisibleBounds(this.#boundsContainer);
      addInvisibleBounds(this.#boundsContainer, newSize[0], newSize[1]);
      // restore the bounds relative to the TiledDocument container
      this.#boundsContainer.setSize(this.localWidth, this.localHeight);

      this.#removeTiles();
      this.#tilesContainer = this.#addTiles(this.#lod);
      this.#tilesContainer.setSize(this.localWidth, this.localHeight);
    }
  }

  constructor(documentId: DocumentId, initialLod: Lod = 0) {
    super();
    this.#lod = initialLod;
    this.#documentId = documentId;
    const [width, height] = this.#getSizeForLod(initialLod);
    // Save original width and height.
    // It doesn't matter which LOD to use, what matters is aspect ratio and persistence of the size.
    this.localWidth = width;
    this.localHeight = height;

    // we don't set global bounds during construction!
    addInvisibleBounds(
      this.#boundsContainer,
      this.localWidth,
      this.localHeight
    );
    this.addChild(this.#boundsContainer);
    this.#tilesContainer = this.#addTiles(initialLod);
  }

  // 100, 200, 300, 400
  #getOptimalLodForWidth(width: number): Lod {
    // width = width * 3; // TODO: remove after debugging.
    // Determine the optimal LOD based on the width of the document
    const sizes = documentSizes(this.#documentId);
    for (let lod = 0; lod < sizes.length; lod++) {
      if (sizes[lod][0] >= width) {
        return lod as Lod;
      }
    }
    return (sizes.length - 1) as Lod; // Return the highest LOD if no match found
  }

  #getSizeForLod(lod: Lod): [number, number] {
    return documentSizes(this.#documentId)[lod];
  }

  #removeTiles(): [number, number] {
    if (!this.#tilesContainer) {
      console.warn("No tiles container to remove");
      return [0, 0];
    }
    const width = this.#tilesContainer.getBounds(true).width;
    const height = this.#tilesContainer.getBounds(true).height;
    // Remove all tiles from the container
    if (this.#tilesContainer) {
      this.removeChild(this.#tilesContainer);
    }

    return [width, height];
  }

  #addTiles(lod: Lod): PIXI.Container {
    const c = new PIXI.Container();
    const [width, height] = this.#getSizeForLod(lod);
    c.label = "tiles-container";
    // Store the original size before adding tiles

    // Create tiles and add them to the container
    const urlMatrix = tileImgUrlsForDocumentAndLod(this.#documentId, lod);

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

        c.addChild(sprite);

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

    this.addChild(c);

    return c;
  }
}

interface OnHandleZoomedEnd {
  handleZoomedEnd: (event: Viewport) => void;
}

export function isOnHandleZoomedEnd(obj: object): obj is TiledDocument {
  return "handleZoomedEnd" in obj && typeof obj.handleZoomedEnd === "function";
}
