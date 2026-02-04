import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars'; // Importamos el tipo DateData para evitar errores

/******************************************************************
 * 📱 CALENDAR SCREEN
 ******************************************************************/
export default function CalendarScreen() {
  // We store the selected date in a state
  const [selected, setSelected] = useState('');

  return (
      <View style={styles.container}>
        
        {/* HEADER SECTION */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Schedule</Text>
          <Text style={styles.headerSubtitle}>Select a date for your job</Text>
        </View>

        {/* CALENDAR COMPONENT */}
        <View style={styles.calendarCard}>
          <Calendar
            // Style the calendar
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: '#0D3B66',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#5DA9E9',
              dayTextColor: '#2d4150',
              arrowColor: '#0D3B66',
              monthTextColor: '#0D3B66',
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
            }}
            // Handler for day press
            onDayPress={(day: DateData) => { // Type definition to avoid "any" error
              console.log('Selected day', day);
              setSelected(day.dateString);
            }}
            // Mark the selected date
            markedDates={{
              [selected]: { 
                selected: true, 
                disableTouchEvent: true, 
                selectedColor: '#0D3B66' 
              }
            }}
          />
        </View>

        {/* SELECTED DATE DISPLAY */}
        {selected ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Selected Date: {selected}</Text>
          </View>
        ) : null}

      </View>
  );
}

/******************************************************************
 * 🎨 STYLES
 ******************************************************************/
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D3B66',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#5DA9E9',
  },
  calendarCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    // Shadow for iOS/Android
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  infoCard: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#5DA9E9',
  },
  infoText: {
    fontSize: 16,
    color: '#0D3B66',
    fontWeight: '600',
  },
});