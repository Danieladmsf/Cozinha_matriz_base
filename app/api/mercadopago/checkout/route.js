import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(req) {
    try {
        const body = await req.json();
        const { tenantId, email } = body;

        console.log('[MP_CHECKOUT] Iniciando checkout para:', email, tenantId);

        if (!tenantId || !email) {
            return Response.json({ error: 'Faltam dados obrigatórios (tenantId ou email)' }, { status: 400 });
        }

        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            console.error('[MP_CHECKOUT] MERCADOPAGO_ACCESS_TOKEN não está no .env.local');
            return Response.json({ error: 'Configuração do servidor ausente' }, { status: 500 });
        }

        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const preference = new Preference(client);
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const result = await preference.create({
            body: {
                payment_methods: {
                    excluded_payment_types: [
                        { id: 'ticket' } // Remove boletos por padrão para evitar atrasos, mas pode habilitar depois
                    ],
                    installments: 12
                },
                items: [
                    {
                        id: 'plan_pro_mensal',
                        title: 'Licença Sistema Food 360 - 30 Dias',
                        quantity: 1,
                        unit_price: 299.00,
                        currency_id: 'BRL',
                        description: 'Acesso completo ao sistema de gestão de cozinha, cálculo de ficha técnica e estoque.'
                    }
                ],
                payer: {
                    email: email
                },
                external_reference: tenantId, // A mágica: o tenantId do cliente vai e volta no Webhook!
                back_urls: {
                    success: `${appUrl}/?mp=success`,
                    failure: `${appUrl}/?mp=failure`,
                    pending: `${appUrl}/?mp=pending`
                },
                auto_return: 'approved' // Redireciona o usuário de volta assim que pagar via Pix/Cartão
            }
        });

        console.log('[MP_CHECKOUT] Checkout gerado com sucesso:', result.id);
        
        // Retorna o link fresco gerado
        return Response.json({ 
            init_point: result.init_point, 
            id: result.id 
        });

    } catch (error) {
        console.error('[MP_CHECKOUT] Erro fatal:', error);
        return Response.json({ error: 'Falha ao processar checkout' }, { status: 500 });
    }
}
