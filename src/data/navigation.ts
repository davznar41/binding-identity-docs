import type { CollectionEntry } from 'astro:content';
import { withBase } from '../lib/paths';

export type DocumentationNode = {
  id: DocumentationId;
  title: string;
  path: string;
  children?: DocumentationNode[];
};

// Only stable content identifiers and editorial order live here. Titles and
// article text are resolved from the collection, never copied into the menu.
export const primaryIds = [
  'binding-technology',
  'id-electronic-reading',
  'id-validate',
  'customizable-paperless-regcard',
  'customizable-guest-check-in',
  'customizable-corporate-image',
  'customizable-legal-texts',
  'customizable-languages',
  'product-updates',
  'pms-integrations',
  'custom-fields-from-pms',
  'data-analytics',
  'api-integrations',
  'junior-check-in',
  'authority-reporting',
] as const;

const childSlugs = [
  'pre-check-in', 'online-check-in', 'auto-check-in',
  'group-check-in', 'ubiquity-check-in', 'offline-group-check-in',
] as const;

export type PrimaryDocumentationId = typeof primaryIds[number];
export type ChildDocumentationId = `authority-reporting/${typeof childSlugs[number]}`;
export type DocumentationId = PrimaryDocumentationId | ChildDocumentationId;

export const childIds = childSlugs.map((id): ChildDocumentationId => `authority-reporting/${id}`);

export function getNavigation(entries: CollectionEntry<'docs'>[]): DocumentationNode[] {
  const expected = [...primaryIds, ...childIds];
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  if (byId.size !== expected.length || entries.length !== expected.length || expected.some((id) => !byId.has(id))) {
    throw new Error('La colección debe corresponder exactamente a los 21 identificadores de navegación.');
  }
  const node = (id: DocumentationId): DocumentationNode => ({
    id,
    title: byId.get(id)!.data.title,
    path: withBase(`/docs/${id}/`),
  });
  return primaryIds.map((id) => ({
    ...node(id),
    ...(id === 'authority-reporting' ? { children: childIds.map(node) } : {}),
  }));
}

export function flattenNavigation(nodes: DocumentationNode[]): DocumentationNode[] {
  return nodes.flatMap((node) => [node, ...(node.children ?? [])]);
}
