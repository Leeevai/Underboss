import React, { ReactNode } from 'react'
import { StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native'

interface KivTextInputProps extends TextInputProps {
  label: string
  icon?: ReactNode
}

export default function KivTextInput({ label, icon, style, ...props }: KivTextInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#9CA3AF"
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
    color: '#374151',
    marginBottom: 6,
    marginLeft: 4
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Light gray background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    height: 50 // Fixed height for consistency
  },
  iconContainer: {
    paddingLeft: 12
  }
})