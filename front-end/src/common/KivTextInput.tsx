import { ReactNode } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'

const styles = StyleSheet.create({
  inputContainer: {
    paddingBottom: 16
  },
  input: {
    backgroundColor: '#E3F2FD',
    borderRadius: 4
  },
  inputLabel: {
    fontSize: 16,
    alignSelf: 'center',
    justifyContent: 'center'
  }
})

/**
 * A custom TextInput component
 * @param {Object} props - the properties
 * @param {string} props.label
 * @param {string} props.value
 * @param {(_txt: string) -> void} onChangeText
 */
export default function KivTextInput({ label, value, onChangeText, ...props }: 
  { label: string, value: string, onChangeText: (_txt: string) => void, [_names: string]: unknown }): ReactNode {
  return (
    <View style={ styles.inputContainer }>
      <Text style={ styles.inputLabel }>{ label }</Text>
      <TextInput
        style={ styles.input }
        onChangeText={ onChangeText }
        value={ value }
        { ...props }
      />
    </View>
  )
}
