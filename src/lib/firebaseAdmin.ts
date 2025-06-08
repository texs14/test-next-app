import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export function getAdminFirestore() {
  if (!getApps().length) {
    const projectId = process.env.GOOGLE_PROJECT_ID
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Google credentials')
    }
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey })
    })
  }
  return getFirestore()
}
