import { DEBUG_EMULATE_RANDOM_LATENCY, TILE_SIZE_PX } from './constants';

const IMG_URL_PREFIX = '/assets/_generated/chunks';

type SizeMetaData = `${number}x${number}`;
type Size = [width: number, height: number];
// we support 6 and only 6 levels of details for documents, no less, no more
type LodMetaData = [SizeMetaData, ...SizeMetaData[]] & { length: 6 };
export type Lod = 0 | 1 | 2 | 3 | 4 | 5; // 0 is the lowest, 5 is the highest level of detail

export const DOCUMENT_IDS = [
  'ISO_10628-2_2012_Symbols_Sheet_2',
  'ISO_10628-2_2012_Symbols_Sheet_3',
  'Wassily_Kandinsky_Composition_VIII',
] as const;

export type DocumentId = (typeof DOCUMENT_IDS)[number];

type DocumentSizes = Readonly<Record<DocumentId, LodMetaData>>;

const DOCUMENT_SIZES: DocumentSizes = {
  'ISO_10628-2_2012_Symbols_Sheet_2': ['298x210', '596x421', '1192x842', '2483x1754', '4967x3508', '9933x7016'],
  'ISO_10628-2_2012_Symbols_Sheet_3': ['298x210', '596x421', '1192x842', '2483x1754', '4967x3508', '9933x7016'],
  Wassily_Kandinsky_Composition_VIII: ['102x71', '204x143', '408x286', '850x595', '1700x1190', '3400x2380'],
} as const;

function sizeFromSizeMetaData(size: SizeMetaData): Size {
  const [width, height] = size.split('x').map(Number);
  return [width, height];
}

export function documentSizes(documentId: DocumentId): Size[] {
  const sizes = DOCUMENT_SIZES[documentId];
  return sizes.map(sizeFromSizeMetaData);
}

// Tiles, m and n, zero based
function tileDimensionsForSizeAndLod(x: number, y: number, lod: Lod): [number, number] {
  const m = Math.floor(y / TILE_SIZE_PX);
  const n = Math.floor(x / TILE_SIZE_PX);
  return [m, n];
}

function tileDimensionsForDocumentAndLod(documentId: DocumentId, lod: Lod): [number, number] {
  const [width, height] = documentSizes(documentId)[lod];
  return tileDimensionsForSizeAndLod(width, height, lod);
}

function imgUrlForTile(documentId: DocumentId, m: number, n: number, lod: Lod): string {
  return `${IMG_URL_PREFIX}/${documentId}/${lod}/tile_${m}_${n}.png`;
}

// Generate the matrix of image URLs, urls[row][column]
// m - row, n - column
export function tileImgUrlsForDocumentAndLod(documentId: DocumentId, lod: Lod): string[][] {
  const [m, n] = tileDimensionsForDocumentAndLod(documentId, lod);
  return Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => imgUrlForTile(documentId, i, j, lod)),
  );
}

/**
 * Delay a Promise
 */
export function delay<T>(ms: number): (value: T) => Promise<T> {
  return (value: T) => DEBUG_EMULATE_RANDOM_LATENCY ? new Promise((resolve) => setTimeout(() => resolve(value), ms)) : Promise.resolve(value);
}