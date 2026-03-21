export function DarkModeScript({ nonce }: { nonce?: string }) {
  const script = `
    (function() {
      const theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    })();
  `;

  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />;
}
