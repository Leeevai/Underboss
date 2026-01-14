import { PropsWithChildren } from 'react'
import { StyleSheet, View } from 'react-native'

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    backgroundColor: '#BBDEFB',
    width: '100%',
    padding: 16,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 1
  }
})

export default function KivCard({ children }: PropsWithChildren) {
  return <View style={styles.container}>{children}</View>
}
