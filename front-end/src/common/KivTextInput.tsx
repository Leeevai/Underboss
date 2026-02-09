import React, { ReactNode } from 'react'
import { StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native'
import { useTheme } from './theme'

interface KivTextInputProps extends TextInputProps {
  label: string
  icon?: ReactNode
}

export default function KivTextInput({ label, icon, style, ...props }: KivTextInputProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, { color: colors.inputText }, style]}
          placeholderTextColor={colors.inputPlaceholder}
          {...props}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 50 // Fixed height for consistency
  },
  iconContainer: {
    paddingLeft: 12
  }
})