import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const AdminLiveToolbar = ({
  onReturnToAdmin,
  onOpenQuickAdd,
  onOpenAddCategory,
  onOpenQuickSettings,
  onOpenManageFilters,
}) => {
  return (
    <View style={styles.bar}>
      <View style={styles.leftInfo}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>ADMIN LIVE MODE</Text>
        </View>
        <Text style={styles.subInfo} numberOfLines={1}>
          Storefront Live Preview & Direct Inline Edit
        </Text>
      </View>

      <View style={styles.actions}>
        {onOpenQuickAdd && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onOpenQuickAdd}
            activeOpacity={0.8}
            accessibilityLabel="Add Product"
          >
            <Text style={styles.btnText}>➕ Product</Text>
          </TouchableOpacity>
        )}

        {onOpenAddCategory && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onOpenAddCategory}
            activeOpacity={0.8}
            accessibilityLabel="Add Category"
          >
            <Text style={styles.btnText}>🏷️ Category</Text>
          </TouchableOpacity>
        )}

        {onOpenManageFilters && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onOpenManageFilters}
            activeOpacity={0.8}
            accessibilityLabel="Manage Filters"
          >
            <Text style={styles.btnText}>⚡ Filters</Text>
          </TouchableOpacity>
        )}

        {onOpenQuickSettings && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onOpenQuickSettings}
            activeOpacity={0.8}
            accessibilityLabel="Store Settings"
          >
            <Text style={styles.btnText}>⚙️ Settings</Text>
          </TouchableOpacity>
        )}

        {onReturnToAdmin && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.exitBtn]}
            onPress={onReturnToAdmin}
            activeOpacity={0.8}
            accessibilityLabel="Exit to Admin Desk"
          >
            <Text style={styles.exitBtnText}>🔙 Admin Desk</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1.5,
    borderBottomColor: '#eab308',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
    flexWrap: 'wrap',
    gap: 8,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eab308',
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subInfo: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  btnText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  exitBtn: {
    backgroundColor: '#eab308',
    borderColor: '#ca8a04',
  },
  exitBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
});
