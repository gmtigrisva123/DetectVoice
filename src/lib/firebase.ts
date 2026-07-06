import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(config);

// Initialize Firestore with specific database ID from config
const db = getFirestore(app, config.firestoreDatabaseId || 'default');

export { app, db };
