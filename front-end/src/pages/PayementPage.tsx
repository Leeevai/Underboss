import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import UnderbossBar from '../header/underbossbar';
import { useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BRAND } from '../common/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationPage() {
    const { colors, isDark } = useTheme();

    return (
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
            <UnderbossBar />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>💰</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Payments</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        You are rich 💰💰💰💰
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
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
