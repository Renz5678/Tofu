import fs from 'fs';

function replaceRegex(file, regex, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
}

// 1. app/(tabs)/_layout.tsx:17
replaceRegex('app/(tabs)/_layout.tsx', /const styles = StyleSheet.create\({/g, 'const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({');
replaceRegex('app/(tabs)/_layout.tsx', /export default function TabLayout\(\) \{/, 'export default function TabLayout() {\n  const { colors, isDark } = useTheme();\n  const styles = createStyles(colors, isDark);');

// 2. app/(tabs)/search.tsx: inner component "function AddToPlaylistSheet"
let searchContent = fs.readFileSync('app/(tabs)/search.tsx', 'utf8');
searchContent = searchContent.replace(/function AddToPlaylistSheet\(.*?\)\s*\{/, (match) => `${match}\n  const { colors, isDark } = useTheme();\n  const styles = createStyles(colors, isDark);`);
fs.writeFileSync('app/(tabs)/search.tsx', searchContent);

// 3. app/(tabs)/stats.tsx: inner component "function Heatmap"
let statsContent = fs.readFileSync('app/(tabs)/stats.tsx', 'utf8');
statsContent = statsContent.replace(/function Heatmap\(.*?\)\s*\{/, (match) => `${match}\n  const { colors, isDark } = useTheme();\n  const styles = createStyles(colors, isDark);`);
fs.writeFileSync('app/(tabs)/stats.tsx', statsContent);

// 4. app/session/finish.tsx: inner component "function StatItem"
let finishContent = fs.readFileSync('app/session/finish.tsx', 'utf8');
finishContent = finishContent.replace(/function StatItem\(.*?\)\s*\{/, (match) => `${match}\n  const { colors, isDark } = useTheme();\n  const styles = createStyles(colors, isDark);`);
fs.writeFileSync('app/session/finish.tsx', finishContent);

// 5. app/tier-lists/index.tsx: TIER_COLORS definition
let tierListsContent = fs.readFileSync('app/tier-lists/index.tsx', 'utf8');
tierListsContent = tierListsContent.replace(/const TIER_COLORS = \{[\s\S]*?\};/, `const getTierColor = (tier: string, colors: any) => {
  const map: Record<string, string> = {
    S: colors.primary,
    A: colors.primaryContainer,
    B: colors.secondaryContainer,
    C: colors.surfaceContainerHigh,
    D: colors.surfaceContainerHighest,
  };
  return map[tier] ?? colors.surfaceContainer;
};`);
tierListsContent = tierListsContent.replace(/TIER_COLORS\[t\]/g, 'getTierColor(t, colors)');
fs.writeFileSync('app/tier-lists/index.tsx', tierListsContent);

// 6. components/FilterBar.tsx: Inner component? Actually it's an exported function
let filterBarContent = fs.readFileSync('components/FilterBar.tsx', 'utf8');
filterBarContent = filterBarContent.replace(/export function StatusTabs\(.*?\)\s*\{/, (match) => `${match}\n  const { colors, isDark } = useTheme();\n  const styles = createStyles(colors, isDark);`);
fs.writeFileSync('components/FilterBar.tsx', filterBarContent);

// 7. components/ProgressRing.tsx: Needs `colors` hook
let progressRingContent = fs.readFileSync('components/ProgressRing.tsx', 'utf8');
progressRingContent = progressRingContent.replace(/export function ProgressRing\(props: ProgressRingProps\)\s*\{/, (match) => `${match}\n  const { colors, isDark } = useTheme();\n  const styles = createStyles(colors, isDark);\n  const { color = colors.primary, trackColor = colors.secondaryContainer } = props;`);
// remove color and trackColor from props destructuring if they exist in signature
progressRingContent = progressRingContent.replace(/color = colors\.primary,/, '');
progressRingContent = progressRingContent.replace(/trackColor = colors\.secondaryContainer,/, '');
fs.writeFileSync('components/ProgressRing.tsx', progressRingContent);

