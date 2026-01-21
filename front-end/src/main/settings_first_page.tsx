import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, Pressable } from 'react-native';

export default function SettingsFirstPage() {
  // 1. Aquí van nuestros estados (la memoria del componente)
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    // 2. Contenedor Principal
    <View style={styles.container}>
      
      {/* Título de la pantalla */}
      <Text style={styles.headerTitle}>Settings</Text>

      {/* --- SECCIÓN 1: PREFERENCIAS --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencies</Text>
        
        {/* Fila 1: Idioma (Botón simple) 
        <TouchableOpacity style={styles.row}>
         <Text style={styles.rowLabel}>Idioma</Text>
          <Text style={styles.rowValue}>Español ></Text> 
        </TouchableOpacity> */}

        <Pressable 
          onPress={() => console.log('Change language')}
          style={({ pressed }) => [
            styles.row, 
            // Si 'pressed' es true (dedo puesto), bajamos opacidad a 0.5
            // Si 'pressed' es false (dedo fuera), opacidad normal 1.0
            { opacity: pressed ? 0.5 : 1.0, backgroundColor: pressed ? '#fff' : 'white' } 
          ]}
        >
          <Text style={styles.rowLabel}>Language</Text>
          <Text style={styles.rowValue}>English</Text> 
        </Pressable>

        {/* Fila 2: Notificaciones (Switch) */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Notifications</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={notifications ? "#f5dd4b" : "#f4f3f4"}
            onValueChange={() => setNotifications(!notifications)}
            value={notifications}
          />
        </View>
      </View>

      {/* --- SECCIÓN 2: CUENTA --- */}
       <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <Pressable 
            onPress={() => console.log('Ir a perfil')}
            style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.5 : 1.0 }
            ]}
        >
            <Text style={styles.rowLabel}>Edit Profile</Text>
            <Text style={styles.rowValue}></Text>

         </Pressable>
        
         {/*<TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Editar Perfil</Text>
            <Text style={styles.rowValue}>></Text>
         </TouchableOpacity>*/}

     </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupa toda la pantalla
    backgroundColor: '#f2f2f7', // Un gris muy suave tipo iOS
    padding: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20, // Un poco de espacio arriba por si hay "notch"
    color: '#000',
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#fff', // Fondo blanco para agrupar opciones
    borderRadius: 10,       // Bordes redondeados
    paddingHorizontal: 15,
    // Sombra suave (opcional para dar profundidad)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Sombra para Android
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a7a7a7',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 15,
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row', // <--- CLAVE: Pone los elementos lado a lado
    justifyContent: 'space-between', // <--- CLAVE: Separa extremos
    alignItems: 'center', // Centra verticalmente
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLabel: {
    fontSize: 16,
    color: '#333',
  },
  rowValue: {
    fontSize: 16,
    color: '#8e8e93',
  },
});