import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme, Typography, Spacing, Radius } from '@/theme';

interface PageCountModalProps {
  visible: boolean;
  bookTitle?: string;
  onSave: (pages: number | undefined) => void;
  onCancel: () => void;
}

export function PageCountModal({ visible, bookTitle, onSave, onCancel }: PageCountModalProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [pageStr, setPageStr] = useState('');

  const handleSave = () => {
    const pages = parseInt(pageStr, 10);
    if (!isNaN(pages) && pages > 0) {
      onSave(pages);
      setPageStr('');
    }
  };

  const handleSkip = () => {
    onSave(undefined);
    setPageStr('');
  };

  const handleCancel = () => {
    setPageStr('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.title}>Page Count Missing</Text>
          <Text style={styles.description}>
            We couldn't find the total number of pages for "{bookTitle}". Enter it manually to accurately track your reading progress, or skip to add it anyway.
          </Text>
          
          <TextInput
            style={styles.input}
            value={pageStr}
            onChangeText={setPageStr}
            placeholder="e.g. 350"
            placeholderTextColor={colors.onSurfaceVariant}
            keyboardType="number-pad"
            autoFocus
          />
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, (!pageStr || isNaN(parseInt(pageStr, 10))) && { opacity: 0.5 }]} 
                onPress={handleSave}
                disabled={!pageStr || isNaN(parseInt(pageStr, 10))}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.containerPadding,
  },
  content: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.containerPadding,
    gap: Spacing.stackMd,
  },
  title: {
    ...Typography.styles.headlineMd,
    color: colors.onSurface,
  },
  description: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
  },
  input: {
    ...Typography.styles.bodyMd,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: Radius.md,
    padding: 16,
    color: colors.onSurface,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.stackSm,
  },
  rightActions: {
    flexDirection: 'row',
    gap: Spacing.stackSm,
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelText: {
    ...Typography.styles.labelLg,
    color: colors.onSurfaceVariant,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skipText: {
    ...Typography.styles.labelLg,
    color: colors.primary,
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: Radius.full,
  },
  saveText: {
    ...Typography.styles.labelLg,
    color: colors.onPrimary,
  },
});
