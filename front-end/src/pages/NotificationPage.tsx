import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import UnderbossBar from '../header/underbossbar';
import { useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BRAND } from '../common/theme';

export default function NotificationPage() {
    const { colors, isDark } = useTheme();

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <UnderbossBar />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🔔</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        You're all caught up!
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: FONT_WEIGHT.bold,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        marginTop: SPACING.sm,
    },
});
