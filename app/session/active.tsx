import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { MOCK_BOOKS } from '@/lib/mockData';

const BOOK = MOCK_BOOKS[0];

export default function ActiveSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.primary }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={Colors.onPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reading Session</Text>
        <TouchableOpacity hitSlop={12}>
          <MaterialIcons name="more-vert" size={24} color={Colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* Book info */}
      <View style={styles.bookRow}>
        <View style={styles.sessionCover}>
          <Image
            source={{ uri: BOOK.cover_url }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>{BOOK.title}</Text>
          <Text style={styles.bookAuthor}>{BOOK.author}</Text>
          <Text style={styles.bookPage}>Page {BOOK.current_page} of {BOOK.total_pages}</Text>
        </View>
      </View>

      {/* Timer display */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerValue}>00:00:00</Text>
        <Text style={styles.timerLabel}>Session Time</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlSecondary}>
          <MaterialIcons name="replay-10" size={28} color={`${Colors.onPrimary}99`} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlPrimary}>
          <MaterialIcons name="pause" size={36} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlSecondary}>
          <MaterialIcons name="forward-10" size={28} color={`${Colors.onPrimary}99`} />
        </TouchableOpacity>
      </View>

      {/* Finish session button */}
      <View style={[styles.finishArea, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={() => router.replace('/session/finish')}
          activeOpacity={0.85}
        >
          <Text style={styles.finishButtonText}>Finish Session</Text>
        </TouchableOpacity>
        <Text style={styles.finishNote}>
          Session timer behavior will be implemented in next phase
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackMd,
  },
  headerTitle: {
    ...Typography.styles.labelLg,
    color: Colors.onPrimary,
    opacity: 0.8,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerPadding,
    gap: Spacing.stackMd,
    marginBottom: Spacing.stackLg,
  },
  sessionCover: {
    width: 64,
    height: 88,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.overlay,
  },
  bookInfo: {
    flex: 1,
    gap: 4,
  },
  bookTitle: {
    ...Typography.styles.titleSm,
    color: Colors.onPrimary,
  },
  bookAuthor: {
    ...Typography.styles.bodyMd,
    color: `${Colors.onPrimary}BB`,
    fontSize: 14,
  },
  bookPage: {
    ...Typography.styles.labelSm,
    color: `${Colors.onPrimary}88`,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.stackLg,
  },
  timerValue: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -2,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  timerLabel: {
    ...Typography.styles.labelLg,
    color: `${Colors.onPrimary}88`,
    marginTop: Spacing.base,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.stackLg,
    paddingVertical: Spacing.stackMd,
  },
  controlPrimary: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.overlay,
  },
  controlSecondary: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: `${Colors.onPrimary}44`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishArea: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackLg,
    alignItems: 'center',
    gap: Spacing.base,
  },
  finishButton: {
    width: '100%',
    backgroundColor: `${Colors.onPrimary}22`,
    borderWidth: 1.5,
    borderColor: `${Colors.onPrimary}44`,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    ...Typography.styles.labelLg,
    color: Colors.onPrimary,
  },
  finishNote: {
    ...Typography.styles.labelSm,
    color: `${Colors.onPrimary}55`,
    textAlign: 'center',
    fontSize: 11,
  },
});
