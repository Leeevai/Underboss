import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { launchImageLibrary } from 'react-native-image-picker';


export default function Post() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);

  const managePost = () => {
    Alert.alert(`Posting: ${title}`);
    
  };

  // -------------------------------------------------------
  // 📝 DROPDOWN DATA
  // -------------------------------------------------------

  const data = [
    { label: 'Gardering', value: '1' },
    { label: 'Plumber', value: '2' },
    { label: 'Painter', value: '3' },
    { label: 'Item 4', value: '4' },
    { label: 'Item 5', value: '5' },
    { label: 'Item 6', value: '6' },
    { label: 'Item 7', value: '7' },
    { label: 'Item 8', value: '8' },
  ];

  const renderLabel = () => {
    if (value || isFocus) {
      return (
        <Text style={[styles.labelFlotante, isFocus && { color: 'blue' }]}>
          Dropdown label
        </Text>
      );
    }
    return null;
  };
// -------------------------------------------------------
  // 📝 IMAGES
  // -------------------------------------------------------
 
  // -------------------------------------------------------
  // 📝 MAIN RENDER
  // -------------------------------------------------------

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>New ASAP</Text>

      <View style={styles.form}>
        <Text style={styles.label}>ASAP title</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej.React Native developer"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>ASAP description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Which profile are you looking for?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.labelInput}>Category</Text>

        {renderLabel()}

        <Dropdown
          style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={data}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? 'Select a category' : '...'}
          searchPlaceholder="Search..."
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={item => {
            setValue(item.value);
            setIsFocus(false);
          }}
          renderLeftIcon={() => (
            <AntDesign
              style={styles.icon}
              color={isFocus ? 'blue' : 'black'}
              name="safety"   // <- prueba en minúsculas
              size={20}
            />
          )}
        />
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={[styles.input]}
          placeholder="Eg. Luxemburg"
          value={description}
          onChangeText={setDescription}
          
        />
        <Text style={styles.label}>Estimated duration</Text>
        <TextInput
          style={[styles.input]}
          placeholder="Eg. 2-3 hours"
          value={description}
          onChangeText={setDescription}
          
        />

         <Text style={styles.label}>Payment</Text>
         <TextInput
          style={[styles.input]}
          placeholder="Eg. 30$"
          value={description}
          onChangeText={setDescription}
          
        />
        
       

        <TouchableOpacity style={styles.boton} onPress={managePost}>
          <Text style={styles.textoBoton}>Post ASAP</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
    textAlign: 'center',
  },
  labelInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D3B66',
    marginBottom: 8,
    marginTop: 15,
  },
  form: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  boton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  labelFlotante: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  uploadCard: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed', // <--- Esto hace el efecto de puntitos
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FBFF', // Un azulito muy tenue de fondo
    marginBottom: 20,
  },
  uploadText: {
    fontSize: 16,
    color: '#0D3B66',
    marginVertical: 10,
    textAlign: 'center',
  },
  miniButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  miniButtonText: {
    color: '#0D3B66',
    fontWeight: '600',
  },
});
