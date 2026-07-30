import fs from 'fs';
import path from 'path';

async function getLatestVersion(packageName) {
  const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
  const data = await response.json();
  return data.version;
}

async function run() {
  const latestChess = await getLatestVersion('chess.js');
  const latestChessground = await getLatestVersion('@lichess-org/chessground');

  console.log(`Latest chess.js: ${latestChess}`);
  console.log(`Latest Chessground: ${latestChessground}`);

  // Update index.html
  const indexPath = path.resolve('index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // Replace chess.js version
  // Match: https://cdn.jsdelivr.net/npm/chess.js@VERSION/+esm
  const chessRegex = /https:\/\/cdn\.jsdelivr\.net\/npm\/chess\.js@([\d.]+)\/\+esm/g;
  indexContent = indexContent.replace(chessRegex, (match, version) => {
    console.log(`index.html: Found chess.js version ${version}, replacing with ${latestChess}`);
    return `https://cdn.jsdelivr.net/npm/chess.js@${latestChess}/+esm`;
  });

  // Replace chessground assets version
  // Match: https://cdn.jsdelivr.net/npm/@lichess-org/chessground@VERSION/assets/...
  const cgAssetsRegex = /https:\/\/cdn\.jsdelivr\.net\/npm\/@lichess-org\/chessground@([\d.]+)\/assets\//g;
  indexContent = indexContent.replace(cgAssetsRegex, (match, version) => {
    console.log(`index.html: Found Chessground asset version ${version}, replacing with ${latestChessground}`);
    return `https://cdn.jsdelivr.net/npm/@lichess-org/chessground@${latestChessground}/assets/`;
  });

  fs.writeFileSync(indexPath, indexContent, 'utf8');

  // Update src/main.ts
  const mainTsPath = path.resolve('src/main.ts');
  if (fs.existsSync(mainTsPath)) {
    let mainTsContent = fs.readFileSync(mainTsPath, 'utf8');
    const cgRegex = /https:\/\/cdn\.jsdelivr\.net\/npm\/@lichess-org\/chessground@([\d.]+)\/\+esm/g;
    mainTsContent = mainTsContent.replace(cgRegex, (match, version) => {
      console.log(`src/main.ts: Found Chessground version ${version}, replacing with ${latestChessground}`);
      return `https://cdn.jsdelivr.net/npm/@lichess-org/chessground@${latestChessground}/+esm`;
    });
    fs.writeFileSync(mainTsPath, mainTsContent, 'utf8');
  }

  // Also build to update compiled js files
  console.log('Finished updating files.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
