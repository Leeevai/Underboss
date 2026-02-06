import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import UnderbossBar from '../header/underbossbar';
import AppSettings from '../AppSettings';
import { useTheme, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, BRAND, createShadow } from '../common/theme';

interface SettingsPageProps {
    logoutUser: () => void;
}

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'system', label: 'System', icon: '📱' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
];

export default function SettingsPage({ logoutUser }: SettingsPageProps) {
    const { colors, isDark, mode, setMode } = useTheme();

    const SettingRow = ({ 
        label, 
        value, 
        rightContent 
    }: { 
        label: string; 
        value?: string; 
        rightContent?: React.ReactNode;
    }) => (
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>{label}</Text>
            {rightContent ? rightContent : (
                <Text style={[styles.settingValue, { color: colors.text }]} numberOfLines={1}>
                    {value || '—'}
                </Text>
            )}
        </View>
    );

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <UnderbossBar />
            
            <ScrollView 
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* APPEARANCE SECTION */}
                <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
                    <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Appearance</Text>
                    
                    <Text style={[styles.settingLabel, { color: colors.textSecondary, marginBottom: SPACING.md }]}>
                        Theme
                    </Text>
                    <View style={styles.themeSelector}>
                        {THEME_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.themeOption,
                                    { 
                                        backgroundColor: mode === option.value ? BRAND.primary : colors.backgroundTertiary,
                                        borderColor: mode === option.value ? BRAND.primary : colors.border,
                                    },
                                ]}
                                onPress={() => setMode(option.value)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.themeIcon}>{option.icon}</Text>
                                <Text style={[
                                    styles.themeLabel,
                                    { color: mode === option.value ? '#fff' : colors.text }
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* NOTIFICATIONS SECTION */}
                <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
                    <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Notifications</Text>
                    
                    <SettingRow
                        label="Push Notifications"
                        rightContent={
                            <Switch
                                value={AppSettings.notifications}
                                onValueChange={(val) => { AppSettings.notifications = val; }}
                                trackColor={{ false: colors.border, true: BRAND.primaryLight }}
                                thumbColor={AppSettings.notifications ? BRAND.primary : colors.textMuted}
                            />
                        }
                    />
                </View>

                {/* DISPLAY SECTION */}
                <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
                    <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Display</Text>
                    
                    <SettingRow
                        label="Auto Rotate"
                        rightContent={
                            <Switch
                                value={AppSettings.autoRotate}
                                onValueChange={(val) => { AppSettings.autoRotate = val; }}
                                trackColor={{ false: colors.border, true: BRAND.primaryLight }}
                                thumbColor={AppSettings.autoRotate ? BRAND.primary : colors.textMuted}
                            />
                        }
                    />
                </View>

                {/* ACCOUNT INFO SECTION */}
                <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
                    <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Account</Text>
                    
                    <SettingRow label="Username" value={AppSettings.username} />
                    <SettingRow label="User ID" value={AppSettings.userId?.slice(0, 8) + '...'} />
                </View>

                {/* DEBUG SECTION (collapsible in production) */}
                <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Debug Info</Text>
                    
                    <SettingRow 
                        label="Token" 
                        value={AppSettings.token ? `${AppSettings.token.slice(0, 20)}...` : 'Not set'} 
                    />
                    <SettingRow 
                        label="Current Theme" 
                        value={`${mode} (${isDark ? 'dark' : 'light'})`} 
                    />
                </View>

                {/* LOGOUT BUTTON */}
                <TouchableOpacity 
                    style={[styles.logoutButton, createShadow(2, isDark)]}
                    onPress={logoutUser}
                    activeOpacity={0.8}
                >
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>

                {/* APP INFO */}
                <View style={styles.appInfo}>
                    <Text style={[styles.appVersion, { color: colors.textMuted }]}>
                        Underboss v1.0.0
                    </Text>
                    <Text style={[styles.appCopyright, { color: colors.textMuted }]}>
                        © 2026 Underboss. All rights reserved.
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
        paddingBottom: 40,
    },
    section: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.lg,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.bold,
        textTransform: 'uppercase',
        marginBottom: SPACING.md,
        letterSpacing: 1.2,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 0.5,
    },
    settingLabel: {
        fontSize: FONT_SIZE.md,
    },
    settingValue: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        maxWidth: '55%',
        textAlign: 'right',
    },
    themeSelector: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 2,
        gap: SPACING.xs,
    },
    themeIcon: {
        fontSize: 24,
    },
    themeLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
    },
    logoutButton: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.xxl,
        backgroundColor: BRAND.error,
        paddingVertical: SPACING.lg,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
    },
    appInfo: {
        alignItems: 'center',
        marginTop: SPACING.xxl,
        paddingBottom: SPACING.lg,
    },
    appVersion: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
    },
    appCopyright: {
        fontSize: FONT_SIZE.xs,
        marginTop: SPACING.xs,
    },
});
