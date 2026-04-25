import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// 🔑 Chave mestra global — fallback para qualquer tenant sem chave própria
const MASTER_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

/**
 * API para extrair ingredientes e quantidades de um texto informal.
 * Transforma: "500gr de farinha, 2 ovos, 300ml de água"
 * Em: { ingredients: [{ name: "farinha", amount: 0.5, unit: "kg" }, ...] }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { messages, provider: rawProvider, apiKey: userApiKey, baseUrl } = body;

        // Resolver provider e API key — se não veio key, usar chave mestra com Anthropic
        const provider = userApiKey ? (rawProvider || 'anthropic') : 'anthropic';
        const apiKey = userApiKey || MASTER_ANTHROPIC_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key necessária.' }, { status: 401 });
        }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Nenhuma mensagem enviada.' }, { status: 400 });
        }

        const systemPrompt = `Você é um Engenheiro de Dados Culinário e Assistente.
O usuário vai conversando com você para montar uma lista de ingredientes.
Sua tarefa é duplo-funcional. Você deve responder conversacionalmente e, ao mesmo tempo, fornecer o estado ATUAL da lista completa de ingredientes com base na conversa até agora.

REGRAS ESTritas de JSON:
1. Retorne APENAS um objeto JSON. NADA fora dele, sem blocos markdown (\`\`\`json).
2. O formato obrigatório do JSON é:
{
  "reply": "Sua resposta conversacional curta em linguagem natural (ex: 'Adicionei 1.2kg de farinha. Faltou mais alguma coisa?')",
  "ingredients": [ { "name": "string", "amount": number, "unit": "string" } ]
}
3. Para os "ingredients":
- CRÍTICO: Converta TUDO absolutamente para "kg", "L" ou "un". NUNCA use "g" ou "ml" como unidade.
- Se o usuário falar em gramas ou mililitros, divida por 1000. Exemplo: "25g de sal" -> amount: 0.025, unit: "kg". "700ml de água" -> amount: 0.700, unit: "L".
- Se o usuário usar medidas caseiras (xícara, colher, pitada, folha, dente, etc), FAÇA A ESTIMATIVA PARA KG OU LITROS:
   * 1 xícara = ~0.200 kg/L (depende da densidade, ex: farinha 0.120, óleo 0.200)
   * 1 colher (sopa) = ~0.015 kg/L
   * 1 colher (chá) = ~0.005 kg/L
   * 1 pitada = ~0.001 kg
   * 1 folha/raspas = ~0.002 kg ou use "un"
   * Suco de 1 limão = ~0.040 L
- O valor de \`amount\` DEVE ser SEMPRE um número float (ex: 0.15). Se for uma fração ou string (ex: "1/4"), calcule o valor decimal (ex: 0.25) e depois aplique a conversão. Nunca coloque texto no amount. Se não houver quantidade descrita, assuma 1 e use "un".
- Remova gírias e palavras desnecessárias (ex: "de cebola" -> "cebola").
- Este array deve representar a RECEITA COMPLETA ATUALIZADA no momento.`;

        // Remova a primeira mensagem de saudação do UI, pois APIs (Gemini/Anthropic) cracham se o histórico iniciar com 'assistant'
        let safeMessages = [...messages];
        if (safeMessages.length > 0 && safeMessages[0].role === 'assistant') {
            safeMessages.shift();
        }

        let resultJsonString = "{}";

        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey });
            
            const chatContents = safeMessages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: chatContents,
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.2, // Slightly higher for conversational 'reply', strictly mapped JSON
                    responseMimeType: "application/json"
                }
            });
            resultJsonString = result.text;
        } else if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey });
            const chatMessages = safeMessages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));
            
            const msg = await anthropic.messages.create({
                model: DEFAULT_ANTHROPIC_MODEL,
                max_tokens: 1500,
                system: systemPrompt,
                messages: chatMessages,
                temperature: 0.2,
            });
            resultJsonString = msg.content[0].text;
        } else {
            const openaiConfig = { apiKey };
            if (provider === 'custom') openaiConfig.baseURL = baseUrl;
            else if (provider === 'groq') openaiConfig.baseURL = "https://api.groq.com/openai/v1";

            const openai = new OpenAI(openaiConfig);
            
            let modelId = 'gpt-4o-mini';
            if (provider === 'custom' && baseUrl) {
                if (baseUrl.includes('deepseek')) modelId = 'deepseek-chat';
                else if (baseUrl.includes('openrouter')) modelId = 'google/gemini-2.5-flash';
                else if (baseUrl.includes('moonshot') || baseUrl.includes('kimi')) modelId = 'moonshot-v1-8k';
            } else if (provider === 'groq') {
                modelId = 'llama-3.3-70b-versatile';
            }

            const completion = await openai.chat.completions.create({
                model: modelId,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...safeMessages
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            });
            resultJsonString = completion.choices[0].message.content;
        }

        // Limpeza de segurança caso a I.A. ignore o formato JSON puro
        const cleanedJson = resultJsonString.substring(
            resultJsonString.indexOf('{'),
            resultJsonString.lastIndexOf('}') + 1
        );

        return NextResponse.json(JSON.parse(cleanedJson));

    } catch (error) {
        console.error('Erro no Parser de Receita:', error);
        return NextResponse.json({ error: 'Erro ao processar texto.', details: error.message }, { status: 500 });
    }
}
