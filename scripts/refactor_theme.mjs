import fs from 'fs';

const files = [
  'app/(auth)/sign-in.tsx',
  'app/(auth)/sign-up.tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/search.tsx',
  'app/(tabs)/stats.tsx',
  'app/book/[id].tsx',
  'app/favorites/index.tsx',
  'app/goals/index.tsx',
  'app/playlists/[id].tsx',
  'app/playlists/index.tsx',
  'app/session/active.tsx',
  'app/session/finish.tsx',
  'app/tier-lists/[id].tsx',
  'app/tier-lists/index.tsx',
  'components/EmptyState.tsx',
  'components/FilterBar.tsx',
  'components/ProgressRing.tsx',
  'components/TopBar.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace import { Colors... } from '@/theme' with import { useTheme... } from '@/theme'
  if (content.includes('Colors')) {
      content = content.replace(/import\s*\{([^}]*?)Colors([^}]*?)\}\s*from\s*'@\/theme'/g, (m, p1, p2) => {
        const rest = (p1 + p2).split(',').map(s => s.trim()).filter(s => s).join(', ');
        return rest ? `import { useTheme, ${rest} } from '@/theme'` : `import { useTheme } from '@/theme'`;
      });

      // Export default function Component(...) { -> add hooks
      content = content.replace(/(export (?:default )?function [A-Za-z0-9_]+\([^)]*\)\s*\{)/, 
        `$1\n  const { colors, isDark } = useTheme();\n  const styles = createStyles(colors, isDark);\n`);

      // StyleSheet.create -> createStyles
      content = content.replace(/const styles = StyleSheet\.create\(\{/, 'const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({');

      // Replace Colors. with colors.
      content = content.replace(/Colors\./g, 'colors.');

      fs.writeFileSync(file, content);
  }
}
