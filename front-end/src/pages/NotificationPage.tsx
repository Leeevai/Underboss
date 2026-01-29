import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import UnderbossBar from '../header/underbossbar';

export default function NotificationPage() {
    return (
        <View style={styles.screen}>
            <UnderbossBar />
            <View style={styles.container}>
                <Text style={styles.text}>Notifications</Text>
                <Text style={styles.subtext}>You're all caught up!</Text>
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
    },
    subtext: {
        fontSize: 16,
        color: '#718096',
        marginTop: 10,
    },
});
