import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { serv, ApiError, UserProfile } from '../serve';
import ProfilePage from './ProfilePage';




const ModifyProfil = ({ navigation}: any) => {
	const [user, setUser] = useState<UserProfile | null>(null)
	const [form, setForm] = useState<Partial<UserProfile>>({})
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [error, setError] = useState('')

	const fetchProfile = async () => {
		try {
			const response = await serv('profile.get')
			setUser(response)
			setForm({
				username: response.username ?? '',
				first_name: response.first_name ?? '',
				last_name: response.last_name ?? '',
				bio: response.bio ?? '',
				//gender: response.gender ?? '',
				location_lat: response.location_lat ?? '',
				location_lng: response.location_lng ?? '',
				location_address: response.location_address ?? '',
                preferred_language: response.language ?? '',
                //date_of_birth: response.date_of_birth ?? '2000-01-01',
                updated_at: response.updated_at ?? '',
			})
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
	}, [])

	const handleSave = async () => {
		
		await serv('profile.update', form)
		navigation.navigate(ProfilePage)
		
	}

	return (
		<KeyboardAvoidingView 
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
			style={{ flex: 1 }}
		>
			<ScrollView style={styles.screen}>
				<View style={styles.header}>
					<Text style={styles.title}>Editing profil ...</Text>
				</View>

				<View style={styles.formContainer}>
					<Text style={styles.label}>Username - {form.username}</Text>


					<View style={styles.row}>
						<View style={{ flex: 1, marginRight: 10 }}>
							<Text style={styles.label}>First Name</Text>
							<TextInput
								style={styles.input}
								value={(form.first_name ?? '') as string}
								onChangeText={(text) => setForm(prev => ({ ...prev, first_name: text }))}
							/>
						</View>
						<View style={{ flex: 1 }}>
							<Text style={styles.label}>Last Name</Text>
							<TextInput
								style={styles.input}
								value={(form.last_name ?? '') as string}
								onChangeText={(text) => setForm(prev => ({ ...prev, last_name: text }))}
							/>
						</View>
					</View>

					<Text style={styles.label}>Postal adresse </Text>
					<TextInput
						style={styles.input}
						value={(form.location_address ?? '') as string}
						onChangeText={(text) => setForm(prev => ({ ...prev, location_address: text }))}
						multiline
					/>

					{/* <Text style={styles.label}>Gender </Text>
					<TextInput
						style={styles.input}
						value={(form.gender ?? '') as string}
						onChangeText={(text) => setForm(prev => ({ ...prev, gender: text }))}
						multiline
					/> */}
					<Text style={styles.label}>Langue</Text>
					<TextInput
						style={styles.input}
						value={(form.preferred_language ?? '') as string}
						onChangeText={(text) => setForm(prev => ({ ...prev, preferred_language: text }))}
					/>

					<Text style={styles.label}>Bio</Text>
					<TextInput 
						style={[styles.input, styles.textArea]} 
						value={(form.bio ?? '') as string}
						onChangeText={(text) => setForm(prev => ({ ...prev, bio: text }))}
						multiline 
						numberOfLines={4}
					/>

					<TouchableOpacity style={styles.saveButton} onPress={handleSave}>
						<Text style={styles.saveButtonText}>Save</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
						<Text style={styles.cancelButtonText}>go back without saving</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	screen: { 
        flex: 1, 
        backgroundColor: '#fff' 
    },
	header: { 
        padding: 20, 
        paddingTop: 40, 
        borderBottomWidth: 1, 
        borderBottomColor: 
        '#E2E8F0' 
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
	label: { 
        fontSize: 14, 
        fontWeight: 'bold', 
        color: '#4A5568', 
        marginBottom: 8,
        marginTop: 10 },
	
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
		backgroundColor: '#48BB78', 
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

export default ModifyProfil;