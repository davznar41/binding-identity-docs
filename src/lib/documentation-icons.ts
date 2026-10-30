import type { DocumentationId } from '../data/navigation';

/** A local SVG URL produced by Vite, including Astro's configured base. */
export interface DocumentationIconAsset {
  readonly src: string;
}

export type DocumentationIconRegistry = Readonly<Partial<Record<DocumentationId, DocumentationIconAsset>>>;

/** Pure lookup: independent of Vite's SVG loader and the application registry. */
export function getDocumentationIcon(
  id: DocumentationId,
  registry: DocumentationIconRegistry = {},
): DocumentationIconAsset | undefined {
  return registry[id];
}
