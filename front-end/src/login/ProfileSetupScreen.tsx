/**
 * ProfileSetupScreen - Requires users to complete their profile before accessing the app
 * 
 * Required fields: first_name, last_name, display_name, bio, avatar
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { serv, ApiError } from '../serve';
import { useTheme, BRAND, SPACING, RADIUS, FONT_SIZE, createShadow } from '../common/theme';

interface ProfileSetupScreenProps {
  onComplete: () => void;
}

interface ProfileForm {
  first_name: string;
  last_name: string;
  display_name: string;
  bio: string;
}

export default function ProfileSetupScreen({ onComplete }: ProfileSetupScreenProps) {
  const { colors, isDark } = useTheme();
  
  const [form, setForm] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    display_name: '',
    bio: '',
  });
  
  const [avatar, setAvatar] = useState<Asset | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileForm & { avatar: string }>>({});

  // Validate all required fields
  const validate = (): boolean => {
    const newErrors: Partial<ProfileForm & { avatar: string }> = {};
    
    if (!form.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!form.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!form.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }
    if (!form.bio.trim()) {
      newErrors.bio = 'Bio is required';
    }
    if (!avatar && !avatarUrl) {
      newErrors.avatar = 'Profile photo is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Pick avatar image
  const pickAvatar = async () => {
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
        setAvatar(selectedAsset);
        setErrors(prev => ({ ...prev, avatar: undefined }));
      }
    } catch (err) {
      console.error('Failed to pick avatar:', err);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  // Upload avatar to server
  const uploadAvatar = async (): Promise<boolean> => {
    if (!avatar || !avatar.uri) return true; // No new avatar to upload
    
    setUploadingAvatar(true);
    try {
      const file = {
        uri: avatar.uri,
        type: avatar.type || 'image/jpeg',
        name: avatar.fileName || 'avatar.jpg',
      };
      
      // Pass as 'file' - serv extracts this and uses fileField ('image') for FormData
      const response = await serv('avatar.upload', { file });
      setAvatarUrl(response.avatar_url);
      return true;
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      const msg = err instanceof ApiError ? err.getUserMessage() : 'Failed to upload photo';
      Alert.alert('Upload Failed', msg);
      return false;
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save profile
  const handleSave = async () => {
    if (!validate()) {
      return;
    }
    
    setSaving(true);
    try {
      // Upload avatar first if selected
      const avatarSuccess = await uploadAvatar();
      if (!avatarSuccess) {
        setSaving(false);
        return;
      }
      
      // Update profile fields
      await serv('profile.patch', {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        display_name: form.display_name.trim(),
        bio: form.bio.trim(),
      });
      
      onComplete();
    } catch (err) {
      console.error('Failed to save profile:', err);
      const msg = err instanceof ApiError ? err.getUserMessage() : 'Failed to save profile';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const renderAvatarPicker = () => {
    const imageUri = avatar?.uri;
    
    return (
      <TouchableOpacity 
        style={[styles.avatarContainer, errors.avatar && styles.avatarError]} 
        onPress={pickAvatar}
        disabled={uploadingAvatar}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.avatarIcon}>📷</Text>
            <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
              Add Photo
            </Text>
          </View>
        )}
        {uploadingAvatar && (
          <View style={styles.avatarLoading}>
            <ActivityIndicator size="small" color={BRAND.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tell us a bit about yourself to get started
            </Text>
          </View>

          {/* Avatar Picker */}
          <View style={styles.avatarSection}>
            {renderAvatarPicker()}
            {errors.avatar && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.avatar}</Text>
            )}
          </View>

          {/* Form */}
          <View style={[styles.formCard, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            {/* First Name */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>First Name *</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.inputBg, borderColor: errors.first_name ? colors.error : colors.inputBorder, color: colors.inputText }
                ]}
                placeholder="Your first name"
                placeholderTextColor={colors.inputPlaceholder}
                value={form.first_name}
                onChangeText={(text) => {
                  setForm(prev => ({ ...prev, first_name: text }));
                  if (errors.first_name) setErrors(prev => ({ ...prev, first_name: undefined }));
                }}
                autoCapitalize="words"
              />
              {errors.first_name && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.first_name}</Text>
              )}
            </View>

            {/* Last Name */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Last Name *</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.inputBg, borderColor: errors.last_name ? colors.error : colors.inputBorder, color: colors.inputText }
                ]}
                placeholder="Your last name"
                placeholderTextColor={colors.inputPlaceholder}
                value={form.last_name}
                onChangeText={(text) => {
                  setForm(prev => ({ ...prev, last_name: text }));
                  if (errors.last_name) setErrors(prev => ({ ...prev, last_name: undefined }));
                }}
                autoCapitalize="words"
              />
              {errors.last_name && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.last_name}</Text>
              )}
            </View>

            {/* Display Name */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Display Name *</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.inputBg, borderColor: errors.display_name ? colors.error : colors.inputBorder, color: colors.inputText }
                ]}
                placeholder="How others will see you"
                placeholderTextColor={colors.inputPlaceholder}
                value={form.display_name}
                onChangeText={(text) => {
                  setForm(prev => ({ ...prev, display_name: text }));
                  if (errors.display_name) setErrors(prev => ({ ...prev, display_name: undefined }));
                }}
              />
              {errors.display_name && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.display_name}</Text>
              )}
            </View>

            {/* Bio */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Bio *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.inputBg, borderColor: errors.bio ? colors.error : colors.inputBorder, color: colors.inputText }
                ]}
                placeholder="Tell us about yourself..."
                placeholderTextColor={colors.inputPlaceholder}
                value={form.bio}
                onChangeText={(text) => {
                  setForm(prev => ({ ...prev, bio: text }));
                  if (errors.bio) setErrors(prev => ({ ...prev, bio: undefined }));
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.bio && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.bio}</Text>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: BRAND.accent }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.requiredNote, { color: colors.textTertiary }]}>
            * All fields are required
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: BRAND.primary,
  },
  avatarError: {
    borderColor: '#ff4444',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: {
    fontSize: 40,
    marginBottom: SPACING.xs,
  },
  avatarText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  formCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  textArea: {
    height: 100,
    paddingTop: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
  },
  submitButton: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  requiredNote: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
  },
});
