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
import { getOptimalLodForWidth, type Size } from "./tile-utils";


export class TiledDocument extends PIXI.Container implements OnHandleZoomedEnd {
  readonly label = "tiled-document";
  readonly #documentId: DocumentId;
  readonly #sizesPerLod: readonly Size[];

  // We have to maintain the bounds whenever the internal LOD changes.
  // These are set during the initialisation only.
  readonly #localWidth: number;
  readonly #localHeight: number;

  #lod: Lod = 0;

  #tilesContainer: PIXI.Container | null = null;
  #boundsContainer: PIXI.Container = new PIXI.Container();

  debug = false;

  handleZoomedEnd(): void {
    const globalWidth = this.getBounds().width;

    const optimalLod = getOptimalLodForWidth(this.#sizesPerLod)(globalWidth);

    // LOD changed, removing tiles and adding new ones
    if (this.#lod !== optimalLod) {
      this.#lod = optimalLod;

      this.#removeTiles();
      this.#tilesContainer = this.#addTiles(this.#lod);
      this.#tilesContainer.setSize(this.#localWidth, this.#localHeight);
    }
  }

  constructor(documentId: DocumentId, initialLod: Lod = 0) {
    super();
    this.#documentId = documentId;
    this.#sizesPerLod = documentSizes(this.#documentId);

    // TODO: check the best LOD on initialisation
    this.#lod = initialLod;
    const [width, height] = this.#getSizeForLod(initialLod);
    // Save original width and height.
    // It doesn't matter which LOD to use, what matters is aspect ratio and persistence of the size.
    this.#localWidth = width;
    this.#localHeight = height;

    // we don't set global bounds during construction!
    addInvisibleBounds(
      this.#boundsContainer,
      this.#localWidth,
      this.#localHeight
    );
    this.addChild(this.#boundsContainer);
    this.#tilesContainer = this.#addTiles(initialLod);
  }

  #getSizeForLod(lod: Lod): Size {
    return this.#sizesPerLod[lod];
  }

  #removeTiles() {
    if (!this.#tilesContainer) {
      console.warn("No tiles container to remove");
      return;
    }
    // Remove all tiles from the container
    if (this.#tilesContainer) {
      this.removeChild(this.#tilesContainer);
    }

    return;
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
