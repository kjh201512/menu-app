import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import type { OpenStatus } from '../types';

export function StatusBadge({ status, label }: { status: OpenStatus; label: string }) {
  const open = status === 'OPEN';
  return <View style={[s.badge, open ? s.open : s.off]}>
    <Text style={[s.text, open ? s.openText : s.offText]}>{label}</Text>
  </View>;
}

const s = StyleSheet.create({
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start' },
  open: { backgroundColor: C.openBg },
  off: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  text: { fontSize: 11, fontWeight: '700' },
  openText: { color: C.open },
  offText: { color: C.sub },
});
