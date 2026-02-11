import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import UnderbossBar from '../header/underbossbar';
import { serv, ApiError, UserProfile, getMediaUrl, getCurrentUser } from '../serve';
import { useCurrentUserProfile } from '../cache';
import { launchImageLibrary } from 'react-native-image-picker';
import PapsPost from '../feed/PapsPost';
import type { Paps } from '../serve/paps';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useTheme, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, BRAND, createShadow } from '../common/theme';


export default function ProfilePage({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const route = useRoute<any>();
    
    // Get username from route params (if viewing another user's profile)
    const viewUsername = route.params?.username;
    const currentUser = getCurrentUser();
    const isOwnProfile = !viewUsername || viewUsername === currentUser?.username;
    
    // Hook for updating the cached current user profile (includes cache-busting avatarUrl)
    const { updateProfile: updateCachedProfile, avatarVersion } = useCurrentUserProfile();
    
    const [user, setUser] = useState<UserProfile>()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [_error, setError] = useState('')

    // PAPs state
    const [paps, setPaps] = useState<Paps[]>([]);
    const [loadingPaps, setLoadingPaps] = useState(false);

    // Avatar editing state
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

    // Fetch user's PAPs
    const fetchUserPaps = async (username?: string) => {
      if (!username) return;
      setLoadingPaps(true);
      try {
        const response = await serv('paps.list', {
          owner_username: username,
          limit: 50,
        });
        setPaps(response.paps || []);
      } catch (err) {
        console.error('Error fetching user PAPs:', err);
      } finally {
        setLoadingPaps(false);
      }
    };
    
    useEffect(() => {
        fetchProfile()
    }, [viewUsername])

    // Fetch PAPs when profile is loaded
    useEffect(() => {
      const usernameToFetch = viewUsername || currentUser?.username;
      if (usernameToFetch) {
        fetchUserPaps(usernameToFetch);
      }
    }, [viewUsername, currentUser?.username]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfile();
        const usernameToFetch = viewUsername || currentUser?.username;
        if (usernameToFetch) {
          fetchUserPaps(usernameToFetch);
        }
    };

    // Pick and upload new avatar
    const handleChangeAvatar = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 1,
                quality: 0.8,
                maxWidth: 800,
                maxHeight: 800,
            });

            if (result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                if (!selectedAsset.uri) return;

                setUploadingAvatar(true);
                try {
                    const file = {
                        uri: selectedAsset.uri,
                        type: selectedAsset.type || 'image/jpeg',
                        name: selectedAsset.fileName || 'avatar.jpg',
                    };

                    const response = await serv('avatar.upload', { file });
                    
                    // Update local user state with new avatar
                    setUser(prev => prev ? { ...prev, avatar_url: response.avatar_url } : prev);
                    
                    // Update the cached current user profile so header reflects the change
                    if (isOwnProfile) {
                        updateCachedProfile({ avatar_url: response.avatar_url });
                    }
                    
                    Alert.alert('Success', 'Profile photo updated!');
                } catch (err) {
                    console.error('Failed to upload avatar:', err);
                    const msg = err instanceof ApiError ? err.getUserMessage() : 'Failed to upload photo';
                    Alert.alert('Upload Failed', msg);
                } finally {
                    setUploadingAvatar(false);
                }
            }
        } catch (err) {
            console.error('Failed to pick avatar:', err);
            Alert.alert('Error', 'Failed to select photo');
        }
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
                    <TouchableOpacity 
                        style={styles.avatarContainer}
                        onPress={isOwnProfile ? handleChangeAvatar : undefined}
                        disabled={uploadingAvatar || !isOwnProfile}
                        activeOpacity={isOwnProfile ? 0.7 : 1}
                    >
                        {user?.avatar_url ? (
                            <Image 
                                source={{ uri: isOwnProfile 
                                    ? `${getMediaUrl(user.avatar_url)}?v=${avatarVersion}` 
                                    : getMediaUrl(user.avatar_url) ?? undefined 
                                }} 
                                style={styles.avatar} 
                            />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
                                <Text style={styles.avatarPlaceholderText}>👤</Text>
                            </View>
                        )}
                        {uploadingAvatar && (
                            <View style={styles.avatarLoadingOverlay}>
                                <ActivityIndicator size="small" color="#fff" />
                            </View>
                        )}
                        {isOwnProfile && !uploadingAvatar && (
                            <View style={styles.avatarEditBadge}>
                                <Text style={styles.avatarEditIcon}>📷</Text>
                            </View>
                        )}
                        <View style={styles.onlineIndicator} />
                    </TouchableOpacity>
                    
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

                {/* POSTED JOBS SECTION */}
                <View style={[styles.papsSection, { marginHorizontal: SPACING.lg, marginTop: SPACING.lg }]}>
                  <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>
                    Posted Jobs {paps.length > 0 && `(${paps.length})`}
                  </Text>
                  
                  {loadingPaps ? (
                    <View style={styles.papsLoadingContainer}>
                      <ActivityIndicator size="small" color={BRAND.primary} />
                      <Text style={[styles.papsLoadingText, { color: colors.textTertiary }]}>Loading jobs...</Text>
                    </View>
                  ) : paps.length === 0 ? (
                    <View style={styles.parapsEmptyContainer}>
                      <Text style={[styles.papsEmptyText, { color: colors.textTertiary }]}>No jobs posted yet</Text>
                    </View>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.papsScrollContent}
                      snapToInterval={320}
                      decelerationRate="fast"
                    >
                      {paps.map((pap) => (
                        <View key={pap.id} style={styles.papsCardContainer}>
                          <PapsPost
                            pap={pap}
                            variant="standard"
                          />
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

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
    avatarLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: BRAND.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarEditIcon: {
        fontSize: 16,
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
    
    // PAPs section styles
    papsSection: {
      marginTop: SPACING.lg,
    },
    papsLoadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: SPACING.lg,
    },
    papsLoadingText: {
      fontSize: FONT_SIZE.md,
    },
    parapsEmptyContainer: {
      paddingVertical: SPACING.lg,
      alignItems: 'center',
    },
    papsEmptyText: {
      fontSize: FONT_SIZE.md,
    },
    papsScrollContent: {
      paddingHorizontal: SPACING.sm,
      gap: SPACING.md,
    },
    papsCardContainer: {
      marginHorizontal: SPACING.sm,
    },
});
