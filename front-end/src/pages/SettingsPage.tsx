import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import UnderbossBar from '../header/underbossbar';
import AppSettings from '../AppSettings';



interface SettingsPageProps {
    logoutUser: () => void;
}

export default function SettingsPage({ logoutUser }: SettingsPageProps) {
    return (
         <View style={styles.screen}>
                    <UnderbossBar />
                    
                    <ScrollView contentContainerStyle={styles.container}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Informations</Text>
                            
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Token</Text>
                                <Text style={styles.value}>{AppSettings.token}</Text>
                            </View>
        
                             <View style={styles.infoRow}>
                                <Text style={styles.label}>Username</Text>
                                <Text style={styles.value}>{AppSettings.username}</Text>
                            </View>
        
            
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>User Id</Text>
                                <Text style={styles.value}>{AppSettings.userId}</Text>
                            </View>
        
                        
        
                        
                        {/* <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Details</Text>
                            
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Postal adresse</Text>
                                <Text style={styles.value}>{AppSettings.userProfile}</Text>
                            </View> */}
        
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Auto rotate</Text>
                                <Text style={styles.value}>{AppSettings.autoRotate}</Text>
                            </View>
                        
                            <Text style={styles.label}>Notification</Text>
                            <Text style={styles.value}>{AppSettings.notifications}</Text>
                        </View>
        
                        {/* Bouton de modification */}
                        <TouchableOpacity 
                            style={styles.editButton} 
                            onPress={logoutUser}
                        >
                            <Text style={styles.editButtonText}>Logout</Text>
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
        maxWidth: '60%', 
        textAlign: 'right',
    },
   
    editButton: {
        margin: 20,
        backgroundColor: '#b90202',
        borderWidth: 1,
        borderColor: '#605959',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    editButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 20,
    },
});
