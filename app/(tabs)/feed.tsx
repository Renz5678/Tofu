import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { FeedItem, useFeed } from '@/hooks/useSocial';
import { formatDistanceToNow } from 'date-fns';
import { formatDuration } from '@/lib/metrics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

function FeedSkeleton() {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.5);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.5, { duration: 800 })),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { backgroundColor: colors.surfaceContainer, borderRadius: Radius.lg, padding: 16 },
        animatedStyle,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surfaceContainerHigh,
          }}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <View
            style={{
              width: 120,
              height: 12,
              backgroundColor: colors.surfaceContainerHigh,
              borderRadius: 4,
            }}
          />
          <View
            style={{
              width: 80,
              height: 10,
              backgroundColor: colors.surfaceContainerHigh,
              borderRadius: 4,
            }}
          />
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surfaceContainerLow,
          borderRadius: Radius.md,
          padding: 12,
          gap: 12,
        }}
      >
        <View
          style={{
            width: 60,
            height: 90,
            borderRadius: Radius.sm,
            backgroundColor: colors.surfaceContainerHigh,
          }}
        />
        <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
          <View
            style={{
              width: '80%',
              height: 14,
              backgroundColor: colors.surfaceContainerHigh,
              borderRadius: 4,
            }}
          />
          <View
            style={{
              width: '60%',
              height: 12,
              backgroundColor: colors.surfaceContainerHigh,
              borderRadius: 4,
            }}
          />
          <View
            style={{
              width: '100%',
              height: 12,
              backgroundColor: colors.surfaceContainerHigh,
              borderRadius: 4,
              marginTop: 8,
            }}
          />
          <View
            style={{
              width: '40%',
              height: 12,
              backgroundColor: colors.surfaceContainerHigh,
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

export default function FeedScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: feed, isLoading, refetch, isRefetching } = useFeed();

  const renderItem = ({ item }: { item: FeedItem }) => {
    return (
      <View style={[styles.card, Shadows.card]}>
        {/* Header */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => router.push(`/profile/${item.profiles.id}` as any)}
        >
          {item.profiles.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {item.profiles.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.displayName} numberOfLines={1}>
                {item.profiles.display_name || item.profiles.username}
              </Text>
              <Text style={styles.actionText}>
                {item.type === 'review' ? 'reviewed a book' : 'logged a session'}
              </Text>
            </View>
            <Text style={styles.timeText}>
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Content */}
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => router.push(`/discover/${item.books.open_library_id}` as any)}
          activeOpacity={0.8}
        >
          <View style={styles.bookCoverWrap}>
            {item.books.cover_url ? (
              <Image
                source={{ uri: item.books.cover_url }}
                style={styles.bookCover}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.bookCover, styles.bookCoverPlaceholder]}>
                <MaterialIcons
                  name="menu-book"
                  size={24}
                  color={colors.onSurfaceVariant}
                  style={{ opacity: 0.3 }}
                />
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.bookTitle} numberOfLines={2}>
              {item.books.title}
            </Text>
            <Text style={styles.bookAuthor} numberOfLines={1}>
              {item.books.author}
            </Text>

            {item.type === 'review' ? (
              <View style={{ marginTop: 8 }}>
                {item.rating && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <MaterialIcons
                        key={star}
                        name={
                          item.rating! >= star
                            ? 'star'
                            : item.rating! >= star - 0.5
                              ? 'star-half'
                              : 'star-outline'
                        }
                        size={14}
                        color="#FFC107"
                      />
                    ))}
                  </View>
                )}
                {item.content ? (
                  <Text style={styles.reviewText} numberOfLines={4}>
                    "{item.content}"
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.sessionStatsWrap}>
                <View style={styles.sessionStat}>
                  <MaterialIcons name="timer" size={14} color={colors.primary} />
                  <Text style={styles.sessionStatText}>
                    {formatDuration(item.duration_seconds || 0)}
                  </Text>
                </View>
                <View style={styles.sessionStat}>
                  <MaterialIcons name="auto-stories" size={14} color={colors.primary} />
                  <Text style={styles.sessionStatText}>{item.pages_read} pages</Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: Spacing.base }}>
              <FeedSkeleton />
              <FeedSkeleton />
              <FeedSkeleton />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="dynamic-feed"
                size={48}
                color={colors.primary}
                style={{ opacity: 0.3 }}
              />
              <Text style={styles.emptyTitle}>Your feed is empty</Text>
              <Text style={styles.emptyDesc}>
                Follow other readers to see their reviews and reading sessions here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: Spacing.containerPadding,
      paddingBottom: Spacing.stackSm,
    },
    headerTitle: {
      ...Typography.styles.headlineMd,
      color: colors.onSurface,
    },
    list: {
      paddingHorizontal: Spacing.containerPadding,
      paddingTop: Spacing.base,
      gap: Spacing.base,
    },
    card: {
      backgroundColor: colors.surfaceContainer,
      borderRadius: Radius.lg,
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    avatarPlaceholder: {
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPlaceholderText: {
      color: colors.onPrimaryContainer,
      fontWeight: 'bold',
      fontSize: 16,
    },
    displayName: {
      ...Typography.styles.labelLg,
      color: colors.onSurface,
      flexShrink: 1,
    },
    actionText: {
      ...Typography.styles.bodyMd,
      color: colors.onSurfaceVariant,
    },
    timeText: {
      ...Typography.styles.labelSm,
      color: colors.onSurfaceVariant,
      opacity: 0.7,
    },
    cardContent: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: Radius.md,
      padding: 12,
      gap: 12,
    },
    bookCoverWrap: {
      width: 60,
      height: 90,
      borderRadius: Radius.sm,
      overflow: 'hidden',
    },
    bookCover: {
      width: '100%',
      height: '100%',
    },
    bookCoverPlaceholder: {
      backgroundColor: colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookTitle: {
      ...Typography.styles.labelLg,
      color: colors.onSurface,
    },
    bookAuthor: {
      ...Typography.styles.bodyMd,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    reviewText: {
      ...Typography.styles.bodyMd,
      color: colors.onSurface,
      fontStyle: 'italic',
    },
    sessionStatsWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
      backgroundColor: colors.surfaceContainerHigh,
      padding: 8,
      borderRadius: Radius.sm,
      alignSelf: 'flex-start',
    },
    sessionStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    sessionStatText: {
      ...Typography.styles.labelSm,
      color: colors.onSurface,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      ...Typography.styles.titleSm,
      color: colors.onSurface,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyDesc: {
      ...Typography.styles.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });
