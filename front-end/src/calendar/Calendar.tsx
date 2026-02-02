import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import UnderbossBar from '../header/underbossbar';

// Interface pour typer une tâche
interface Task {
    id: string;
    title: string;
    client: string;
    time: string;
    status: 'En attente' | 'Accepté' | 'Terminé';
    price: string;
}

export default function Calendar() {
    // Données fictives (Mock Data)
    const [tasks, setTasks] = useState<Task[]>([
        { id: '1', title: 'Livraison de courses', client: 'Mme. Martin', time: '14:30', status: 'Accepté', price: '15€' },
        { id: '2', title: 'Aide au déménagement', client: 'Mr. Bernard', time: '09:00', status: 'En attente', price: '45€' },
        { id: '3', title: 'Nettoyage jardin', client: 'Mme. Petit', time: '11:15', status: 'Accepté', price: '30€' },
    ]);

    // Rendu d'une tâche individuelle
    const renderTaskItem = ({ item }: { item: Task }) => (
        <View style={styles.taskCard}>
            <View style={styles.taskTimeContainer}>
                <Text style={styles.taskTime}>{item.time}</Text>
                <View style={[styles.statusDot, { backgroundColor: item.status === 'Accepté' ? '#48BB78' : '#ECC94B' }]} />
            </View>
            
            <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskClient}>{item.client}</Text>
            </View>

            <View style={styles.taskRight}>
                <Text style={styles.taskPrice}>{item.price}</Text>
                <Text style={styles.statusText}>{item.status}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.screen}>
            <UnderbossBar />
            
            {/* Simulation de la zone Calendrier */}
            <View style={styles.calendarContainer}>
                <View style={styles.calendarPlaceholder}>
                    <Text style={styles.calendarTitle}>Janvier 2026</Text>
                    <View style={styles.daysRow}>
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map((day, index) => (
                            <View key={index} style={index === 2 ? styles.activeDay : styles.dayBox}>
                                <Text style={index === 2 ? styles.activeDayText : styles.dayText}>{day}</Text>
                                <Text style={index === 2 ? styles.activeDayText : styles.dayText}>{28 + index}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Tes missions du jour</Text>
                <FlatList
                    data={tasks}
                    renderItem={renderTaskItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucune tâche pour aujourd'hui.</Text>}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F7FAFC' },
    calendarContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    calendarPlaceholder: { alignItems: 'center' },
    calendarTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 15 },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    dayBox: { alignItems: 'center', padding: 10 },
    activeDay: { alignItems: 'center', padding: 10, backgroundColor: '#3182CE', borderRadius: 10 },
    dayText: { color: '#718096', fontWeight: '500' },
    activeDayText: { color: '#fff', fontWeight: 'bold' },
    
    listSection: { flex: 1, padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#4A5568', marginBottom: 15 },
    listContent: { paddingBottom: 20 },
    
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        // Ombre pour iOS/Android
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    taskTimeContainer: { alignItems: 'center', marginRight: 15, borderRightWidth: 1, borderRightColor: '#EDF2F7', paddingRight: 15 },
    taskTime: { fontSize: 14, fontWeight: 'bold', color: '#2D3748' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
    
    taskInfo: { flex: 1 },
    taskTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A202C' },
    taskClient: { fontSize: 13, color: '#718096', marginTop: 2 },
    
    taskRight: { alignItems: 'flex-end' },
    taskPrice: { fontSize: 15, fontWeight: 'bold', color: '#3182CE' },
    statusText: { fontSize: 11, color: '#A0AEC0', marginTop: 4, textTransform: 'uppercase' },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#A0AEC0' }
});