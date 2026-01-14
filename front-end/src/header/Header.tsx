import { View, Text, StyleSheet } from 'react-native'
import { baseUrl } from '../common/const'

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#1E88E5',
        padding: 8
    }
})

export default function Header({ username }: { username: string}) {
    const host = baseUrl.split('/')[2]
    const msg = (username == null || username == '')
        ? <Text>Logged out from {host}</Text>
        : <Text>Logged in as {username}@{host}</Text>;
    return (<View style={styles.header}>{msg}</View>)
}
