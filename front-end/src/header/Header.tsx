import { View, Text, StyleSheet } from 'react-native'
import { baseUrl } from '../common/const'
import { useTheme } from '../common/theme'

const styles = StyleSheet.create({
    header: {
    },
    text: {
    }
})

interface HeaderProps {
    username: string
    isAuthenticated?: boolean
}

export default function Header({ username, isAuthenticated = false }: HeaderProps) {
    const { colors } = useTheme();
    const host = baseUrl.split('/')[2] || 'localhost'
    const msg = (!isAuthenticated || username === '')
        ? `Logged out from ${host}`
        : `Logged in as ${username}@${host}`
    
    return (
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        </View>
    )
}