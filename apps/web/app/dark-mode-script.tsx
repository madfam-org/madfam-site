export function DarkModeScript({ nonce }: { nonce?: string }) {
  const script = `
    (function() {
      const theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        // An explicit light choice must also override a dark OS preference.
        document.documentElement.classList.add('light');
      }
    })();
  `;

  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />;
}
