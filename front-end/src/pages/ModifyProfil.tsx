import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

const ModifyProfil = ({ navigation, route }: any) => {
    // 1. Récupération des données et de la fonction de sauvegarde depuis la navigation
    const { currentUser, onSave } = route.params;

    // 2. Initialisation des états avec les valeurs actuelles
    const [nom, setNom] = useState(currentUser.nom);
    const [prenom, setPrenom] = useState(currentUser.prenom);
    const [pseudo, setPseudo] = useState(currentUser.pseudo);
    const [adresse, setAdresse] = useState(currentUser.adresse);
    const [bio, setBio] = useState(currentUser.bio);
    const [genre, setGenre] = useState(currentUser.genre);
    const [langue, setLangue] = useState(currentUser.langue);

    const handleSave = () => {
        // 3. On crée l'objet avec les nouvelles valeurs
        const updatedUser = {
            ...currentUser, // On garde les champs non modifiables (comme la note)
            nom,
            prenom,
            pseudo,
            adresse,
            bio,
            genre,
            langue
        };

        // 4. On appelle la fonction de sauvegarde passée en paramètre
        onSave(updatedUser);
        
        // 5. Retour à la page précédente
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
        >
            <ScrollView style={styles.screen}>
                <View style={styles.header}>
                    <Text style={styles.title}>Modifier le profil</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Pseudo</Text>
                    <TextInput style={styles.input} value={pseudo} onChangeText={setPseudo} placeholder="Ex: baby" />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.label}>Prénom</Text>
                            <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Nom</Text>
                            <TextInput style={styles.input} value={nom} onChangeText={setNom} />
                        </View>
                    </View>

                    <Text style={styles.label}>Adresse</Text>
                    <TextInput style={styles.input} value={adresse} onChangeText={setAdresse} multiline />

                    <Text style={styles.label}>Genre</Text>
                    <TextInput style={styles.input} value={genre} onChangeText={setGenre} />

                    <Text style={styles.label}>Langue</Text>
                    <TextInput style={styles.input} value={langue} onChangeText={setLangue} />

                    <Text style={styles.label}>Bio</Text>
                    <TextInput 
                        style={[styles.input, styles.textArea]} 
                        value={bio} 
                        onChangeText={setBio} 
                        multiline 
                        numberOfLines={4}
                    />

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
    formContainer: { padding: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 14, fontWeight: 'bold', color: '#4A5568', marginBottom: 8, marginTop: 10 },
    input: { 
        borderWidth: 1, 
        borderColor: '#E2E8F0', 
        borderRadius: 10, 
        padding: 12, 
        fontSize: 16, 
        backgroundColor: '#F7FAFC',
        color: '#2D3748'
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    saveButton: { 
        backgroundColor: '#48BB78', 
        padding: 16, 
        borderRadius: 12, 
        alignItems: 'center', 
        marginTop: 30 
    },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    cancelButton: { padding: 15, alignItems: 'center', marginTop: 10 },
    cancelButtonText: { color: '#E53E3E', fontWeight: '600' }
});

export default ModifyProfil;