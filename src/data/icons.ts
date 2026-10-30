import type { DocumentationIconRegistry } from '../lib/documentation-icons';
export type { DocumentationIconAsset, DocumentationIconRegistry } from '../lib/documentation-icons';

// Register only designer-supplied SVG imports here. An absent icon emits no slot.
export const documentationIcons: DocumentationIconRegistry = {};
