import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { launchImageLibrary } from 'react-native-image-picker';

// Import serve API
import { 
  serv, 
  type Category, 
  type PapsCreateRequest, 
  type PapsCreateResponse,
  type PaymentType 
} from '../serve';

// -------------------------------------------------------
// 📝 TYPES
// -------------------------------------------------------

interface DropdownItem {
  label: string;
  value: string;
}

interface PaymentTypeItem {
  label: string;
  value: PaymentType;
}

// -------------------------------------------------------
// 📝 CONSTANTS
// -------------------------------------------------------

const PAYMENT_TYPE_OPTIONS: PaymentTypeItem[] = [
  { label: 'Fixed Price', value: 'fixed' },
  { label: 'Hourly Rate', value: 'hourly' },
  { label: 'Negotiable', value: 'negotiable' },
];

export default function Post() {
  // -------------------------------------------------------
  // 📝 FORM STATE
  // -------------------------------------------------------
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('fixed');

  // -------------------------------------------------------
  // 📝 CATEGORY STATE
  // -------------------------------------------------------
  const [categories, setCategories] = useState<DropdownItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoryFocus, setIsCategoryFocus] = useState(false);
  const [isPaymentTypeFocus, setIsPaymentTypeFocus] = useState(false);

  // -------------------------------------------------------
  // 📝 LOADING STATE
  // -------------------------------------------------------
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------
  // 📝 FETCH CATEGORIES ON MOUNT
  // -------------------------------------------------------
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await serv<{ categories: Category[] }>('categories.list');
      
      // Transform categories to dropdown format
      const dropdownData: DropdownItem[] = response.categories.map(cat => ({
        label: cat.name,
        value: cat.category_id,
      }));
      
      setCategories(dropdownData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // -------------------------------------------------------
  // 📝 FORM VALIDATION
  // -------------------------------------------------------
  const validateForm = (): string | null => {
    if (!title || title.length < 5) {
      return 'Title must be at least 5 characters';
    }
    if (!description || description.length < 20) {
      return 'Description must be at least 20 characters';
    }
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      return 'Please enter a valid payment amount';
    }
    return null;
  };

  // -------------------------------------------------------
  // 📝 SUBMIT HANDLER
  // -------------------------------------------------------
  const handleSubmit = async () => {
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      // Parse duration to minutes (simple parsing)
      let durationMinutes: number | undefined;
      if (estimatedDuration) {
        const hoursMatch = estimatedDuration.match(/(\d+)\s*h/i);
        const minutesMatch = estimatedDuration.match(/(\d+)\s*m/i);
        durationMinutes = 
          (hoursMatch ? parseInt(hoursMatch[1]) * 60 : 0) + 
          (minutesMatch ? parseInt(minutesMatch[1]) : 0);
        
        // If just a number, assume hours
        if (!durationMinutes && /^\d+$/.test(estimatedDuration.trim())) {
          durationMinutes = parseInt(estimatedDuration) * 60;
        }
      }

      // Build request
      const request: PapsCreateRequest = {
        title: title.trim(),
        description: description.trim(),
        payment_amount: parseFloat(paymentAmount),
        payment_currency: 'USD',
        payment_type: paymentType,
        status: 'draft', // Start as draft
      };

      // Add optional fields
      if (locationAddress) {
        request.location_address = locationAddress.trim();
      }
      if (durationMinutes && durationMinutes > 0) {
        request.estimated_duration_minutes = durationMinutes;
      }
      if (selectedCategory) {
        request.categories = [selectedCategory];
      }

      // Create PAPS
      const response = await serv<PapsCreateResponse>('paps.create', {
        body: request,
      });

      Alert.alert(
        'Success! 🎉', 
        'Your job posting has been created as a draft.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Reset form
              setTitle('');
              setDescription('');
              setLocationAddress('');
              setEstimatedDuration('');
              setPaymentAmount('');
              setPaymentType('fixed');
              setSelectedCategory(null);
            }
          }
        ]
      );

      console.log('PAPS created:', response.paps_id);

    } catch (error: any) {
      console.error('Failed to create PAPS:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to create job posting. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------
  // 📝 RENDER HELPERS
  // -------------------------------------------------------
  const renderCategoryLabel = () => {
    if (selectedCategory || isCategoryFocus) {
      return (
        <Text style={[styles.labelFlotante, isCategoryFocus && { color: 'blue' }]}>
          Category
        </Text>
      );
    }
    return null;
  };

  // -------------------------------------------------------
  // 📝 MAIN RENDER
  // -------------------------------------------------------

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create Job Posting</Text>

      <View style={styles.form}>
        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. React Native Developer Needed"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the job requirements, skills needed, and any other relevant details..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={5000}
        />

        {/* Category */}
        <Text style={styles.labelInput}>Category</Text>
        {renderCategoryLabel()}
        {isLoadingCategories ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : (
          <Dropdown
            style={[styles.dropdown, isCategoryFocus && { borderColor: 'blue' }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={categories}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isCategoryFocus ? 'Select a category' : '...'}
            searchPlaceholder="Search categories..."
            value={selectedCategory}
            onFocus={() => setIsCategoryFocus(true)}
            onBlur={() => setIsCategoryFocus(false)}
            onChange={item => {
              setSelectedCategory(item.value);
              setIsCategoryFocus(false);
            }}
            renderLeftIcon={() => (
              <AntDesign
                style={styles.icon}
                color={isCategoryFocus ? 'blue' : 'black'}
                name="appstore-o"
                size={20}
              />
            )}
          />
        )}

        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Luxembourg City, Luxembourg"
          value={locationAddress}
          onChangeText={setLocationAddress}
        />

        {/* Estimated Duration */}
        <Text style={styles.label}>Estimated Duration</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2-3 hours, 1 day, 2h 30m"
          value={estimatedDuration}
          onChangeText={setEstimatedDuration}
        />

        {/* Payment Amount */}
        <Text style={styles.label}>Payment Amount (USD) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 50"
          value={paymentAmount}
          onChangeText={setPaymentAmount}
          keyboardType="decimal-pad"
        />

        {/* Payment Type */}
        <Text style={styles.labelInput}>Payment Type</Text>
        <Dropdown
          style={[styles.dropdown, isPaymentTypeFocus && { borderColor: 'blue' }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          iconStyle={styles.iconStyle}
          data={PAYMENT_TYPE_OPTIONS}
          maxHeight={200}
          labelField="label"
          valueField="value"
          placeholder="Select payment type"
          value={paymentType}
          onFocus={() => setIsPaymentTypeFocus(true)}
          onBlur={() => setIsPaymentTypeFocus(false)}
          onChange={item => {
            setPaymentType(item.value);
            setIsPaymentTypeFocus(false);
          }}
          renderLeftIcon={() => (
            <AntDesign
              style={styles.icon}
              color={isPaymentTypeFocus ? 'blue' : 'black'}
              name="creditcard"
              size={20}
            />
          )}
        />

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.boton, isSubmitting && styles.botonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.textoBoton}>Create Job Posting</Text>
          )}
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
    color: '#0D3B66',
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
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
    color: '#0D3B66',
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
  botonDisabled: {
    backgroundColor: '#999',
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
    marginBottom: 20,
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
    color: '#999',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
  },
  uploadCard: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FBFF',
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
