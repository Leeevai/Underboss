/**
 * ProfileSetupScreen - Requires users to complete their profile before accessing the app
 * 
 * Required fields: first_name, last_name, display_name, bio
 * Optional: avatar (uses default if not provided)
 */

import React, { useState, useEffect } from 'react';
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
  PermissionsAndroid,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { serv, ApiError, getFullMediaUrl } from '../serve';
import AppSettings from '../AppSettings';
import { useActiveCategories } from '../cache';
import { useTheme, BRAND, SPACING, RADIUS, FONT_SIZE, createShadow } from '../common/theme';
import { Calendar, DateData } from 'react-native-calendars';
import Geolocation from '@react-native-community/geolocation';

// Geolocation types
interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface GeolocationError {
  code: number;
  message: string;
}

interface ProfileSetupScreenProps {
  onComplete: () => void;
}

interface ProfileForm {
  first_name: string;
  last_name: string;
  display_name: string;
  bio: string;
  date_of_birth: string;
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
}

interface SelectedInterest {
  category_id: string;
  category_name: string;
  proficiency_level: number;
}

export default function ProfileSetupScreen({ onComplete }: ProfileSetupScreenProps) {
  const { colors, isDark } = useTheme();
  
  const [form, setForm] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    display_name: '',
    bio: '',
    date_of_birth: '',
    location_address: '',
    location_lat: null,
    location_lng: null,
  });
  
  const [avatar, setAvatar] = useState<Asset | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileForm & { avatar: string }>>({});
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Location state
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Interests state
  const { categories, loading: loadingCategories } = useActiveCategories();
  const [selectedInterests, setSelectedInterests] = useState<SelectedInterest[]>([]);
  const [showInterestsModal, setShowInterestsModal] = useState(false);

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
    // Avatar is optional - will use default if not provided
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'Underboss-App/1.0' } }
      );
      const data = await response.json();
      if (data.display_name) {
        return data.display_name;
      }
    } catch (err) {
      console.error('Reverse geocode failed:', err);
    }
    return null;
  };

  // Get current location
  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      // Request permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required');
          setLoadingLocation(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        async (position: GeolocationPosition) => {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          
          setForm(p => ({
            ...p,
            location_lat: latitude,
            location_lng: longitude,
            location_address: address || '',
          }));
          setLoadingLocation(false);
        },
        (error: GeolocationError) => {
          console.error('Location error:', error);
          Alert.alert('Location Error', 'Could not get your location. Please enter address manually.');
          setLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      console.error('Location fetch failed:', err);
      setLoadingLocation(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (day: DateData) => {
    // Validate age is at least 16
    const selectedDate = new Date(day.dateString);
    const today = new Date();
    const age = today.getFullYear() - selectedDate.getFullYear();
    const monthDiff = today.getMonth() - selectedDate.getMonth();
    const dayDiff = today.getDate() - selectedDate.getDate();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 16) {
      Alert.alert('Age Restriction', 'You must be at least 16 years old to use this app.');
      return;
    }

    setForm(p => ({ ...p, date_of_birth: day.dateString }));
    setShowDatePicker(false);
  };

  // Calculate max date (16 years ago from today)
  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 16);
    return date.toISOString().split('T')[0];
  };

  // Calculate initial date for calendar (default to 20 years ago)
  const getInitialDate = () => {
    if (form.date_of_birth) return form.date_of_birth;
    const date = new Date();
    date.setFullYear(date.getFullYear() - 20);
    return date.toISOString().split('T')[0];
  };

  // Toggle interest selection
  const toggleInterest = (category: { id: string; name: string }) => {
    setSelectedInterests(prev => {
      const existing = prev.find(i => i.category_id === category.id);
      if (existing) {
        return prev.filter(i => i.category_id !== category.id);
      } else {
        return [...prev, { category_id: category.id, category_name: category.name, proficiency_level: 3 }];
      }
    });
  };

  // Update interest proficiency
  const updateProficiency = (categoryId: string, level: number) => {
    setSelectedInterests(prev => 
      prev.map(i => i.category_id === categoryId ? { ...i, proficiency_level: level } : i)
    );
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
        date_of_birth: form.date_of_birth || undefined,
        location_address: form.location_address.trim() || undefined,
        location_lat: form.location_lat || undefined,
        location_lng: form.location_lng || undefined,
      });
      
      // Save interests
      for (const interest of selectedInterests) {
        try {
          await serv('interests.create', {
            category_id: interest.category_id,
            proficiency_level: interest.proficiency_level,
          });
        } catch (err) {
          console.error('Failed to save interest:', err);
          // Continue with other interests
        }
      }
      
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
    const defaultAvatarUri = getFullMediaUrl(AppSettings.defaultAvatarUrl);
    
    return (
      <TouchableOpacity 
        style={[styles.avatarContainer, errors.avatar && styles.avatarError]} 
        onPress={pickAvatar}
        disabled={uploadingAvatar}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarWithOverlay}>
            <Image source={{ uri: defaultAvatarUri }} style={styles.avatarImage} />
            <View style={[styles.avatarOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
              <Text style={styles.avatarIcon}>📷</Text>
              <Text style={[styles.avatarText, { color: '#fff' }]}>
                Tap to change
              </Text>
            </View>
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

            {/* Date of Birth */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Date of Birth</Text>
              <TouchableOpacity 
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: form.date_of_birth ? colors.inputText : colors.inputPlaceholder }}>
                  {form.date_of_birth ? new Date(form.date_of_birth + 'T00:00:00').toLocaleDateString() : 'Select your birthday'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText, flex: 1 }]}
                  placeholder="Your location"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={form.location_address}
                  onChangeText={(text) => setForm(prev => ({ ...prev, location_address: text }))}
                />
                <TouchableOpacity 
                  style={[styles.locationButton, { backgroundColor: BRAND.primary }]}
                  onPress={getCurrentLocation}
                  disabled={loadingLocation}
                >
                  {loadingLocation ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff' }}>📍</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Interests Section */}
          <View style={[styles.formCard, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.label, { color: colors.textSecondary, marginBottom: SPACING.sm }]}>
              Interests (optional)
            </Text>
            <Text style={[styles.helperText, { color: colors.textTertiary, marginBottom: SPACING.md }]}>
              Select categories you're interested in
            </Text>
            
            {loadingCategories ? (
              <ActivityIndicator size="small" color={BRAND.primary} />
            ) : (
              <View style={styles.interestsGrid}>
                {categories.map((cat) => {
                  const isSelected = selectedInterests.some(i => i.category_id === cat.category_id);
                  return (
                    <TouchableOpacity
                      key={cat.category_id}
                      style={[
                        styles.interestChip,
                        { borderColor: isSelected ? BRAND.primary : colors.border },
                        isSelected && { backgroundColor: BRAND.primary + '20' }
                      ]}
                      onPress={() => toggleInterest({ id: cat.category_id, name: cat.name })}
                    >
                      <Text style={[styles.interestChipText, { color: isSelected ? BRAND.primary : colors.text }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            
            {/* Proficiency selection for selected interests */}
            {selectedInterests.length > 0 && (
              <View style={{ marginTop: SPACING.md }}>
                <Text style={[styles.helperText, { color: colors.textTertiary, marginBottom: SPACING.sm }]}>
                  Set your proficiency (1-5)
                </Text>
                {selectedInterests.map((interest) => (
                  <View key={interest.category_id} style={styles.proficiencyRow}>
                    <Text style={[styles.proficiencyLabel, { color: colors.text }]}>{interest.category_name}</Text>
                    <View style={styles.proficiencyButtons}>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.proficiencyButton,
                            { borderColor: interest.proficiency_level === level ? BRAND.primary : colors.border },
                            interest.proficiency_level === level && { backgroundColor: BRAND.primary }
                          ]}
                          onPress={() => updateProficiency(interest.category_id, level)}
                        >
                          <Text style={{ color: interest.proficiency_level === level ? '#fff' : colors.text }}>
                            {level}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
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
      
      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDatePicker(false)}
        >
          <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.datePickerTitle, { color: colors.text }]}>
              Select Your Birthday
            </Text>
            <Text style={[styles.datePickerSubtitle, { color: colors.textSecondary }]}>
              You must be at least 16 years old
            </Text>
            <Calendar
              theme={{
                backgroundColor: colors.card,
                calendarBackground: colors.card,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: BRAND.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: BRAND.accent,
                dayTextColor: colors.text,
                arrowColor: BRAND.primary,
                monthTextColor: colors.text,
                textDisabledColor: colors.textTertiary,
              }}
              onDayPress={handleDateSelect}
              markedDates={form.date_of_birth ? { [form.date_of_birth]: { selected: true, selectedColor: BRAND.primary } } : {}}
              maxDate={getMaxDate()}
              initialDate={getInitialDate()}
              enableSwipeMonths={true}
            />
            <TouchableOpacity
              style={[styles.datePickerClose, { backgroundColor: BRAND.primary }]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  avatarWithOverlay: {
    flex: 1,
    position: 'relative',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
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
  locationButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: FONT_SIZE.xs,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  interestChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  interestChipText: {
    fontSize: FONT_SIZE.sm,
  },
  proficiencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  proficiencyLabel: {
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
  proficiencyButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  proficiencyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: '90%',
    maxWidth: 400,
  },
  datePickerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  datePickerSubtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  datePickerClose: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  datePickerCloseText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
