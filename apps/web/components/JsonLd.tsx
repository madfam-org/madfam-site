import type { JsonLd as JsonLdObject } from '@/lib/structured-data';

/**
 * Renders one or more schema.org JSON-LD blocks. `<` is escaped so copy can
 * never close the script element early.
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, index) => (
        <script
          key={`${block['@type']}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  );
}
