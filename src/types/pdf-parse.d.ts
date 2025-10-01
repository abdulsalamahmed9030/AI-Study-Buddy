declare module "pdf-parse" {
  interface PDFInfo {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
  }

  interface PDFData {
    text: string;
    info: PDFInfo;
    metadata: Record<string, unknown>;
    version: string;
    numpages: number;
  }

  function pdf(buffer: Buffer | Uint8Array, options?: Record<string, unknown>): Promise<PDFData>;
  export = pdf;
}
