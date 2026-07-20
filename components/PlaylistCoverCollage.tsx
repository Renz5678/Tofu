import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme, Radius } from '@/theme';

interface PlaylistCoverCollageProps {
  coverUrls: string[];
  size?: number;
}

export function PlaylistCoverCollage({ coverUrls, size = 64 }: PlaylistCoverCollageProps) {
  const { colors } = useTheme();

  // Filter out invalid/empty covers and take up to 4
  const validCovers = coverUrls.filter(Boolean).slice(0, 4);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: Radius.md,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden' as const,
  };

  if (validCovers.length === 0) {
    return <View style={containerStyle} />;
  }

  if (validCovers.length === 1) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: validCovers[0] }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      </View>
    );
  }

  if (validCovers.length === 2) {
    return (
      <View style={[containerStyle, { flexDirection: 'row' }]}>
        <Image
          source={{ uri: validCovers[0] }}
          style={{ flex: 1, height: '100%', borderRightWidth: 1, borderColor: colors.background }}
          contentFit="cover"
        />
        <Image
          source={{ uri: validCovers[1] }}
          style={{ flex: 1, height: '100%' }}
          contentFit="cover"
        />
      </View>
    );
  }

  if (validCovers.length === 3) {
    return (
      <View style={[containerStyle, { flexDirection: 'row' }]}>
        <Image
          source={{ uri: validCovers[0] }}
          style={{ flex: 1, height: '100%', borderRightWidth: 1, borderColor: colors.background }}
          contentFit="cover"
        />
        <View style={{ flex: 1, height: '100%' }}>
          <Image
            source={{ uri: validCovers[1] }}
            style={{ flex: 1, width: '100%', borderBottomWidth: 1, borderColor: colors.background }}
            contentFit="cover"
          />
          <Image
            source={{ uri: validCovers[2] }}
            style={{ flex: 1, width: '100%' }}
            contentFit="cover"
          />
        </View>
      </View>
    );
  }

  // 4 covers
  return (
    <View style={containerStyle}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Image
          source={{ uri: validCovers[0] }}
          style={{
            flex: 1,
            borderRightWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.background,
          }}
          contentFit="cover"
        />
        <Image
          source={{ uri: validCovers[1] }}
          style={{ flex: 1, borderBottomWidth: 1, borderColor: colors.background }}
          contentFit="cover"
        />
      </View>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Image
          source={{ uri: validCovers[2] }}
          style={{ flex: 1, borderRightWidth: 1, borderColor: colors.background }}
          contentFit="cover"
        />
        <Image source={{ uri: validCovers[3] }} style={{ flex: 1 }} contentFit="cover" />
      </View>
    </View>
  );
}
