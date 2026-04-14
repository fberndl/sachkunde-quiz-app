import { AppRegistry } from 'react-native';
import App from '../App';

AppRegistry.registerComponent('WienQuiz', () => App);
AppRegistry.runApplication('WienQuiz', {
  rootTag: document.getElementById('root'),
});
