import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { serv, ApiError, UserProfile } from '../serve';
import ProfilePage from './ProfilePage';
import UnderbossBar from '../header/underbossbar';
import { useTheme, BRAND, SPACING, RADIUS, FONT_SIZE, createShadow } from '../common/theme';

const ModifyProfil = ({ navigation}: any) => {
	const { colors, isDark } = useTheme();
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
                date_of_birth: response.date_of_birth ?? '2000-01-01',
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
			style={[styles.screen, { backgroundColor: colors.background }]}
		>
			<UnderbossBar />
			<ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={[styles.header, { backgroundColor: colors.card }]}>
					<Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
					<Text style={[styles.subtitle, { color: colors.textSecondary }]}>Update your personal information</Text>
				</View>

				<View style={styles.formContainer}>
					<View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
						<Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Account</Text>
						<Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
						<View style={[styles.readOnlyField, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
							<Text style={[styles.readOnlyText, { color: colors.textMuted }]}>{form.username}</Text>
						</View>
					</View>

					<View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
						<Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Personal Info</Text>
						<View style={styles.row}>
							<View style={{ flex: 1, marginRight: 10 }}>
								<Text style={[styles.label, { color: colors.textSecondary }]}>First Name</Text>
								<TextInput
									style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
									placeholderTextColor={colors.inputPlaceholder}
									value={(form.first_name ?? '') as string}
									onChangeText={(text) => setForm(prev => ({ ...prev, first_name: text }))}
								/>
							</View>
							<View style={{ flex: 1 }}>
								<Text style={[styles.label, { color: colors.textSecondary }]}>Last Name</Text>
								<TextInput
									style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
									placeholderTextColor={colors.inputPlaceholder}
									value={(form.last_name ?? '') as string}
									onChangeText={(text) => setForm(prev => ({ ...prev, last_name: text }))}
								/>
							</View>
						</View>
						<View style={{ flex: 1 }}>
								<Text style={[styles.label, { color: colors.textSecondary }]}>Birth date</Text>
								<TextInput
									style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
									placeholderTextColor={colors.inputPlaceholder}
									placeholder='YYYY-MM-DD'
									value={(form.date_of_birth ?? '') as string}
									onChangeText={(text) => setForm(prev => ({ ...prev, date_of_birth: text }))}
								/>
							</View>

						<Text style={[styles.label, { color: colors.textSecondary }]}>Bio</Text>
						<TextInput 
							style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]} 
							placeholderTextColor={colors.inputPlaceholder}
							placeholder="Tell us about yourself..."
							value={(form.bio ?? '') as string}
							onChangeText={(text) => setForm(prev => ({ ...prev, bio: text }))}
							multiline 
							numberOfLines={4}
						/>
					</View>

					<View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
						<Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Location</Text>
						<Text style={[styles.label, { color: colors.textSecondary }]}>Address</Text>
						<TextInput
							style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
							placeholderTextColor={colors.inputPlaceholder}
							placeholder="Your location"
							value={(form.location_address ?? '') as string}
							onChangeText={(text) => setForm(prev => ({ ...prev, location_address: text }))}
						/>
					</View>

					<View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, isDark)]}>
						<Text style={[styles.sectionTitle, { color: BRAND.primary }]}>Preferences</Text>
						<Text style={[styles.label, { color: colors.textSecondary }]}>Preferred Language</Text>
						<TextInput
							style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
							placeholderTextColor={colors.inputPlaceholder}
							placeholder="e.g. English"
							value={(form.preferred_language ?? '') as string}
							onChangeText={(text) => setForm(prev => ({ ...prev, preferred_language: text }))}
						/>
					</View>

					<TouchableOpacity style={[styles.saveButton, { backgroundColor: BRAND.accent }]} onPress={handleSave}>
						<Text style={styles.saveButtonText}>Save Changes</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
						<Text style={[styles.cancelButtonText, { color: colors.error }]}>Cancel</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	screen: { 
		flex: 1,
	},
	scrollContent: {
		flex: 1,
	},
	header: { 
		padding: SPACING.lg,
		alignItems: 'center',
	},
	title: { 
		fontSize: FONT_SIZE.xl, 
		fontWeight: 'bold',
	},
	subtitle: {
		fontSize: FONT_SIZE.sm,
		marginTop: SPACING.xs,
	},
	formContainer: { 
		padding: SPACING.md,
	},
	section: {
		marginBottom: SPACING.md,
		padding: SPACING.md,
		borderRadius: RADIUS.lg,
	},
	sectionTitle: {
		fontSize: FONT_SIZE.xs,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 1,
		marginBottom: SPACING.md,
	},
	row: { 
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	label: { 
		fontSize: FONT_SIZE.sm, 
		fontWeight: '600',
		marginBottom: SPACING.xs,
		marginTop: SPACING.sm,
	},
	readOnlyField: {
		borderWidth: 1,
		borderRadius: RADIUS.md,
		padding: SPACING.md,
	},
	readOnlyText: {
		fontSize: FONT_SIZE.md,
	},
	input: { 
		borderWidth: 1,
		borderRadius: RADIUS.md, 
		padding: SPACING.md, 
		fontSize: FONT_SIZE.md,
	},
	textArea: { 
		height: 100, 
		textAlignVertical: 'top',
	},
	saveButton: { 
		padding: SPACING.md, 
		borderRadius: RADIUS.lg, 
		alignItems: 'center', 
		marginTop: SPACING.xl,
	},
	saveButtonText: { 
		color: '#fff', 
		fontWeight: 'bold', 
		fontSize: FONT_SIZE.md,
	},
	cancelButton: { 
		padding: SPACING.md, 
		alignItems: 'center', 
		marginTop: SPACING.sm,
	},
	cancelButtonText: {
		fontWeight: '600',
	},
});

export default ModifyProfil;