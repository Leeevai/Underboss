import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import UnderbossBar from '../header/underbossbar';



interface SettingsPageProps {
    logoutUser: () => void;
}

export default function SettingsPage({ logoutUser }: SettingsPageProps) {
    return (
        <View style={styles.screen}>
            <UnderbossBar />
            <View style={styles.container}>
                <Text style={styles.text}>Settings</Text>
                <View style={styles.buttonContainer}>
                    <Button title="Log Out" onPress={logoutUser} color="#d9534f" />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A202C',
        marginBottom: 40,
    },
    buttonContainer: {
        width: '80%',
    },
});
