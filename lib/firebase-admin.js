import admin from 'firebase-admin';

// Initialize Firebase Admin for Secure Server Actions
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Se tiver service account configurada
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Em ambiente local default 
            admin.initializeApp();
        }
        console.log('[Firebase Admin] Inicializado com sucesso.');
    } catch (error) {
        console.error('[Firebase Admin] Erro de inicialização:', error);
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
