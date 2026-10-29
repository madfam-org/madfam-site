/**
 * Attribute the pre-paint gate sets on <html> when the 3D card can run: no
 * reduced-motion preference, WebGL2 and module Workers present. Without it the
 * hero stays `display: none` and the page is the plain contact card.
 */
export const GATE_ATTRIBUTE = 'data-card3d';

/**
 * Pre-paint gate, rendered right before the hero: decides synchronously,
 * before the hero's box is laid out, whether it takes space at all, so the
 * page never shifts when the 3D card appears. Cheap checks only (no context
 * creation); the renderer makes the real WebGL2 context and falls back on failure.
 */
export function PaperCardGate({ nonce }: { nonce?: string }) {
  const script = `(function(){try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&'WebGL2RenderingContext' in window&&'Worker' in window&&'IntersectionObserver' in window&&'ResizeObserver' in window){document.documentElement.setAttribute('${GATE_ATTRIBUTE}','')}}catch(e){}})();`;
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />;
}
