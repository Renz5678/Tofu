/**
 * Share Preview Screen — Strava-style photo + stats overlay
 *
 * Flow:
 * 1. User arrives from session finish / favorites / tier-list
 * 2. They pick a background photo (camera or gallery)
 * 3. Stats are overlaid on the photo in a branded card
 * 4. User can toggle Light / Dark overlay theme
 * 5. Tapping "Share" captures the card with view-shot and opens share sheet
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { BlurView } from 'expo-blur';
import { useTheme, Typography, Spacing, Radius, Shadows, DarkColors, LightColors } from '@/theme';
import { formatDuration } from '@/lib/metrics';
import { useProfile } from '@/hooks/useProfile';
import { useReadingSessions } from '@/hooks/useReadingSessions';
import { useLibrary } from '@/hooks/useLibrary';
import { useFavorites } from '@/hooks/useFavorites';
import { useTierLists, useTierListItems } from '@/hooks/useTierLists';
import { usePlaylists } from '@/hooks/usePlaylists';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type OverlayTheme = 'dark' | 'light';

function getTypeLabel(type?: string): string {
  switch (type) {
    case 'session':   return 'Reading Session';
    case 'favorites': return 'My Favorites';
    case 'tier-list': return 'Tier List';
    case 'playlist':  return 'Reading List';
    default:          return 'Reading Recap';
  }
}

// ─────────────────────────────────────────────
// Stats overlay card — the piece that gets screenshot
// ─────────────────────────────────────────────
interface StatsCardProps {
  backgroundUri: string | null;
  theme: OverlayTheme;
  type: string;
  title: string;
  subtitle: string;
  metrics: { label: string; value: string }[];
  cardRef: React.RefObject<View>;
  children?: React.ReactNode;
}

function StatsCard({ backgroundUri, theme, type, title, subtitle, metrics, cardRef, children }: StatsCardProps) {
  const isDark = theme === 'dark';
  const colors = isDark ? DarkColors : LightColors;
  const styles = createStyles(colors, isDark);
  const textColor = isDark ? '#ffffff' : '#000000';
  const dividerColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  return (
    <View ref={cardRef} style={styles.card} collapsable={false}>
      {/* Background photo or gradient placeholder */}
      {backgroundUri ? (
        <Image
          source={{ uri: backgroundUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.cardPlaceholderBg]} />
      )}

      {/* Optional custom content overlay (e.g. tier list grid) */}
      {children && (
        <View style={styles.cardChildrenWrap}>
          {children}
        </View>
      )}

      {/* Dark/Light gradient vignette at bottom */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: isDark
              ? 'linear-gradient(transparent 30%, rgba(0,0,0,0.7) 100%)'
              : undefined,
          },
        ]}
        pointerEvents="none"
      />

      {/* Brand watermark — top left */}
      <View style={styles.watermark}>
        <MaterialIcons name="menu-book" size={16} color={textColor} style={{ opacity: 0.8 }} />
        <Text style={[styles.watermarkText, { color: textColor }]}>Tofu</Text>
      </View>

      {/* Stats overlay panel — floating glassmorphic card */}
      <View style={styles.statsPanelWrapper}>
        <BlurView intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={[styles.statsPanel, isDark ? styles.statsPanelDark : styles.statsPanelLight]}>
          {/* Book info */}
          <View style={styles.bookRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statBookTitle, { color: textColor }]} numberOfLines={2}>
                {title}
              </Text>
              <Text style={[styles.statAuthor, { color: textColor }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <Text style={[styles.typeBadgeText, { color: textColor }]}>
                {getTypeLabel(type)}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* Numbers row */}
          <View style={styles.numbersRow}>
            {metrics.map((m, i) => (
              <React.Fragment key={i}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: textColor }]}>{m.value}</Text>
                  <Text style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}>{m.label}</Text>
                </View>
                {i < metrics.length - 1 && (
                  <View style={[styles.statDivider, { backgroundColor: dividerColor }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────
export default function SharePreviewScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const cardRef = useRef<View>(null);
  const [backgroundUri, setBackgroundUri] = useState<string | null>(null);
  const [theme, setTheme] = useState<OverlayTheme>('dark');
  const [sharing, setSharing] = useState(false);

  // Use live data hooks
  const { data: profile } = useProfile();
  const { data: sessions = [] } = useReadingSessions();
  const { data: library = [] } = useLibrary();
  const { data: favorites = [] } = useFavorites();
  const { data: tierLists = [] } = useTierLists();
  const { data: tierListItems = [] } = useTierListItems(type === 'tier-list' ? id : '');
  const { data: playlists = [] } = usePlaylists();

  // Compute metrics based on type
  let title = 'Tofu Recap';
  let subtitle = 'My Reading Journey';
  let metrics: { label: string; value: string }[] = [];
  let customContent: React.ReactNode = null;

  const streak = profile?.streak?.current_streak ?? 0;

  if (type === 'session') {
    const session = id === 'latest' ? sessions[0] : sessions.find(s => s.id === id);
    const book = library.find(b => b.id === session?.user_book_id);
    if (session && book) {
      title = book.title;
      subtitle = book.author || 'Unknown Author';
      metrics = [
        { label: 'Duration', value: formatDuration(session.duration_seconds) },
        { label: 'Pages', value: `${session.pages_read}` },
        { label: 'Pgs/hr', value: `${session.pages_per_hour || 0}` },
        { label: 'Streak', value: `${streak}` }
      ];
    }
  } else if (type === 'favorites') {
    title = 'All-Time Favorites';
    subtitle = `Top ${favorites.length} Books`;
    metrics = [
      { label: '#1 Book', value: favorites.find(f => f.rank === 1)?.book.title.substring(0, 10) || 'None' },
      { label: 'Total Favs', value: `${favorites.length}` },
      { label: 'Streak', value: `${streak}` }
    ];
  } else if (type === 'tier-list') {
    const list = tierLists.find(t => t.id === id);
    if (list) {
      title = list.title;
      subtitle = 'Tier List';
      const sTierCount = tierListItems.filter(i => i.tier === 'S').length;
      metrics = [
        { label: 'Total Books', value: `${tierListItems.length}` },
        { label: 'S-Tier', value: `${sTierCount}` },
        { label: 'Tiers', value: `${list.tiers.length}` }
      ];

      const TIER_COLORS: Record<string, string> = {
        S: '#2d3a47',
        A: '#404e5d',
        B: '#576158',
        C: '#d8e2d7',
        D: '#e4e2dd',
      };

      customContent = (
        <View style={{ paddingHorizontal: 16, gap: 6, paddingTop: 40 }}>
          {list.tiers.map(tier => {
            const tierData = tierListItems.filter(i => i.tier === tier).sort((a, b) => a.position - b.position);
            // Hide empty tiers in the share preview to save space
            if (tierData.length === 0) return null;
            return (
              <View key={tier} style={styles.miniTierRow}>
                <View style={[styles.miniTierLabel, { backgroundColor: TIER_COLORS[tier] || colors.surfaceContainer }]}>
                  <Text style={[styles.miniTierLabelText, { color: ['S', 'A', 'B'].includes(tier) ? '#ffffff' : '#000000' }]}>
                    {tier.substring(0, 2)}
                  </Text>
                </View>
                <View style={styles.miniTierBooks}>
                  {tierData.map(item => (
                    <Image key={item.id} source={{ uri: item.book.cover_url ?? undefined }} style={styles.miniTierBook} contentFit="cover" />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      );
    }
  } else if (type === 'playlist') {
    const list = playlists.find(p => p.id === id);
    if (list) {
      title = list.title;
      subtitle = list.description || 'Reading List';
      metrics = [
        { label: 'Status', value: list.is_public ? 'Public' : 'Private' },
        { label: 'Streak', value: `${streak}` }
      ];
    }
  }

  // ── Media Picker (uses expo-image-picker when installed) ──
  async function pickFromGallery() {
    try {
      // Dynamic import so the app doesn't crash if expo-image-picker isn't installed yet
      const ImagePicker = await import('expo-image-picker');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
        aspect: [9, 16],
      });
      if (!result.canceled && result.assets[0]) {
        setBackgroundUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open photo library. Make sure expo-image-picker is installed.');
    }
  }

  async function takePhoto() {
    try {
      const ImagePicker = await import('expo-image-picker');
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access in Settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
        allowsEditing: true,
        aspect: [9, 16],
      });
      if (!result.canceled && result.assets[0]) {
        setBackgroundUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open camera. Make sure expo-image-picker is installed.');
    }
  }

  // ── Export & Share ──
  async function handleShare() {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } else {
        Alert.alert('Sharing not available on this device.');
      }
    } catch (e) {
      Alert.alert('Export failed', 'Could not capture the card. Please try again.');
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Recap</Text>
        {/* Theme toggle */}
        <TouchableOpacity
          onPress={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          style={styles.themeToggle}
          hitSlop={8}
        >
          <MaterialIcons
            name={theme === 'dark' ? 'light-mode' : 'dark-mode'}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card preview */}
        <StatsCard
          backgroundUri={backgroundUri}
          theme={theme}
          type={type}
          title={title}
          subtitle={subtitle}
          metrics={metrics}
          cardRef={cardRef as React.RefObject<View>}
        >
          {customContent}
        </StatsCard>

        {/* Photo picker controls */}
        <View style={styles.pickerRow}>
          <TouchableOpacity style={styles.pickerButton} onPress={takePhoto} activeOpacity={0.85}>
            <MaterialIcons name="photo-camera" size={20} color={colors.primary} />
            <Text style={styles.pickerButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerButton} onPress={pickFromGallery} activeOpacity={0.85}>
            <MaterialIcons name="photo-library" size={20} color={colors.primary} />
            <Text style={styles.pickerButtonText}>From Gallery</Text>
          </TouchableOpacity>
          {backgroundUri && (
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setBackgroundUri(null)}
              activeOpacity={0.85}
            >
              <MaterialIcons name="close" size={20} color={colors.error} />
              <Text style={[styles.pickerButtonText, { color: colors.error }]}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hint text */}
        <Text style={styles.hint}>
          {backgroundUri
            ? 'Looking great! Tap the sun/moon to toggle overlay contrast.'
            : 'Add a photo of your book, reading nook, or desk as a background.'}
        </Text>

        {/* Share + Save buttons */}
        <TouchableOpacity
          style={[styles.shareButton, sharing && { opacity: 0.7 }]}
          onPress={handleShare}
          activeOpacity={0.85}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <MaterialIcons name="share" size={20} color={colors.onPrimary} />
              <Text style={styles.shareButtonText}>Share Image</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackSm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: { ...Typography.styles.titleSm, color: colors.onSurface },
  themeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackMd,
    gap: Spacing.stackMd,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    shadowColor: isDark ? '#000' : '#2d3a47',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.4 : 0.1,
    shadowRadius: 36,
    elevation: 8,
  },
  cardPlaceholderBg: {
    backgroundColor: colors.surfaceContainer,
  },
  cardChildrenWrap: {
    ...StyleSheet.absoluteFillObject,
    paddingBottom: 160, // Space for floating stats panel
    justifyContent: 'center',
    zIndex: 1,
  },
  watermark: {
    position: 'absolute',
    top: Spacing.stackLg,
    left: Spacing.stackLg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  watermarkText: {
    ...Typography.styles.labelLg,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  statsPanelWrapper: {
    position: 'absolute',
    bottom: Spacing.stackMd,
    left: Spacing.stackMd,
    right: Spacing.stackMd,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  statsPanel: {
    padding: Spacing.stackMd,
    gap: Spacing.stackSm,
  },
  statsPanelLight: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  statsPanelDark: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.base,
  },
  statBookTitle: {
    fontFamily: Typography.fonts.serifSemiBold,
    fontSize: 22,
    lineHeight: 28,
  },
  statAuthor: {
    ...Typography.styles.labelSm,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  typeBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
    marginTop: 2,
  },
  typeBadgeText: {
    ...Typography.styles.labelSm,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...Typography.styles.numericXl,
    fontSize: 24,
    lineHeight: 24,
  },
  statLabel: {
    ...Typography.styles.labelSm,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.stackSm,
    paddingVertical: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
  },
  pickerButtonText: {
    ...Typography.styles.labelLg,
    color: colors.primary,
  },
  hint: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 13,
    paddingHorizontal: Spacing.stackMd,
  },
  shareButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    shadowColor: isDark ? '#000' : colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 12,
  },
  shareButtonText: { ...Typography.styles.labelLg, color: colors.onPrimary },
  miniTierRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md,
    overflow: 'hidden',
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  miniTierLabel: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTierLabelText: {
    ...Typography.styles.labelLg,
    fontWeight: '700',
  },
  miniTierBooks: {
    flex: 1,
    flexDirection: 'row',
    padding: 6,
    gap: 6,
    flexWrap: 'wrap',
  },
  miniTierBook: {
    width: 32,
    height: 48,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
