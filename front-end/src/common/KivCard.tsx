import React, { PropsWithChildren } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'

interface KivCardProps extends PropsWithChildren {
  style?: ViewStyle
}

export default function KivCard({ children, style }: KivCardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    // Modern shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // Modern shadow (Android)
    elevation: 3,
    width: '100%',
  }
})