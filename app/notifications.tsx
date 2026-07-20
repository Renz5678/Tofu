import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme, Typography, Spacing, Radius } from '@/theme';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState } from '@/components/EmptyState';

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: notifications = [] } = useNotifications();
  const { mutate: markRead } = useMarkNotificationsRead();

  useEffect(() => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length > 0) {
      markRead(unreadIds);
    }
  }, [notifications, markRead]);

  const renderIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <MaterialIcons name="person-add" size={14} color={colors.primary} />;
      case 'like_playlist':
        return <MaterialIcons name="favorite" size={14} color={colors.error} />;
      case 'like_favorite':
        return <MaterialIcons name="favorite" size={14} color={colors.error} />;
      default:
        return <MaterialIcons name="notifications" size={14} color={colors.primary} />;
    }
  };

  const getMessage = (type: string) => {
    switch (type) {
      case 'follow':
        return 'started following you';
      case 'like_playlist':
        return 'liked your reading list';
      case 'like_favorite':
        return 'liked your top book';
      default:
        return 'interacted with you';
    }
  };

  const handlePress = (item: any) => {
    if (item.type === 'follow') {
      router.push(`/profile/${item.actor_id}`);
    } else if (item.type === 'like_playlist' && item.target_id) {
      router.push(`/playlists/${item.target_id}`);
    } else {
      router.push(`/profile/${item.actor_id}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-none"
          title="No notifications yet"
          description="When someone follows you or likes your lists, it will show up here."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => {
            const actorName = item.actor?.display_name || item.actor?.username || 'Someone';
            return (
              <TouchableOpacity
                style={[
                  styles.notificationItem,
                  !item.is_read && { backgroundColor: `${colors.primary}11` },
                ]}
                onPress={() => handlePress(item)}
              >
                <View style={styles.avatarContainer}>
                  {item.actor?.avatar_url ? (
                    <Image source={{ uri: item.actor.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: colors.surfaceContainerHighest,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}
                    >
                      <Text style={{ fontWeight: 'bold', color: colors.onSurfaceVariant }}>
                        {actorName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.iconBadge}>{renderIcon(item.type)}</View>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.messageText}>
                    <Text style={{ fontWeight: 'bold' }}>{actorName}</Text> {getMessage(item.type)}
                  </Text>
                  <Text style={styles.timeText}>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </Text>
                </View>

                {!item.is_read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
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
    headerTitle: { ...Typography.styles.titleSm, color: colors.onSurface },
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.containerPadding,
      paddingVertical: Spacing.stackMd,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
    },
    avatarContainer: {
      position: 'relative',
      width: 48,
      height: 48,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    iconBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 12,
      padding: 2,
      borderWidth: 1,
      borderColor: colors.surfaceContainerLowest,
    },
    messageText: {
      ...Typography.styles.bodyMd,
      color: colors.onSurface,
    },
    timeText: {
      ...Typography.styles.labelSm,
      color: colors.onSurfaceVariant,
      opacity: 0.7,
      marginTop: 4,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginLeft: 8,
    },
  });
