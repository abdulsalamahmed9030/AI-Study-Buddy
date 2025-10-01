declare module "pdfjs-dist/build/pdf.mjs" {
  export interface TextItem { str?: string }
  export interface TextContent { items: TextItem[] }
  export interface Page { getTextContent(): Promise<TextContent> }
  export interface PDFDocumentProxy {
    numPages: number
    getPage(pageNumber: number): Promise<Page>
  }
  export interface LoadingTask { promise: Promise<PDFDocumentProxy> }
  export function getDocument(src: unknown): LoadingTask
  export const GlobalWorkerOptions: { workerSrc: string }
}

/** We’ll use the legacy build in Node to avoid workers entirely */
declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export interface TextItem { str?: string }
  export interface TextContent { items: TextItem[] }
  export interface Page { getTextContent(): Promise<TextContent> }
  export interface PDFDocumentProxy {
    numPages: number
    getPage(pageNumber: number): Promise<Page>
  }
  export interface LoadingTask { promise: Promise<PDFDocumentProxy> }
  // Accept any options object; we’ll pass { data, disableWorker: true }
  export function getDocument(src: unknown): LoadingTask
}
