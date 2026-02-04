import { View, Text, StyleSheet } from 'react-native'
import { baseUrl } from '../common/const'

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#040507',
        padding: 20
    },
    text: {
        color: 'white',
        fontSize: 14
    }
})

interface HeaderProps {
    username: string
    isAuthenticated?: boolean
}

export default function Header({ username, isAuthenticated = false }: HeaderProps) {
    const host = baseUrl.split('/')[2] || 'localhost'
    const msg = (!isAuthenticated || username === '')
        ? `Logged out from ${host}`
        : `Logged in as ${username}@${host}`
    
    return (
        <View style={styles.header}>
        </View>
    )
}