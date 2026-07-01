import { initializeApp } from 'firebase/app'
import { doc, getDoc, getFirestore } from 'firebase/firestore'

let firestoreInstance = null

function firebaseConfigFromEnv() {
  const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim()
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim()
  if (!projectId || !apiKey) {
    return null
  }
  return {
    apiKey,
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim() || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim() || `${projectId}.appspot.com`,
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim() || undefined,
    appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim() || undefined,
  }
}

export function isFirestoreApiDiscoveryConfigured() {
  return import.meta.env.VITE_FIREBASE_API_DISCOVERY === '1' && Boolean(firebaseConfigFromEnv())
}

function getFirestoreClient() {
  if (firestoreInstance) {
    return firestoreInstance
  }
  const config = firebaseConfigFromEnv()
  if (!config) {
    throw new Error('Firebase web config is incomplete (need VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID).')
  }
  const app = initializeApp(config)
  firestoreInstance = getFirestore(app)
  return firestoreInstance
}

function originFromServerDoc(data) {
  if (!data || typeof data !== 'object') {
    return null
  }
  const publicUrl = typeof data.public_url === 'string' ? data.public_url.trim() : ''
  if (publicUrl) {
    return publicUrl.replace(/\/$/, '')
  }
  const apiBase = typeof data.api_base_url === 'string' ? data.api_base_url.trim() : ''
  if (apiBase) {
    return apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '')
  }
  return null
}

export async function fetchApiOriginFromFirestore() {
  const db = getFirestoreClient()
  const collection = (import.meta.env.VITE_FIRESTORE_SERVER_COLLECTION || 'asdify_servers').trim() || 'asdify_servers'
  const docId = (import.meta.env.VITE_FIRESTORE_SERVER_DOC_ID || 'local_backend').trim() || 'local_backend'
  const snap = await getDoc(doc(db, collection, docId))
  if (!snap.exists()) {
    throw new Error(`Firestore document not found: ${collection}/${docId}`)
  }
  const origin = originFromServerDoc(snap.data())
  if (!origin) {
    throw new Error(`Firestore document ${collection}/${docId} has no public_url or api_base_url.`)
  }
  return { origin, updatedAt: snap.data()?.updated_at ?? null }
}
