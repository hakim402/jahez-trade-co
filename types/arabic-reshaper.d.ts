// types/arabic-reshaper.d.ts

declare module "bidi-js" {
  interface EmbeddingLevelsResult {
    levels: Uint8Array
    paragraphs: Array<{ start: number; end: number; level: number }>
  }

  interface Bidi {
    getEmbeddingLevels(text: string): EmbeddingLevelsResult
    getReorderedString(text: string, result: EmbeddingLevelsResult): string
    getReorderedIndices(text: string, result: EmbeddingLevelsResult): number[]
    getBidiCharType(codePoint: number): number
    getBidiCharTypeName(codePoint: number): string
    getMirroredCharacter(char: string): string
    getMirroredCharactersMap(text: string, levels: Uint8Array): Map<number, string>
    getCanonicalBracket(codePoint: number): number | null
    closingToOpeningBracket(codePoint: number): number | null
    openingToClosingBracket(codePoint: number): number | null
  }

  function bidiFactory(): Bidi
  export = bidiFactory
}

declare module "arabic-reshaper" {
  export function convertArabic(text: string): string
  export function convertArabicBack(text: string): string
}
