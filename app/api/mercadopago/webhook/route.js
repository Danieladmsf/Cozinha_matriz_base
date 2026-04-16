import { MercadoPagoConfig, Payment } from 'mercadopago';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
    try {
        const url = new URL(req.url);
        
        // O MP envia o ID do pagamento de duas formas comuns (Query String ou Body)
        const idFromQuery = url.searchParams.get('data.id') || url.searchParams.get('id');
        const typeFromQuery = url.searchParams.get('type') || url.searchParams.get('topic');

        let body = {};
        try {
            body = await req.json();
            console.log('[MP_WEBHOOK] Body Recebido:', body);
        } catch(e) {
            console.log('[MP_WEBHOOK] No JSON body parsed');
        }

        const paymentId = idFromQuery || body?.data?.id;
        const eventType = typeFromQuery || body?.type || body?.action;

        if (!paymentId || (eventType !== 'payment' && eventType !== 'payment.created' && eventType !== 'payment.updated')) {
            // Ignora coisas que não são pagamentos (tipo plano criado)
            return Response.json({ received: true });
        }

        console.log(`[MP_WEBHOOK] Processando Pagamento ID: ${paymentId}`);

        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const payment = new Payment(client);
        
        const paymentData = await payment.get({ id: paymentId });
        
        if (!paymentData) {
            return Response.json({ error: 'Pagamento não encontrado no MP' }, { status: 404 });
        }

        const status = paymentData.status; 
        const externalReference = paymentData.external_reference; // É o nosso tenantId!

        console.log(`[MP_WEBHOOK] Pagamento ${paymentId} = ${status} (Reference: ${externalReference})`);

        if (status === 'approved' && externalReference && externalReference.startsWith('tenant_')) {
            const tenantId = externalReference;
            
            // ⏰ 1. Calcula a data de liberação (+30 dias)
            const now = new Date();
            const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            // ✏️ 2. Atualiza a assinatura no tenant (Banco de Dados Firebase Admin)
            const tenantRef = adminDb.collection('tenants').doc(tenantId);
            
            const tenantDoc = await tenantRef.get();
            if (!tenantDoc.exists) {
                 console.log(`[MP_WEBHOOK] Erro: Tenant ${tenantId} não encontrado no banco.`);
                 return Response.json({ received: true });
            }

            const currentData = tenantDoc.data();

            let payloadToUpdate = {
                plan: 'paid',
                updatedAt: now
            };

            // Se o usuário ainda estiver no Trial, substituímos pelo Subscription
            // Se já for pago, apenas extendemos
            if (currentData.subscriptionEndsAt) {
                 // Estende a partir da data que ele vencia, se ele pagou adiantado
                 const currentEnd = currentData.subscriptionEndsAt.toDate ? currentData.subscriptionEndsAt.toDate() : new Date(currentData.subscriptionEndsAt);
                 const validEnd = currentEnd > now ? currentEnd : now;
                 payloadToUpdate.subscriptionEndsAt = new Date(validEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
            } else {
                 payloadToUpdate.subscriptionEndsAt = nextMonth;
            }

            await tenantRef.update(payloadToUpdate);

            // ✏️ 3. Tentar Atualizar também a ref do log em "User" só para segurança visual
            // Sabemos que o ownerId está em tenantDoc
            if (currentData.ownerId) {
                const userRef = adminDb.collection('User').doc(currentData.ownerId);
                await userRef.update(payloadToUpdate).catch(() => {}); // Ignora se o userDoc não existir idêntico
            }

            console.log(`[MP_WEBHOOK] ✅ SUCESSO! Tenant ${tenantId} liberado até ${payloadToUpdate.subscriptionEndsAt.toISOString()}`);
        }

        return Response.json({ received: true, status: 'processed' });

    } catch (error) {
        console.error('[MP_WEBHOOK] Erro crítico:', error);
        // Retornamos 200 pro Mercado Pago parar de ficar enviando de novo, mas a gente avisa
        return Response.json({ received: true, error: error.message });
    }
}
