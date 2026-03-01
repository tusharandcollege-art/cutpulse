/**
 * Firebase Admin SDK — used server-side only (API routes, never in the browser).
 * Initialized once and cached to avoid re-initialization in dev with hot reload.
 */
import admin from 'firebase-admin'

const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
} = process.env

const bucketName = NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ?? `${FIREBASE_PROJECT_ID}.firebasestorage.app`

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: bucketName,
    })
}

export const adminStorage = admin.storage().bucket()
export const adminDb = admin.firestore()
export const storageBucketName = bucketName
