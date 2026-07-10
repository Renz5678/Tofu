import fs from 'fs';

function replaceInFile(file, search, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.split(search).join(replacement);
  fs.writeFileSync(file, content);
}

replaceInFile('app/(tabs)/stats.tsx', 'colors.onTertiaryContainer', 'colors.onPrimaryContainer');
replaceInFile('components/TopBar.tsx', 'colors.tertiaryContainer', 'colors.errorContainer');
replaceInFile('app/share/[type]/[id].tsx', 'Colors.surfaceContainer', 'colors.surfaceContainer');

let searchContent = fs.readFileSync('app/(tabs)/search.tsx', 'utf8');
searchContent = searchContent.replace(/function AddToPlaylistSheet/g, 'const { colors, isDark } = useTheme();\n  const styles = createStyles(colors, isDark);\n  function AddToPlaylistSheet');
// Wait, Search might have multiple components. Let's not guess. We'll fix search.tsx manually.

