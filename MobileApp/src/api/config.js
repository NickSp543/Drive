import { Platform } from 'react-native';

const API_URL = Platform.select({
    android: 'http://10.0.2.2:3000/api', 
    ios: 'http://localhost:3000/api',
});

export default API_URL;