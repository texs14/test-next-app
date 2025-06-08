// Firebase admin is not available in this environment
// Replace with no-op implementations

function getApps() { return [] as any }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function initializeApp(_: any) { /* no-op */ }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cert(_: any) { return {} as any }
function getFirestore() { return {} as any }

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
