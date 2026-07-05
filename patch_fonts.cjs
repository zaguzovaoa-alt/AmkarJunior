const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

code = code.replace(
  /@import url\([^)]+\);/,
  `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');`
);

const themeOverride = `
  --font-weight-thin: 100;
  --font-weight-extralight: 200;
  --font-weight-light: 300;
  --font-weight-normal: 300;
  --font-weight-medium: 400;
  --font-weight-semibold: 400;
  --font-weight-bold: 500;
  --font-weight-extrabold: 600;
  --font-weight-black: 700;
`;

code = code.replace(/@theme \{/, `@theme {${themeOverride}`);

if (!code.includes('font-weight: 300;')) {
  code = code.replace(/body \{/, `body {\n  font-weight: 300;\n`);
}

fs.writeFileSync('src/index.css', code);
