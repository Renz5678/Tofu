/**
 * LogBookSheet — Letterboxd-style unified "Log a Book" bottom panel.
 *
 * Presents a Modal (no native bottom-sheet dep needed) with:
 *   • Half-star rating via split tap zones
 *   • ❤ Heart (Liked) toggle — independent of numeric rating
 *   • Spoiler toggle — blurs the review on community screens
 *   • Multi-line review textarea
 *
 * Usage:
 *   <LogBookSheet
 *     visible={isOpen}
 *     book={bookItem}
 *     onClose={() => setIsOpen(false)}
 *     initialValues={{ rating: 3.5, liked: false, content: '', contains_spoilers: false }}
 *   />
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useUpsertReview, UpsertReviewInput } from '@/hooks/useSocial';
import { BookItem } from '@/lib/openLibrary';

export interface LogBookSheetValues {
  rating: number;     // 0 = not set; 0.5 – 5.0 in 0.5 steps
  liked: boolean;
  content: string;
  contains_spoilers: boolean;
}

interface Props {
  visible: boolean;
  book: BookItem;
  onClose: () => void;
  onSaveSuccess?: () => void;
  initialValues?: Partial<LogBookSheetValues>;
}

const DEFAULT_VALUES: LogBookSheetValues = {
  rating: 0,
  liked: false,
  content: '',
  contains_spoilers: false,
};

export function LogBookSheet({ visible, book, onClose, onSaveSuccess, initialValues }: Props) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const insets = useSafeAreaInsets();
  const { mutateAsync: upsertReview, isPending } = useUpsertReview();

  const [values, setValues] = useState<LogBookSheetValues>({ ...DEFAULT_VALUES, ...initialValues });

  // Sync initialValues when the sheet opens (e.g. user re-opens to edit)
  useEffect(() => {
    if (visible) {
      setValues({ ...DEFAULT_VALUES, ...initialValues });
    }
  }, [visible]);

  const handleSave = async () => {
    try {
      const input: UpsertReviewInput = {
        book,
        rating: values.rating > 0 ? values.rating : null,
        liked: values.liked,
        content: values.content.trim() || null,
        contains_spoilers: values.contains_spoilers,
      };
      await upsertReview(input);
      onClose();
      onSaveSuccess?.();
    } catch (e) {
      // Error is surfaced via react-query; no extra handling needed here
    }
  };

  const setRating = (star: number, half: boolean) => {
    const newRating = half ? star - 0.5 : star;
    // Tapping the same rating again resets it
    setValues(v => ({ ...v, rating: v.rating === newRating ? 0 : newRating }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop tap to dismiss */}
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Log Book</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>{book.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={22} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* ── Rating ── */}
            <Text style={styles.fieldLabel}>Rating</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isFull = values.rating >= star;
                const isHalf = values.rating >= star - 0.5 && values.rating < star;
                return (
                  <View key={star} style={styles.starWrapper}>
                    <MaterialIcons
                      name={isFull ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                      size={48}
                      color="#FFC107"
                    />
                    {/* Left half = half-star, right half = full star */}
                    <View style={styles.starTapOverlay}>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => setRating(star, true)}
                        activeOpacity={0.7}
                      />
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => setRating(star, false)}
                        activeOpacity={0.7}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            {values.rating > 0 && (
              <Text style={styles.ratingLabel}>{values.rating} / 5</Text>
            )}

            {/* ── Heart (Liked) ── */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.fieldLabel}>Liked</Text>
                <Text style={styles.fieldHint}>Mark this as one of your favourites</Text>
              </View>
              <TouchableOpacity
                onPress={() => setValues(v => ({ ...v, liked: !v.liked }))}
                hitSlop={12}
              >
                <MaterialIcons
                  name={values.liked ? 'favorite' : 'favorite-border'}
                  size={32}
                  color={values.liked ? '#E91E63' : colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>

            {/* ── Review Text ── */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.stackMd }]}>Review</Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="What did you think? (optional)"
              placeholderTextColor={colors.onSurfaceVariant}
              value={values.content}
              onChangeText={(t) => setValues(v => ({ ...v, content: t }))}
              maxLength={2000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{values.content.length}/2000</Text>

            {/* ── Spoiler Toggle ── */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.fieldLabel}>Contains Spoilers</Text>
                <Text style={styles.fieldHint}>Blurs your review until readers tap to reveal</Text>
              </View>
              <TouchableOpacity
                onPress={() => setValues(v => ({ ...v, contains_spoilers: !v.contains_spoilers }))}
                hitSlop={12}
                style={[
                  styles.toggle,
                  values.contains_spoilers && { backgroundColor: colors.primary },
                ]}
              >
                <View style={[
                  styles.toggleThumb,
                  values.contains_spoilers && { transform: [{ translateX: 20 }] },
                ]} />
              </TouchableOpacity>
            </View>

            {/* ── Save ── */}
            <TouchableOpacity
              style={[styles.saveButton, isPending && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isPending}
              activeOpacity={0.85}
            >
              {isPending ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color={colors.onPrimary} />
                  <Text style={styles.saveButtonText}>Save Log</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: 12,
    maxHeight: '90%',
    ...Shadows.overlay,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.stackMd,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.stackMd,
  },
  headerTitle: {
    ...Typography.styles.titleSm,
    color: colors.onSurface,
  },
  headerSubtitle: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    maxWidth: 240,
  },
  fieldLabel: {
    ...Typography.styles.labelLg,
    color: colors.onSurface,
    marginBottom: 6,
  },
  fieldHint: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  starWrapper: {
    position: 'relative',
  },
  starTapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  ratingLabel: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
    marginBottom: Spacing.stackMd,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.stackSm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    marginTop: Spacing.stackSm,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.outlineVariant,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  textArea: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: Radius.md,
    padding: Spacing.stackMd,
    minHeight: 120,
    ...Typography.styles.bodyMd,
    color: colors.onSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
  },
  charCount: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: Spacing.stackSm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    marginTop: Spacing.stackLg,
    ...Shadows.button,
  },
  saveButtonText: {
    ...Typography.styles.labelLg,
    color: colors.onPrimary,
  },
});
