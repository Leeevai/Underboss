import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { serv, ApiError, PaymentType, PapsStatus, Currency, getMediaUrl } from '../serve';
import { PapsCreateRequest } from '../serve/paps/types';
import { getCategoryColor } from '../cache/categories';
import UnderbossBar from '../header/underbossbar';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { useTheme, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, BRAND, createShadow } from '../common/theme';
import { activeCategoriesAtom ,useCategories} from '../cache/categories';
import { useAtom } from 'jotai';

// =============================================================================
// CONSTANTS
// =============================================================================

const PAYMENT_TYPES: { value: PaymentType; label: string; icon: string }[] = [
  { value: 'fixed', label: 'Fixed', icon: '💰' },
  { value: 'hourly', label: 'Hourly', icon: '⏱️' },
  { value: 'negotiable', label: 'Negotiable', icon: '🤝' },
];

const PAPS_STATUSES: { value: PapsStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: '#A0AEC0' },
  { value: 'published', label: 'Published', color: '#38A169' },
  { value: 'open', label: 'Open', color: '#3182CE' },
  { value: 'closed', label: 'Closed', color: '#E53E3E' },
  { value: 'cancelled', label: 'Cancelled', color: '#718096' },
];

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'];

const MAX_MEDIA_FILES = 10;
const ALLOWED_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];

const DEFAULT_FORM: Partial<PapsCreateRequest> = {
  payment_amount: 0,
  payment_currency: 'USD',
  payment_type: 'fixed',
  max_applicants: 10,
  max_assignees: 1,
  is_public: true,
  status: 'draft',
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
  const [categories] = useAtom(activeCategoriesAtom);
  

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

  const setPrimaryCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const next = prev.map(c => ({ ...c, isPrimary: c.id === categoryId }));
      syncFormCategories(next);
      return next;
    });
  };

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
      // Convert assets to blobs/files for upload
      const files: Blob[] = [];
      
      for (const asset of mediaFiles) {
        if (asset.uri) {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          files.push(blob);
        }
      }

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

    // Build categories array for API
    const categoriesPayload = selectedCategories.map(c => ({
      category_id: c.id,
      is_primary: c.isPrimary,
    }));

    const payload: Partial<PapsCreateRequest> = {
      ...form,
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

      Alert.alert('Success', 'Paps created successfully!');
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
              <Text style={styles.label}>Subtitle</Text>
              <TextInput
                style={styles.input}
                placeholder="A short tagline for your job"
                placeholderTextColor="#A0AEC0"
                value={form.subtitle}
                onChangeText={(subtitle) => setForm(p => ({ ...p, subtitle }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the job in detail (min 20 chars)..."
                placeholderTextColor="#A0AEC0"
                value={form.description}
                onChangeText={(description) => setForm(p => ({ ...p, description }))}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* CATEGORIES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Text style={styles.sectionHint}>Select several categories. Tap again to set primary; long-press to remove.</Text>

            <View style={styles.categoriesGrid}>
              {categories?.map((cat: any) => {
                const isSelected = selectedCategories.some(c => c.id === cat.category_id);
                const isPrimary = selectedCategories.some(c => c.id === cat.category_id && c.isPrimary);
                const chipColor = getCategoryColor?.(cat) || '#E2E8F0';
                return (
                  <TouchableOpacity
                    key={cat.category_id}
                    style={[
                      styles.categoryChip,
                      { borderColor: '#486a97' },
                      isPrimary && styles.categoryChipPrimary,
                    ]}
                    onPress={() => toggleCategory(cat.category_id)}
                    onLongPress={() => removeCategory(cat.category_id)}
                  >
                    <Text style={[styles.categoryChipText, { color:'#4A5568' }]}>
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

          {/* SCHEDULE */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Schedule</Text>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Start Date/Time</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholder="YYYY-MM-DDTHH:mm"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={form.start_datetime || ''}
                  onChangeText={(v) => setForm(p => ({ ...p, start_datetime: v }))}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>End Date/Time</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholder="YYYY-MM-DDTHH:mm"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={form.end_datetime || ''}
                  onChangeText={(v) => setForm(p => ({ ...p, end_datetime: v }))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Estimated Duration (minutes)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                keyboardType="numeric"
                placeholder="e.g. 120"
                placeholderTextColor={colors.inputPlaceholder}
                value={form.estimated_duration_minutes?.toString() || ''}
                onChangeText={(v) => setForm(p => ({ ...p, estimated_duration_minutes: parseInt(v) || undefined }))}
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
                  onChangeText={(v) => setForm(p => ({ ...p, max_applicants: parseInt(v) || 10 }))}
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
                  onChangeText={(v) => setForm(p => ({ ...p, max_assignees: parseInt(v) || 1 }))}
                />
              </View>
            </View>
          </View>

          {/* LOCATION */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Location</Text>

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

          {/* VISIBILITY & STATUS */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
            <Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Visibility & Status</Text>

            {/* Public Toggle */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Visibility</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                    form.is_public && { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
                  ]}
                  onPress={() => setForm(p => ({ ...p, is_public: true }))}
                >
                  <Text style={styles.toggleIcon}>🌍</Text>
                  <Text style={[styles.toggleText, { color: colors.textSecondary }, form.is_public && styles.toggleTextActive]}>Public</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                    !form.is_public && { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
                  ]}
                  onPress={() => setForm(p => ({ ...p, is_public: false }))}
                >
                  <Text style={styles.toggleIcon}>🔒</Text>
                  <Text style={[styles.toggleText, { color: colors.textSecondary }, !form.is_public && styles.toggleTextActive]}>Private</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
              <View style={styles.statusRow}>
                {PAPS_STATUSES.map((st) => (
                  <TouchableOpacity
                    key={st.value}
                    style={[
                      styles.statusChip,
                      { backgroundColor: colors.inputBg, borderColor: colors.border },
                      form.status === st.value && { backgroundColor: st.color },
                    ]}
                    onPress={() => setForm(p => ({ ...p, status: st.value }))}
                  >
                    <Text style={[
                      styles.statusText,
                      { color: colors.textSecondary },
                      form.status === st.value && styles.statusTextActive,
                    ]}>
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Publish/Expires dates */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Publish At</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholder="YYYY-MM-DDTHH:mm"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={form.publish_at || ''}
                  onChangeText={(v) => setForm(p => ({ ...p, publish_at: v || undefined }))}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Expires At</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholder="YYYY-MM-DDTHH:mm"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={form.expires_at || ''}
                  onChangeText={(v) => setForm(p => ({ ...p, expires_at: v || undefined }))}
                />
              </View>
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
                {form.status === 'draft' ? 'Save as Draft' : 'Publish Paps'}
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
});

export default Post;