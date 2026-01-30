import React, { useState,useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import UnderbossBar from '../header/underbossbar';
import ModifyProfil from './ModifyProfil.tsx';
import { serv, ApiError } from '../serve';

// Définition du type pour les données utilisateur (Propre pour TypeScript)
interface UserData {
    nom: string;
    prenom: string;
    pseudo: string;
    dateNaissance: string;
    adresse: string;
    genre: string;
    bio: string;
    langue: string;
    note: number;
}

export default function ProfilePage({ navigation }: any) {
    // État initial de l'utilisateur
    const [user, setUser] = useState<any[]>([])
      const [loading, setLoading] = useState(true)
      const [refreshing, setRefreshing] = useState(false)
      const [error, setError] = useState('')
    const fetchProfile = async () => {
        try {
          const response = await serv('profile.get')
          console.log(response)
          // serv returns { paps: [], total_count: number }
          setUser(response)



          console.log(user)
          setError('')
        } catch (err) {
          console.error('Failed to fetch paps', err)
          const msg = err instanceof ApiError ? err.getUserMessage() : 'Failed to load feed.'
          setError(msg)
        } finally {
          setLoading(false)
          setRefreshing(false)
        }
    }
    
    useEffect(() => {
        fetchProfile()
    }, [])

    return (
        <View style={styles.screen}>
            <UnderbossBar />
            
            <ScrollView contentContainerStyle={styles.container}>
                {/* En-tête : Avatar, Pseudo & Note */}
                <View style={styles.header}>
                    <View style={styles.avatarPlaceholder} />
                    <Text style={styles.pseudo}>@pseudo</Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>⭐ note</Text>
                    </View>
                </View>

                {/* Section : Informations Personnelles */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations personnelles</Text>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Nom</Text>
                        <Text style={styles.value}>nom</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Prénom</Text>
                        <Text style={styles.value}>prenom</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Date de naissance</Text>
                        <Text style={styles.value}>dateNaissance</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Genre</Text>
                        <Text style={styles.value}>genre</Text>
                    </View>
                </View>

                {/* Section : Coordonnées & Préférences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Détails du compte</Text>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Adresse</Text>
                        <Text style={styles.value}>adresse</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Langue</Text>
                        <Text style={styles.value}>langue</Text>
                    </View>
                </View>

                {/* Section : Bio */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bio</Text>
                    <Text style={styles.bioText}>bio</Text>
                </View>

                {/* Bouton de modification */}
                <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={() => navigation.navigate('ModifyProfil', { 
                        currentUser: user, 
                         
                    })}
                >
                    <Text style={styles.editButtonText}>Modifier le profil</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
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
});
