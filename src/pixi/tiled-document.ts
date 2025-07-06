import type { Viewport } from "pixi-viewport";
import * as PIXI from "pixi.js";
import { TILE_SIZE_PX } from "./constants";
import { createBackground, createEmptySprite } from "./create-tiled-documents";
import {
  documentSizes,
  tileImgUrlsForDocumentAndLod,
  type DocumentId,
  type Lod,
} from "./mock-meta-data";

export class TiledDocument extends PIXI.Container implements OnHandleZoomedEnd {
  readonly label = "tiled-document";
  readonly #documentId: DocumentId;
  #lod: Lod = 0;
  #tilesContainer: PIXI.Container | null = null;

  debug = false;

  handleZoomedEnd(): void {
    // Handle zoomed end event
    if (this.debug) {
      this.#debugParams();
    }

    const currentWidth = this.getBounds(true).width;
    const optimalLod = this.#getOptimalLodForWidth(currentWidth);
    console.log("Current width", currentWidth);
    console.log("Optimal LOD for current width:", optimalLod);
    if (this.#lod !== optimalLod) {
      console.log("LOD changed, removing tiles and adding new ones");
      this.#lod = optimalLod;
      const [width, height] = this.#removeTiles();
      this.#tilesContainer = this.#addTiles(this.#lod, width, height);
    }
  }

  constructor(documentId: DocumentId, initialLod: Lod = 0) {
    super();
    this.#lod = initialLod;
    this.#documentId = documentId;
    const [width, height] = this.#getSizeForLod(initialLod);
    // adding the background sets the size of the container
    this.#addBackground(width, height);
    this.setSize(width, height);
    this.#tilesContainer = this.#addTiles(initialLod, width, height);
  }

  #debugParams() {
    console.log("Current Container World Bounds:", this.getBounds(true));
    console.log(
      "Bounds size in pixels",
      this.getBounds(true).width,
      this.getBounds().height
    );
  }

  // 100, 200, 300, 400
  #getOptimalLodForWidth(width: number): Lod {
    // Determine the optimal LOD based on the width of the document
    const sizes = documentSizes(this.#documentId);
    console.log("Available sizes for document:", sizes);
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

  #addBackground(width: number, height: number): void {
    const background = createBackground(width, height);
    this.addChild(background);
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

  #addTiles(lod: Lod, newWidth: number, newHeight: number): PIXI.Container {
    const c = new PIXI.Container();
    const [width, height] = this.#getSizeForLod(lod);
    console.log("Adding tiles for LOD:", lod, "with size:", width, height);
    c.label = "tiles-container";
    // Store the original size before adding tiles
    const originalWidth = this.width;
    const originalHeight = this.height;
    console.log(
      "Original size before adding tiles:",
      originalWidth,
      originalHeight
    );
    console.log("Sizes comming from the caller", newWidth, newHeight);

    // Create tiles and add them to the container
    const urls = tileImgUrlsForDocumentAndLod(this.#documentId, lod);
    console.log("Tile URLs for document:", this.#documentId, "LOD:", lod, urls);

    urls.forEach((row, m) => {
      row.forEach((url, n) => {
        // calculate last row and column corrections for the sprite size.
        const isLastRow = m === urls.length - 1;
        const isLastCol = n === row.length - 1;
        const spriteWidth = isLastCol
          ? width % TILE_SIZE_PX || TILE_SIZE_PX
          : TILE_SIZE_PX;
        const spriteHeight = isLastRow
          ? height % TILE_SIZE_PX || TILE_SIZE_PX
          : TILE_SIZE_PX;

        const sprite = createEmptySprite(spriteWidth, spriteHeight);

        sprite.setSize(spriteWidth, spriteHeight);
        sprite.position.set(n * TILE_SIZE_PX, m * TILE_SIZE_PX);

        c.addChild(sprite);

        PIXI.Assets.load(url)
          .then(
            (texture) =>
              new Promise<typeof texture>((resolve) =>
                setTimeout(() => resolve(texture), 300)
              )
          )
          .then((texture) => {
            sprite.texture = texture;
            sprite.label = "tile";
            console.log("After texture loading", sprite.width, sprite.height);
            console.log("will be set to", spriteWidth, spriteHeight);
            sprite.setSize(spriteWidth, spriteHeight);
          });
      });
    });

    this.addChild(c);
    c.width = newWidth;
    c.height = newHeight;

    return c;
  }
}

interface OnHandleZoomedEnd {
  handleZoomedEnd: (event: Viewport) => void;
}

export function isOnHandleZoomedEnd(obj: object): obj is TiledDocument {
  return "handleZoomedEnd" in obj && typeof obj.handleZoomedEnd === "function";
}
