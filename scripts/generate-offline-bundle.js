import fs from 'fs';
import path from 'path';

function buildSingleFile() {
  const distDir = path.resolve('dist');
  const publicDir = path.resolve('public');
  
  if (!fs.existsSync(distDir)) {
    console.error('dist directory does not exist. Run vite build first.');
    process.exit(1);
  }

  // Find JS and CSS assets in dist/assets
  const assetsDir = path.join(distDir, 'assets');
  const assetFiles = fs.readdirSync(assetsDir);
  const jsFile = assetFiles.find(f => f.endsWith('.js'));
  const cssFile = assetFiles.find(f => f.endsWith('.css'));

  if (!jsFile || !cssFile) {
    console.error('Could not find JS or CSS asset in dist/assets');
    process.exit(1);
  }

  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');

  // CRITICAL: Safely escape any `</script` or `<!--` inside JavaScript code so browsers
  // do NOT prematurely terminate the <script> block and render code as text in the DOM.
  const safeJs = jsContent
    .replace(/<\/script/gi, '<\\/script')
    .replace(/<!--/g, '<\\!--');

  // Construct pure, self-contained standalone HTML document
  // Placing <div id="root"> BEFORE the script guarantees React finds the root DOM element.
  const standaloneHtml = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PocketLedger - Personal Expense &amp; Budget Tracker</title>
    <meta name="description" content="Personal expense and budget manager to track monthly income, set category budgets, and monitor spending offline." />
    <style>
${cssContent}
    </style>
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
    <div id="root"></div>
    <script type="module">
${safeJs}
    </script>
  </body>
</html>
`;

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'pocketledger_offline.html');
  fs.writeFileSync(outputPath, standaloneHtml, 'utf8');
  console.log(`Successfully generated pure standalone offline file at ${outputPath} (${(standaloneHtml.length / 1024).toFixed(1)} KB)`);
}

buildSingleFile();
