import {View, Text, StyleSheet, Button} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function UnderbossBar() {
    return (
        <View style={{flexDirection:'row', height: 70, backgroundColor: '#2c2d2e19' }}>
            <View style={{flex : 10, justifyContent:'center',  alignItems: 'left' }}>
                <Text style={{fontSize: 30, fontWeight: 'bold', textAlign: 'left', marginTop: 10, paddingLeft: 10, color:"#000000" }}>underboss</Text>
            </View>
             <View style={{flex : 1, justifyContent:'center',  alignItems: 'left' }}>
                <Text style={{fontSize: 30}}>☎</Text>
            </View>
            <View style={{flex : 1, justifyContent:'center',  alignItems: 'left' }}>
                <Text style={{fontSize: 30}}>🛠</Text>
            </View>
            <View style={{flex : 1, justifyContent:'center',  alignItems: 'left' }}>
                <Text style={{fontSize: 30}}>👤</Text>
            </View>
           
           
        

            
          </View>
     )
    }