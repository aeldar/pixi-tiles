import * as PIXI from "pixi.js";
import {
  createInvisibleBounds,
  createTilesContainer,
  getOptimalLodForWidth,
  type Size,
} from "./create-tiled-documents";
import type { OnHandleZoomedEnd } from "./on-handle-zoom-end";
import {
  documentSizes,
  tileImgUrlsForDocumentAndLod,
  type DocumentId,
  type Lod,
} from "./mock-meta-data";

export class TiledDocument extends PIXI.Container implements OnHandleZoomedEnd {
  readonly label = "tiled-document";
  readonly #documentId: DocumentId;
  // sizes for each LOD
  readonly #sizes: readonly Size[];

  // We have to maintain the bounds whenever the internal LOD changes.
  // These are set during the initialisation only.
  readonly #localWidth: number;
  readonly #localHeight: number;

  #lod: Lod = 0;

  #tilesContainer: PIXI.Container | null = null;

  debug = false;

  handleZoomedEnd(): void {
    // Real world width of this Container.
    const globalWidth = this.getBounds().width;

    // Get the optimal LOD for the current width.
    const optimalLod = this.#getOptimalLodForWidth(globalWidth);

    // Check if the optimal lod is different from the current one.
    if (this.#lod !== optimalLod) {
      // Update tiles container with the new LOD.
      this.#updateTilesContainer(optimalLod);

      // LOD has been changed
      this.#lod = optimalLod;
    }
  }

  constructor(documentId: DocumentId, initialLod: Lod = 0) {
    super();
  
    this.#documentId = documentId;
    this.#sizes = documentSizes(this.#documentId);

    // TODO: check the best LOD on initialisation
    this.#lod = initialLod;
    const [width, height] = this.#getSizeForLod(initialLod);
    // Save original width and height.
    // It doesn't matter which LOD to use, what matters is aspect ratio and persistence of the size.
    this.#localWidth = width;
    this.#localHeight = height;

    // Add transparent bounds.
    // Can be replaced with a background, invisible bounds, or removed completely.
    const bounds = createInvisibleBounds(this.#localWidth, this.#localHeight);
    this.addChild(bounds);

    // Add tiled container.
    this.#tilesContainer = this.#createTilesContainer(initialLod);
    this.addChild(this.#tilesContainer);
  }

  #updateTilesContainer(lod: Lod): void {
    // Remove old tiles container
    this.removeChild(this.#tilesContainer!);
    this.#destroyTilesContainer(this.#tilesContainer);
    // Add the new one
    this.#tilesContainer = this.#createTilesContainer(lod);
    this.addChild(this.#tilesContainer);
    // Restore the internal size of tiled container to prevent resizing issues.
    this.#tilesContainer.setSize(this.#localWidth, this.#localHeight);
  }

  #getOptimalLodForWidth(width: number): Lod {
    // Determine the optimal LOD based on the width of the document
    return getOptimalLodForWidth(this.#sizes)(width);
  }

  #getSizeForLod(lod: Lod): Size {
    return this.#sizes[lod];
  }

  #destroyTilesContainer(container: PIXI.Container | null): void {
    if (!container) return;
    // TODO: investigate runtime error while zooming out.
    container.destroy({ children: true });
  }

  #createTilesContainer(lod: Lod): PIXI.Container {
    const [width, height] = this.#getSizeForLod(lod);

    const urlMatrix = tileImgUrlsForDocumentAndLod(this.#documentId, lod);

    return createTilesContainer(urlMatrix, [width, height]);
  }
}
