import React, { PropsWithChildren } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { useTheme, createShadow } from './theme'

interface KivCardProps extends PropsWithChildren {
  style?: ViewStyle
}

export default function KivCard({ children, style }: KivCardProps) {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={[
      styles.card, 
      { backgroundColor: colors.card },
      createShadow(3, isDark),
      style
    ]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    width: '100%',
  }
})