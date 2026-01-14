import {AppRegistry} from 'react-native';
import Underboss from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => Underboss);

AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('app-root'),
});
