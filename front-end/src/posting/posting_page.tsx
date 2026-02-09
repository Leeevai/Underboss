import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image, Modal, PermissionsAndroid } from 'react-native';
import { serv, ApiError, PaymentType, PapsStatus, Currency } from '../serve';
import { PapsCreateRequest } from '../serve/paps/types';
import UnderbossBar from '../header/underbossbar';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { useTheme, BRAND, createShadow } from '../common/theme';
import { useActiveCategories } from '../cache';
import { Calendar, DateData } from 'react-native-calendars';

// Geolocation types for React Native
interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

// Global geolocation (polyfilled by React Native)
declare const navigator: {
  geolocation: {
    getCurrentPosition: (
      success: (position: GeolocationPosition) => void,
      error?: (error: GeolocationError) => void,
      options?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number }
    ) => void;
  };
};

// =============================================================================
// CONSTANTS
// =============================================================================

const PAYMENT_TYPES: { value: PaymentType; label: string; icon: string }[] = [
  { value: 'fixed', label: 'Fixed', icon: '💰' },
  { value: 'hourly', label: 'Hourly', icon: '⏱️' },
  { value: 'negotiable', label: 'Negotiable', icon: '🤝' },
];

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'];

const POST_MODES: { value: 'draft' | 'scheduled' | 'publish'; label: string; icon: string; description: string }[] = [
  { value: 'draft', label: 'Draft', icon: '📝', description: 'Save for later' },
  { value: 'scheduled', label: 'Scheduled', icon: '⏰', description: 'Post at start date' },
  { value: 'publish', label: 'Publish Now', icon: '🚀', description: 'Go live immediately' },
];

const MAX_MEDIA_FILES = 10;

const DEFAULT_FORM: Partial<PapsCreateRequest> = {
  payment_amount: 0,
  payment_currency: 'USD',
  payment_type: 'fixed',
  max_applicants: 10,
  max_assignees: 1,
  categories: [],
};

// =============================================================================
// COMPONENT
// =============================================================================

