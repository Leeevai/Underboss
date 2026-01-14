import {AppRegistry} from 'react-native';
import KivAppB from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => KivAppB);

AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('app-root'),
});
