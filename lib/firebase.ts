// Firebase client SDK — used for browser → Storage uploads, Auth, and Firestore
import { initializeApp, getApps } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: 'AIzaSyDExdK7v6mP-x9CdRUMceUNjkvupnJtVr8',
    authDomain: 'seedance-app.firebaseapp.com',
    projectId: 'seedance-app',
    storageBucket: 'seedance-app.firebasestorage.app',
    messagingSenderId: '455714900154',
    appId: '1:455714900154:web:c3ecf76b3f2f7305be1a83',
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const storage = getStorage(app)
export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app)