const Post = () => {
  const [form, setForm] = useState<Partial<PapsCreateRequest>>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<{ id: string; isPrimary: boolean }[]>([]);
  const [mediaFiles, setMediaFiles] = useState<Asset[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // Post mode: draft, scheduled, or publish now
  const [postMode, setPostMode] = useState<'draft' | 'scheduled' | 'publish'>('publish');
  
  // Calendar popup state
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarField, setCalendarField] = useState<'start' | 'end'>('start');
  
  // Location loading state
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Categories from cache
  const { categories } = useActiveCategories();

  // Open calendar for a specific field
  const openCalendar = (field: 'start' | 'end') => {
    setCalendarField(field);
    setCalendarVisible(true);
  };

  // Handle date selection
  const handleDateSelect = (date: DateData) => {
    const now = new Date();
    const selectedDate = new Date(date.dateString);
    
    // If selecting a past date, show error
    if (selectedDate < new Date(now.toDateString())) {
      Alert.alert('Invalid Date', 'Cannot select a date in the past');
      return;
    }
    
    const isoDate = `${date.dateString}T12:00:00`;
    if (calendarField === 'start') {
      setForm(p => {
        const updated = { ...p, start_datetime: isoDate };
        // Auto-calculate end date if duration is set
        if (p.estimated_duration_minutes && p.estimated_duration_minutes > 0) {
          const startMs = new Date(isoDate).getTime();
          const endMs = startMs + p.estimated_duration_minutes * 60 * 1000;
          updated.end_datetime = new Date(endMs).toISOString().slice(0, 19);
        }
        return updated;
      });
    } else {
      setForm(p => {
        const updated = { ...p, end_datetime: isoDate };
        // Auto-calculate duration if start is set
        if (p.start_datetime) {
          const startMs = new Date(p.start_datetime).getTime();
          const endMs = new Date(isoDate).getTime();
          if (endMs > startMs) {
            updated.estimated_duration_minutes = Math.round((endMs - startMs) / 60000);
          }
        }
        return updated;
      });
    }
    setCalendarVisible(false);
  };

  // Handle duration change - auto-calculate end date
  const handleDurationChange = useCallback((minutes: number) => {
    setForm(p => {
      const updated = { ...p, estimated_duration_minutes: minutes || undefined };
      if (p.start_datetime && minutes > 0) {
        const startMs = new Date(p.start_datetime).getTime();
        const endMs = startMs + minutes * 60 * 1000;
        updated.end_datetime = new Date(endMs).toISOString().slice(0, 19);
      }
      return updated;
    });
  }, []);

  // Fetch current location from device
  const fetchCurrentLocation = async () => {
    setLoadingLocation(true);
    
    try {
      // Request permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to set the job location.',
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
      
      // Get current position using React Native Geolocation
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setForm(p => ({
            ...p,
            location_lat: position.coords.latitude,
            location_lng: position.coords.longitude,
          }));
          setLoadingLocation(false);
        },
        (error: GeolocationError) => {
          console.error('Location error:', error);
          Alert.alert('Location Error', 'Could not get your location. Please enter manually.');
          setLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      console.error('Location fetch failed:', err);
      setLoadingLocation(false);
    }
  };

  // Format date for display
  const formatDisplayDate = (isoDate?: string) => {
    if (!isoDate) return 'Select date';
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const syncFormCategories = (next: { id: string; isPrimary: boolean }[]) => {
    setForm(p => ({
      ...p,
      categories: next.map(c => ({ category_id: c.id, is_primary: c.isPrimary })),
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const exists = prev.find(c => c.id === categoryId);
      if (!exists) {
        const isPrimary = prev.length === 0;
        const next = [...prev, { id: categoryId, isPrimary }];
        syncFormCategories(next);
        return next;
      }
      const next = prev.map(c => ({ ...c, isPrimary: c.id === categoryId }));
      syncFormCategories(next);
      return next;
    });
  };

  // setPrimaryCategory is available but not currently used in UI
  // const _setPrimaryCategory = (categoryId: string) => {
  //   setSelectedCategories(prev => {
  //     const next = prev.map(c => ({ ...c, isPrimary: c.id === categoryId }));
  //     syncFormCategories(next);
  //     return next;
  //   });
  // };

  const removeCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const next = prev.filter(c => c.id !== categoryId);
      if (!next.some(c => c.isPrimary) && next.length > 0) {
        next[0] = { ...next[0], isPrimary: true };
      }
      syncFormCategories(next);
      return next;
    });
  };

  const pickMedia = async () => {
    if (mediaFiles.length >= MAX_MEDIA_FILES) {
      Alert.alert('Limit Reached', `Maximum ${MAX_MEDIA_FILES} files allowed`);
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: MAX_MEDIA_FILES - mediaFiles.length,
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        setMediaFiles(prev => [...prev, ...result.assets!]);
      }
    } catch (err) {
      console.error('Failed to pick media:', err);
      Alert.alert('Error', 'Failed to select media');
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (papsId: string): Promise<boolean> => {
    if (mediaFiles.length === 0) return true;

    setUploadingMedia(true);
    try {
      // Build files array for React Native FormData
      // Each file object has { uri, type, name } format
      const files = mediaFiles
        .filter(asset => asset.uri)
        .map((asset, index) => ({
          uri: asset.uri!,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `media_${index}.${(asset.type || 'image/jpeg').split('/')[1]}`,
        }));

      if (files.length > 0) {
        await serv('paps.media.upload', {
          paps_id: papsId,
          files: files,
        });
      }
      
      return true;
    } catch (err) {
      console.error('Failed to upload media:', err);
      Alert.alert('Warning', 'Paps created but some media failed to upload');
      return false;
    } finally {
      setUploadingMedia(false);
    }
  };

  const sendPaps = async () => {
    // Validate required fields
    if (!form.title || form.title.length < 5) {
      Alert.alert('Validation Error', 'Title must be at least 5 characters');
      return;
    }
    if (!form.description || form.description.length < 20) {
      Alert.alert('Validation Error', 'Description must be at least 20 characters');
      return;
    }
    if (!form.payment_amount || form.payment_amount <= 0) {
      Alert.alert('Validation Error', 'Payment amount must be greater than 0');
      return;
    }
    
    // Validate dates for non-draft posts
    if (postMode !== 'draft') {
      if (!form.start_datetime) {
        Alert.alert('Validation Error', 'Start date is required for published jobs');
        return;
      }
      const startDate = new Date(form.start_datetime);
      const now = new Date();
      if (startDate < now && postMode === 'scheduled') {
        Alert.alert('Validation Error', 'Scheduled date cannot be in the past');
        return;
      }
      if (form.end_datetime) {
        const endDate = new Date(form.end_datetime);
        if (endDate <= startDate) {
          Alert.alert('Validation Error', 'End date must be after start date');
          return;
        }
      }
    }

    // Build categories array for API
    const categoriesPayload = selectedCategories.map(c => ({
      category_id: c.id,
      is_primary: c.isPrimary,
    }));

    // Determine status and publish_at based on post mode
    let status: PapsStatus = 'draft';
    let publish_at: string | undefined;
    
    if (postMode === 'publish') {
      status = 'published';
    } else if (postMode === 'scheduled') {
      status = 'draft';
      publish_at = form.start_datetime; // Will auto-publish at start time
    }

    const payload: Partial<PapsCreateRequest> = {
      ...form,
      status,
      publish_at,
      categories: categoriesPayload.length > 0 ? categoriesPayload : undefined,
    };

    setSubmitting(true);
    try {
      // First create the PAPS
      const result = await serv('paps.create', payload);
      const papsId = result.paps_id;

      // Then upload media if any
      if (mediaFiles.length > 0) {
        await uploadMedia(papsId);
      }

      const successMsg = postMode === 'draft' 
        ? 'Saved as draft!' 
        : postMode === 'scheduled' 
          ? 'Scheduled successfully!' 
          : 'Published successfully!';
      Alert.alert('Success', successMsg);
      resetForm();
    } catch (err) {
      console.error('Failed to create paps', err);
      const msg = err instanceof ApiError ? err.message : 'Failed to create paps.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setSelectedCategories([]);
    setMediaFiles([]);
    setPostMode('publish');
  };

  const { colors, isDark } = useTheme();

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <UnderbossBar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Create a Paps</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Post a job for the community</Text>
        </View>

        {/* FORM */}
        <View style={styles.formContainer}>

          {/* BASICS */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Basic Info</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="e.g. Build my landing page"
                placeholderTextColor={colors.inputPlaceholder}
                value={form.title}
                onChangeText={(title) => setForm(p => ({ ...p, title }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Subtitle</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="A short tagline for your job"
                placeholderTextColor={colors.inputPlaceholder}
                value={form.subtitle}
                onChangeText={(subtitle) => setForm(p => ({ ...p, subtitle }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="Describe the job in detail (min 20 chars)..."
                placeholderTextColor={colors.inputPlaceholder}
                value={form.description}
                onChangeText={(description) => setForm(p => ({ ...p, description }))}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* CATEGORIES */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Categories</Text>
            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>Select several categories. Tap again to set primary; long-press to remove.</Text>

            <View style={styles.categoriesGrid}>
              {categories?.map((cat: any) => {
                const isPrimary = selectedCategories.some(c => c.id === cat.category_id && c.isPrimary);
                return (
                  <TouchableOpacity
                    key={cat.category_id}
                    style={[
                      styles.categoryChip,
                      { borderColor: colors.border, backgroundColor: colors.backgroundTertiary },
                      isPrimary && styles.categoryChipPrimary,
                    ]}
                    onPress={() => toggleCategory(cat.category_id)}
                    onLongPress={() => removeCategory(cat.category_id)}
                  >
                    <Text style={[styles.categoryChipText, { color: colors.textSecondary }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* MEDIA */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Media</Text>
            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
              Add photos or videos ({mediaFiles.length}/{MAX_MEDIA_FILES})
            </Text>

            <View style={styles.mediaContainer}>
              {/* Media Preview Grid */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaGrid}
              >
                {mediaFiles.map((asset, index) => (
                  <View key={asset.uri || index} style={styles.mediaPreviewContainer}>
                    <Image
                      source={{ uri: asset.uri }}
                      style={styles.mediaPreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.mediaRemoveButton}
                      onPress={() => removeMedia(index)}
                    >
                      <Text style={styles.mediaRemoveText}>✕</Text>
                    </TouchableOpacity>
                    {asset.type?.startsWith('video') && (
                      <View style={styles.videoIndicator}>
                        <Text style={styles.videoIndicatorText}>▶</Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Add Media Button */}
                {mediaFiles.length < MAX_MEDIA_FILES && (
                  <TouchableOpacity
                    style={styles.addMediaButton}
                    onPress={pickMedia}
                  >
                    <Text style={styles.addMediaIcon}>+</Text>
                    <Text style={styles.addMediaText}>Add</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            {uploadingMedia && (
              <View style={styles.uploadingIndicator}>
                <ActivityIndicator size="small" color={BRAND.primary} />
                <Text style={[styles.uploadingText, { color: BRAND.primary }]}>Uploading media...</Text>
              </View>
            )}
          </View>

          {/* PAYMENT */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Payment</Text>

            {/* Payment Type */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
              <View style={styles.toggleRow}>
                {PAYMENT_TYPES.map((pt) => (
                  <TouchableOpacity
                    key={pt.value}
                    style={[
                      styles.toggleButton,
                      { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                      form.payment_type === pt.value && { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
                    ]}
                    onPress={() => setForm(p => ({ ...p, payment_type: pt.value }))}
                  >
                    <Text style={styles.toggleIcon}>{pt.icon}</Text>
                    <Text style={[
                      styles.toggleText,
                      { color: colors.textSecondary },
                      form.payment_type === pt.value && styles.toggleTextActive,
                    ]}>
                      {pt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount + Currency */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Amount *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={form.payment_amount?.toString() || ''}
                  onChangeText={(v) => setForm(p => ({ ...p, payment_amount: parseFloat(v) || 0 }))}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Currency</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CURRENCIES.map((cur) => (
                      <TouchableOpacity
                        key={cur}
                        style={[
                          styles.currencyChip,
                          { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                          form.payment_currency === cur && { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
                        ]}
                        onPress={() => setForm(p => ({ ...p, payment_currency: cur }))}
                      >
                        <Text style={[
                          styles.currencyText,
                          { color: colors.textSecondary },
                          form.payment_currency === cur && styles.currencyTextActive,
                        ]}>
                          {cur}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>

          {/* POST MODE */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Post Mode</Text>
            <View style={styles.postModeContainer}>
              {POST_MODES.map((mode) => (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.postModeOption,
                    { backgroundColor: colors.inputBg, borderColor: colors.border },
                    postMode === mode.value && { backgroundColor: BRAND.primary + '15', borderColor: BRAND.primary },
                  ]}
                  onPress={() => setPostMode(mode.value)}
                >
                  <Text style={styles.postModeIcon}>{mode.icon}</Text>
                  <View style={styles.postModeText}>
                    <Text style={[
                      styles.postModeLabel,
                      { color: postMode === mode.value ? BRAND.primary : colors.text },
                    ]}>
                      {mode.label}
                    </Text>
                    <Text style={[styles.postModeDesc, { color: colors.textMuted }]}>
                      {mode.description}
                    </Text>
                  </View>
                  {postMode === mode.value && (
                    <Text style={styles.postModeCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* SCHEDULE */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Schedule</Text>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Start Date</Text>
                <TouchableOpacity
                  style={[styles.datePickerButton, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                  onPress={() => openCalendar('start')}
                >
                  <Text style={styles.datePickerIcon}>📅</Text>
                  <Text style={[styles.datePickerText, { color: form.start_datetime ? colors.inputText : colors.inputPlaceholder }]}>
                    {formatDisplayDate(form.start_datetime)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>End Date</Text>
                <TouchableOpacity
                  style={[styles.datePickerButton, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                  onPress={() => openCalendar('end')}
                >
                  <Text style={styles.datePickerIcon}>📅</Text>
                  <Text style={[styles.datePickerText, { color: form.end_datetime ? colors.inputText : colors.inputPlaceholder }]}>
                    {formatDisplayDate(form.end_datetime)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Duration (minutes)</Text>
              <Text style={[styles.sectionHint, { color: colors.textMuted, marginBottom: 8 }]}>
                Changes end date automatically based on start date
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                keyboardType="numeric"
                placeholder="e.g. 120"
                placeholderTextColor={colors.inputPlaceholder}
                value={form.estimated_duration_minutes?.toString() || ''}
                onChangeText={(v) => handleDurationChange(parseInt(v, 10) || 0)}
              />
            </View>
          </View>

          {/* LIMITS */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Limits</Text>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Max Applicants</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={form.max_applicants?.toString() || ''}
                  onChangeText={(v) => setForm(p => ({ ...p, max_applicants: parseInt(v, 10) || 10 }))}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Max Assignees</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={form.max_assignees?.toString() || ''}
                  onChangeText={(v) => setForm(p => ({ ...p, max_assignees: parseInt(v, 10) || 1 }))}
                />
              </View>
            </View>
          </View>

          {/* LOCATION */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Location</Text>

            {/* Use Current Location Button */}
            <TouchableOpacity
              style={[styles.locationButton, { backgroundColor: BRAND.primary + '15', borderColor: BRAND.primary }]}
              onPress={fetchCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color={BRAND.primary} />
              ) : (
                <Text style={styles.locationButtonIcon}>📍</Text>
              )}
              <Text style={[styles.locationButtonText, { color: BRAND.primary }]}>
                {loadingLocation ? 'Getting location...' : 'Use my current location'}
              </Text>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="e.g. Paris, France"
                placeholderTextColor={colors.inputPlaceholder}
                value={form.location_address || ''}
                onChangeText={(location_address) => setForm(p => ({ ...p, location_address }))}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Latitude</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  keyboardType="numeric"
                  placeholder="48.8566"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={form.location_lat?.toString() || ''}
                  onChangeText={(v) => setForm(p => ({ ...p, location_lat: parseFloat(v) || undefined }))}
                  editable={!loadingLocation}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Longitude</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  keyboardType="numeric"
                  placeholder="2.3522"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={form.location_lng?.toString() || ''}
                  onChangeText={(v) => setForm(p => ({ ...p, location_lng: parseFloat(v) || undefined }))}
                  editable={!loadingLocation}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Timezone</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="e.g. Europe/Paris"
                placeholderTextColor={colors.inputPlaceholder}
                value={form.location_timezone || ''}
                onChangeText={(location_timezone) => setForm(p => ({ ...p, location_timezone }))}
              />
            </View>
          </View>

          {/* ACTIONS */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: BRAND.primary }, (submitting || uploadingMedia) && styles.saveButtonDisabled]}
            onPress={sendPaps}
            disabled={submitting || uploadingMedia}
          >
            {submitting || uploadingMedia ? (
              <View style={styles.buttonLoadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.saveButtonText}>
                  {uploadingMedia ? 'Uploading Media...' : 'Creating...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>
                {postMode === 'draft' ? '📝 Save as Draft' : postMode === 'scheduled' ? '⏰ Schedule Post' : '🚀 Publish Now'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={resetForm}
            disabled={submitting || uploadingMedia}
          >
            <Text style={styles.cancelButtonText}>Reset Form</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Calendar Popup Modal */}
      <Modal
        visible={calendarVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCalendarVisible(false)}
      >
        <TouchableOpacity
          style={styles.calendarOverlay}
          activeOpacity={1}
          onPress={() => setCalendarVisible(false)}
        >
          <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
            <View style={styles.calendarHeader}>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {calendarField === 'start' ? 'Select Start Date' : 'Select End Date'}
              </Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                <Text style={styles.calendarClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [form.start_datetime?.split('T')[0] || '']: { selected: true, selectedColor: BRAND.primary },
                [form.end_datetime?.split('T')[0] || '']: { selected: true, selectedColor: BRAND.secondary || '#60A5FA' },
              }}
              minDate={calendarField === 'end' && form.start_datetime ? form.start_datetime.split('T')[0] : undefined}
              theme={{
                backgroundColor: colors.card,
                calendarBackground: colors.card,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: BRAND.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: BRAND.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textMuted,
                arrowColor: BRAND.primary,
                monthTextColor: colors.text,
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  container: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  formContainer: {
    padding: 16,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4867bb',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  sectionHint: {
    fontSize: 12,
    color: '#A0AEC0',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FAFBFC',
    color: '#2D3748',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
  },

  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipPrimary: {
    borderWidth: 2,
    borderColor: '#4867bb',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Toggle buttons (payment type, visibility)
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFBFC',
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#4867bb',
    borderColor: '#4867bb',
  },
  toggleIcon: {
    fontSize: 16,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  toggleTextActive: {
    color: '#fff',
  },

  // Currency chips
  pickerContainer: {
    marginTop: 4,
  },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  currencyChipActive: {
    backgroundColor: '#4867bb',
    borderColor: '#4867bb',
  },
  currencyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },
  currencyTextActive: {
    color: '#fff',
  },

  // Status chips
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },
  statusTextActive: {
    color: '#fff',
  },

  // Action buttons
  saveButton: {
    backgroundColor: '#4867bb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#E53E3E',
    fontWeight: '600',
  },

  // Media section
  mediaContainer: {
    marginTop: 8,
  },
  mediaGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  mediaPreviewContainer: {
    position: 'relative',
  },
  mediaPreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  mediaRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  mediaRemoveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIndicatorText: {
    color: '#fff',
    fontSize: 12,
  },
  addMediaButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFBFC',
  },
  addMediaIcon: {
    fontSize: 28,
    color: '#A0AEC0',
    fontWeight: '300',
  },
  addMediaText: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 4,
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: {
    fontSize: 13,
    color: '#4867bb',
  },
  
  // Date picker button
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  datePickerIcon: {
    fontSize: 16,
  },
  datePickerText: {
    fontSize: 15,
    flex: 1,
  },
  
  // Calendar modal
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  calendarClose: {
    fontSize: 20,
    color: '#718096',
    padding: 4,
  },
  
  // Post mode selector
  postModeContainer: {
    gap: 10,
  },
  postModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  postModeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  postModeText: {
    flex: 1,
  },
  postModeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  postModeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  postModeCheck: {
    fontSize: 18,
    color: '#4867bb',
    fontWeight: 'bold',
  },
  
  // Location button
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  locationButtonIcon: {
    fontSize: 18,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Post;