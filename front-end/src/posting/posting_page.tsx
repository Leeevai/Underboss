import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { serv, ApiError, UserProfile } from '../serve';
import { PapsCreateRequest } from '../serve/paps/types';
import UnderbossBar from '../header/underbossbar';


type PaymentType = 'fixed' | 'hourly' | 'negotiable'
type PapsStatus = 'draft' | 'published' | 'closed' | 'cancelled'
const Post = () => {
	const [user, setUser] = useState<UserProfile | null>(null)
	const [form, setForm] = useState<Partial<PapsCreateRequest>>({
  payment_amount: 0,
});
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [error, setError] = useState('')
  
	

	

	const sendPaps = async () => {
		console.log(form)

    try {
      const rep = await serv('paps.create', form)
      Alert.alert('Success', 'Paps created successfully!')
      setForm({payment_amount: 0})
    } catch (err) {
      console.error('Failed to create paps', err)
      const msg = err instanceof ApiError ? err : 'Failed to create paps.'
      Alert.alert('Error', msg.toString())
    }

		
	}
  const emptyform = async () => {
		
		setForm({payment_amount: 0})
		
	}

	return (
  <KeyboardAvoidingView
    style={styles.screen}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  >
    <UnderbossBar />

    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Create a Paps</Text>
      </View>

      {/* FORM */}
      <View style={styles.formContainer}>

        {/* BASICS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basics</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.value}
              placeholder="Build my landing page"
              placeholderTextColor="#A0AEC0"
              value={form.title}
              onChangeText={(title) =>
                setForm(p => ({ ...p, title }))
              }
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Subtitle</Text>
            <TextInput
              style={styles.value}
              placeholder="Fast & clean work"
              placeholderTextColor="#A0AEC0"
              value={form.subtitle}
              onChangeText={(subtitle) =>
                setForm(p => ({ ...p, subtitle }))
              }
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.value, styles.textArea]}
              placeholder="Describe the job in detail..."
              placeholderTextColor="#A0AEC0"
              value={form.description}
              onChangeText={(description) =>
                setForm(p => ({ ...p, description }))
              }
              multiline
            />
          </View>
        </View>

        {/* PAYMENT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.value}
              keyboardType="numeric"
              value={form.payment_amount?.toString()}
              onChangeText={(v) =>
                setForm(p => ({
                  ...p,
                  payment_amount: Number(v),
                }))
              }
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Currency</Text>
            <TextInput
              style={styles.value}
              placeholder="USD"
              value={form.payment_currency}
              onChangeText={(payment_currency) =>
                setForm(p => ({ ...p, payment_currency }))
              }
            />
          </View>
        </View>

        {/* LIMITS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limits</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Max applicants</Text>
            <TextInput
              style={styles.value}
              keyboardType="numeric"
              placeholder="More than 0..."
              placeholderTextColor="#A0AEC0"
              value={form.max_applicants?.toString()}
              onChangeText={(v) =>
                setForm(p => ({ ...p, max_applicants: Number(v) }))
              }
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Max assignees</Text>
            <TextInput
              style={styles.value}
              keyboardType="numeric"
              value={form.max_assignees?.toString()}
              placeholder="Must not exceed a billion..."
              placeholderTextColor="#A0AEC0"
              onChangeText={(v) =>
                setForm(p => ({ ...p, max_assignees: Number(v) }))
              }
            />
          </View>
        </View>

        {/* LOCATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.value}
              placeholder="Paris, France"
              placeholderTextColor="#A0AEC0"
              value={form.location_address}
              onChangeText={(location_address) =>
                setForm(p => ({ ...p, location_address }))
              }
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={styles.value}
              keyboardType="numeric"
              value={form.location_lat?.toString()}
              placeholder="12.345678"
              placeholderTextColor="#A0AEC0"
              onChangeText={(v) =>
                setForm(p => ({ ...p, location_lat: Number(v) }))
              }
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={styles.value}
              keyboardType="numeric"
              placeholder="-98.765432"
              placeholderTextColor="#A0AEC0"
              value={form.location_lng?.toString()}
              onChangeText={(v) =>
                setForm(p => ({ ...p, location_lng: Number(v) }))
              }
            />
          </View>
        </View>

        {/* VISIBILITY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Public</Text>
            <TouchableOpacity
              onPress={() =>
                setForm(p => ({ ...p, is_public: !p.is_public }))
              }
            >
              <Text style={styles.value}>
                {form.is_public ? 'Yes' : 'No'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Status</Text>
            <TextInput
              style={styles.value}
              placeholder="draft"
              value={form.status}
              onChangeText={(status) =>
                setForm(p => ({ ...p, status: status as any }))
              }
            />
          </View>
        </View>

        {/* ACTIONS */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={sendPaps}
        >
          <Text style={styles.saveButtonText}>Publish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={emptyform}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  </KeyboardAvoidingView>
)
}

const styles = StyleSheet.create({

    screen: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    container: {
        paddingBottom: 30,
    },
    header: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#CBD5E0',
        marginBottom: 15,
    },
    pseudo: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A202C',
    },
    ratingBadge: {
        marginTop: 8,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    ratingText: {
        color: '#92400E',
        fontWeight: '600',
    },
    section: {
        marginTop: 20,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#A0AEC0',
        textTransform: 'uppercase',
        marginBottom: 10,
        letterSpacing: 1.1,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#EDF2F7',
    },
    label: {
        fontSize: 16,
        color: '#718096',
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2D3748',
        maxWidth: '60%', // Pour éviter que l'adresse longue ne casse le layout
        textAlign: 'right',
    },
    bioText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#4A5568',
    },
    editButton: {
        margin: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#1A202C',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    editButtonText: {
        color: '#1A202C',
        fontWeight: '700',
        fontSize: 16,
    },
	
	title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#1A202C' 
    },
	formContainer: { 
        padding: 20 
    },
	row: { 
        flexDirection: 'row', 
        justifyContent: 'space-between' },
	
	
    input: { 
		borderWidth: 1, 
		borderColor: '#E2E8F0', 
		borderRadius: 10, 
		padding: 12, 
		fontSize: 16, 
		backgroundColor: '#F7FAFC',
		color: '#2D3748'
	},
	textArea: { 
        height: 100, 
        textAlignVertical: 'top' },

	saveButton: { 
		backgroundColor: '#4867bb', 
		padding: 16, 
		borderRadius: 12, 
		alignItems: 'center', 
		marginTop: 30 
	},
	saveButtonText: { 
        color: '#fff', 
        fontWeight: 'bold', 
        fontSize: 16 },

	cancelButton: { 
        padding: 15, 
        alignItems: 'center', 
        marginTop: 10 },

	cancelButtonText: {
         color: '#E53E3E', 
         fontWeight: '600' },
    genderContainer: {
        flexDirection: 'row',
        marginTop: 10,
    },

    genderButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: '#F7FAFC',
    },

    genderButtonActive: {
        backgroundColor: '#48BB78',
        borderColor: '#48BB78',
    },

    genderText: {
        color: '#2D3748',
        fontWeight: '600',
    },

    genderTextActive: {
        color: '#fff',
    },
    
});

export default Post;