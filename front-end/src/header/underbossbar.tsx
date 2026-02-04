import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function UnderbossBar() {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.logoContainer}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Main')}
            >
                <Text style={styles.logoText}>underboss</Text>
            </TouchableOpacity>

            <View style={styles.iconGroup}>
                <TouchableOpacity
                    style={styles.iconButton}
                    activeOpacity={0.6}
                    onPress={() => navigation.navigate('Notification')}
                >
                    <Text style={styles.iconEmoji}>🔔</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    activeOpacity={0.6}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Text style={styles.iconEmoji}>⚙️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    activeOpacity={0.6}
                    onPress={() => navigation.navigate('ProfilePage')}
                >
                    <Text style={styles.iconEmoji}>👤</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        height: 70,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        // iOS Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        // Android Shadow
        elevation: 3,
    },
    logoContainer: {
        flex: 1,
    },
    logoText: {
        fontSize: 26,
        fontWeight: '900',
        color: '#1A202C',
        letterSpacing: -0.5,
    },
    iconGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F7FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconEmoji: {
        fontSize: 22,
    }
});