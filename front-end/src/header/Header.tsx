import { View, Text, StyleSheet } from 'react-native'
import { baseUrl } from '../common/const'

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#1E88E5',
        padding: 8
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
            <Text style={styles.text}>{msg}</Text>
        </View>
    )
}