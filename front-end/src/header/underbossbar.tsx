import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, BRAND, createShadow } from '../common/theme';
import AppSettings from '../AppSettings';

export default function UnderbossBar() {
    const navigation = useNavigation<any>();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View style={[
            styles.container,
            { 
                backgroundColor: colors.headerBg,
                paddingTop: insets.top > 0 ? insets.top : Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 10,
                borderBottomColor: colors.headerBorder,
            },
            createShadow(3, isDark),
        ]}>
            <View style={styles.inner}>
                <TouchableOpacity
                    style={styles.logoContainer}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('Main')}
                >
                    <Text style={[styles.logoText, { color: colors.headerText }]}>
                        under<Text style={{ color: BRAND.primary }}>boss</Text>
                    </Text>
                </TouchableOpacity>

                <View style={styles.iconGroup}>
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundTertiary }]}
                        activeOpacity={0.6}
                        onPress={() => navigation.navigate('Payement')}
                    >
                        <Text style={styles.iconEmoji}>💰</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundTertiary }]}
                        activeOpacity={0.6}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Text style={styles.iconEmoji}>⚙️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: BRAND.primary }]}
                        activeOpacity={0.6}
                        onPress={() => navigation.navigate('ProfilePage')}
                    >
                        <Image source={{ uri: AppSettings.userProfile?.avatar_url ||' '}} style={{ width: 42, height: 42, borderRadius: 21 }} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
    },
    inner: {
        flexDirection: 'row',
        height: 56,
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    logoContainer: {
        flex: 1,
    },
    logoText: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: FONT_WEIGHT.black,
        letterSpacing: -0.5,
    },
    iconGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    iconButton: {
        width: 42,
        height: 42,
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconEmoji: {
        fontSize: 20,
    }
});