import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import UnderbossBar from '../header/underbossbar';
import ModifyProfil from './ModifyProfil.tsx';
import { serv, ApiError, UserProfile, getMediaUrl, getCurrentUser } from '../serve';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, BRAND, createShadow } from '../common/theme';


export default function ProfilePage({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const route = useRoute<any>();
    
    // Get username from route params (if viewing another user's profile)
    const viewUsername = route.params?.username;
    const currentUser = getCurrentUser();
    const isOwnProfile = !viewUsername || viewUsername === currentUser?.username;
    
    const [user, setUser] = useState<UserProfile>()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')

    const fetchProfile = async () => {
        try {
          let response;
          if (isOwnProfile) {
            response = await serv('profile.get');
          } else {
            response = await serv('profile.getByUsername', { username: viewUsername });
          }
          setUser(response)
          setError('')
        } catch (err) {
          console.error('Failed to fetch profile', err)
          const msg = err instanceof ApiError ? err.getUserMessage() : 'Failed to load profile.'
          setError(msg)
        } finally {
          setLoading(false)
          setRefreshing(false)
        }
    }
    
    useEffect(() => {
        fetchProfile()
    }, [viewUsername])

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfile();
    };

    const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
                {value || '—'}
            </Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
                <UnderbossBar />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BRAND.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
            <UnderbossBar />
            
            <ScrollView 
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={BRAND.primary}
                        colors={[BRAND.primary]}
                    />
                }
            >
                {/* PROFILE HEADER */}
                {!isOwnProfile && (
                    <TouchableOpacity 
                        style={[styles.editButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.editButtonText, { color: colors.text }]}>← Go Back</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.bottomSpacer} />
                <View style={[styles.header, { backgroundColor: colors.card }, createShadow(3, isDark)]}>
                    <View style={styles.avatarContainer}>
                        {user?.avatar_url ? (
                            <Image 
                                source={{ uri: getMediaUrl(user.avatar_url) ?? undefined }} 
                                style={styles.avatar} 
                            />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
                                <Text style={styles.avatarPlaceholderText}>👤</Text>
                            </View>
                        )}
                        <View style={styles.onlineIndicator} />
                    </View>
                    
                    <Text style={[styles.username, { color: colors.text }]}>
                        @{user?.username}
                    </Text>
                    
                    {user?.first_name && (
                        <Text style={[styles.fullName, { color: colors.textSecondary }]}>
                            {user.first_name} {user.last_name}
                        </Text>
                    )}
                    
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>⭐ Rating</Text>
                    </View>
                </View>

                {/* PERSONAL INFO SECTION */}
                <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
                    <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Personal Information</Text>
                    
                    <InfoRow label="First Name" value={user?.first_name} />
                    <InfoRow label="Last Name" value={user?.last_name} />
                    <InfoRow label="Date of Birth" value={user?.date_of_birth} />
                    <InfoRow label="Gender" value={user?.gender === 'M' ? 'Male' : user?.gender === 'F' ? 'Female' : user?.gender} />
                </View>

                {/* CONTACT & LOCATION SECTION */}
                <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
                    <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Contact & Location</Text>
                    
                    <InfoRow label="Location" value={user?.location_address} />
                    <InfoRow label="Language" value={user?.preferred_language} />
                </View>

                {/* BIO SECTION */}
                {user?.bio && (
                    <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
                        <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>About</Text>
                        <Text style={[styles.bioText, { color: colors.textSecondary }]}>
                            {user.bio}
                        </Text>
                    </View>
                )}

                {/* EDIT BUTTON - only show for own profile */}
                {isOwnProfile && (
                    <TouchableOpacity 
                        style={[styles.editButton, { borderColor: BRAND.primary }]}
                        onPress={() => navigation.navigate('ModifyProfil', { currentUser: user })}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.editButtonText, { color: BRAND.primary }]}>Edit Profile</Text>
                    </TouchableOpacity>
                )}

                {/* BACK BUTTON - only show when viewing another user's profile */}
                {!isOwnProfile && (
                    <TouchableOpacity 
                        style={[styles.editButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.editButtonText, { color: colors.text }]}>← Go Back</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    container: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
        paddingHorizontal: SPACING.lg,
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.lg,
        borderRadius: RADIUS.xl,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: BRAND.primary,
    },
    avatarPlaceholder: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: BRAND.primary,
    },
    avatarPlaceholderText: {
        fontSize: 48,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: BRAND.accent,
        borderWidth: 3,
        borderColor: BRAND.primary,
    },
    username: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        marginTop: SPACING.sm,
    },
    fullName: {
        fontSize: FONT_SIZE.md,
        marginTop: SPACING.xs,
    },
    ratingBadge: {
        marginTop: SPACING.md,
        backgroundColor: BRAND.warning + '20',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
    },
    ratingText: {
        color: BRAND.warning,
        fontWeight: FONT_WEIGHT.semibold,
        fontSize: FONT_SIZE.sm,
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
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 0.5,
    },
    label: {
        fontSize: FONT_SIZE.md,
    },
    value: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        maxWidth: '55%',
        textAlign: 'right',
    },
    bioText: {
        fontSize: FONT_SIZE.md,
        lineHeight: 24,
    },
    editButton: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.xxl,
        backgroundColor: 'transparent',
        borderWidth: 2,
        paddingVertical: SPACING.lg,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
    },
    editButtonText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
    },
    bottomSpacer: {
        height: SPACING.xxl,
    },
});
