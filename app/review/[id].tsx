import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useReview, useReviewComments, useAddReviewComment } from '@/hooks/useSocial';

export default function ReviewThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const { data: review, isLoading: isReviewLoading } = useReview(id);
  const { data: comments = [], isLoading: isCommentsLoading } = useReviewComments(id);
  const { mutate: addComment, isPending } = useAddReviewComment();

  const [commentText, setCommentText] = useState('');

  const handlePost = () => {
    if (!commentText.trim()) return;
    addComment(
      { reviewId: id, content: commentText.trim() },
      {
        onSuccess: () => setCommentText(''),
      },
    );
  };

  if (isReviewLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!review) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.onSurface }}>Review not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Thread</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Original Review */}
        <View style={styles.reviewCard}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}
            onPress={() => router.push(`/profile/${review.profiles.id}` as any)}
          >
            {review.profiles.avatar_url ? (
              <Image
                source={{ uri: review.profiles.avatar_url }}
                style={{ width: 32, height: 32, borderRadius: 16 }}
              />
            ) : (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{ color: colors.onPrimaryContainer, fontSize: 12, fontWeight: 'bold' }}
                >
                  {review.profiles.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ ...Typography.styles.labelLg, color: colors.onSurface }}>
                {review.profiles.display_name || review.profiles.username}
              </Text>
            </View>

            {review.liked && <MaterialIcons name="favorite" size={14} color="#E91E63" />}

            {review.rating && (
              <View style={{ flexDirection: 'row', marginLeft: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialIcons
                    key={star}
                    name={
                      review.rating! >= star
                        ? 'star'
                        : review.rating! >= star - 0.5
                          ? 'star-half'
                          : 'star-outline'
                    }
                    size={16}
                    color="#FFC107"
                  />
                ))}
              </View>
            )}
          </TouchableOpacity>

          <Text style={{ ...Typography.styles.bodyMd, color: colors.onSurface }}>
            {review.content}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Comments Section */}
        <Text style={styles.sectionTitle}>Comments</Text>

        {isCommentsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : comments.length > 0 ? (
          <View style={{ gap: Spacing.stackMd, marginTop: Spacing.stackSm }}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentRow}>
                <TouchableOpacity
                  onPress={() => router.push(`/profile/${comment.profiles.id}` as any)}
                >
                  {comment.profiles.avatar_url ? (
                    <Image
                      source={{ uri: comment.profiles.avatar_url }}
                      style={{ width: 28, height: 28, borderRadius: 14 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: colors.surfaceContainerHighest,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{ color: colors.onSurfaceVariant, fontSize: 10, fontWeight: 'bold' }}
                      >
                        {comment.profiles.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.commentBubble}>
                  <Text style={styles.commentUser}>
                    {comment.profiles.display_name || comment.profiles.username}
                  </Text>
                  <Text style={styles.commentText}>{comment.content}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
        )}
      </ScrollView>

      {/* Input Box */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.postButton, !commentText.trim() && { opacity: 0.5 }]}
          onPress={handlePost}
          disabled={!commentText.trim() || isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <MaterialIcons name="send" size={20} color={colors.onPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.containerPadding,
      paddingBottom: Spacing.stackSm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
    },
    headerTitle: {
      ...Typography.styles.titleSm,
      color: colors.onSurface,
    },
    scroll: {
      padding: Spacing.containerPadding,
      paddingBottom: Spacing.stackLg * 2,
    },
    reviewCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: Radius.xl,
      padding: Spacing.stackLg,
      shadowColor: isDark ? '#000' : '#2d3a47',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.outlineVariant,
      marginVertical: Spacing.stackLg,
    },
    sectionTitle: {
      ...Typography.styles.titleSm,
      color: colors.onSurface,
      marginBottom: Spacing.stackSm,
    },
    commentRow: {
      flexDirection: 'row',
      gap: Spacing.stackSm,
      alignItems: 'flex-start',
    },
    commentBubble: {
      flex: 1,
      backgroundColor: colors.surfaceContainer,
      padding: Spacing.stackSm,
      borderRadius: Radius.lg,
      borderTopLeftRadius: 4,
    },
    commentUser: {
      ...Typography.styles.labelSm,
      color: colors.onSurface,
      marginBottom: 2,
    },
    commentText: {
      ...Typography.styles.bodyMd,
      color: colors.onSurface,
    },
    emptyText: {
      ...Typography.styles.bodyMd,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: Spacing.stackMd,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: Spacing.containerPadding,
      backgroundColor: colors.surfaceContainerLowest,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.outlineVariant,
      gap: Spacing.stackSm,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surfaceVariant,
      color: colors.onSurface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.stackMd,
      paddingVertical: 12,
      minHeight: 44,
      maxHeight: 120,
      ...Typography.styles.bodyMd,
    },
    postButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
