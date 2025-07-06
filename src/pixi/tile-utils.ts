import type { Lod } from "./mock-meta-data";

export type Size = [w: number, h: number];

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
