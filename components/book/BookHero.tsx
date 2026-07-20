import React from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Spacing } from '@/theme';

interface BookHeroProps {
  coverUrl?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function BookHero({ coverUrl, isFavorite, onToggleFavorite }: BookHeroProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.heroContainer, { height: width * 0.65 }]}>
      <Image
        source={{ uri: coverUrl }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        blurRadius={20}
      />
      <View style={[StyleSheet.absoluteFillObject, styles.heroOverlay, { backgroundColor: colors.background }]} />

      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 8, backgroundColor: 'rgba(0,0,0,0.5)' }]}
        onPress={() => router.back()}
      >
        <MaterialIcons name="arrow-back" size={22} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.backButton,
          { top: insets.top + 8, left: undefined, right: Spacing.containerPadding, backgroundColor: 'rgba(0,0,0,0.5)' },
        ]}
        onPress={onToggleFavorite}
      >
        <MaterialIcons
          name={isFavorite ? 'favorite' : 'favorite-border'}
          size={22}
          color={isFavorite ? colors.error : '#ffffff'}
        />
      </TouchableOpacity>

      <View style={styles.coverWrapper}>
        <Image
          source={{ uri: coverUrl }}
          style={styles.cover}
          contentFit="cover"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  heroOverlay: {
    opacity: 0.8,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.containerPadding,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  coverWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cover: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
});
