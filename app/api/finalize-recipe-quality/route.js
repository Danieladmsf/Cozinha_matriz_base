import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// 🔑 Chave mestra global — fallback para qualquer tenant sem chave própria
const MASTER_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

/**
 * API para preencher automaticamente o Controle de Qualidade e PCC de uma receita.
 * Recebe o contexto completo (ingredientes, preparo) e retorna:
 * - shelf_life, storage_temperature, allergens, ccp_notes
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { recipeContext, provider: rawProvider, apiKey: userApiKey, baseUrl } = body;

        // Resolver provider e API key — se não veio key, usar chave mestra com Anthropic
        const provider = userApiKey ? (rawProvider || 'anthropic') : 'anthropic';
        const apiKey = userApiKey || MASTER_ANTHROPIC_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key necessária.' }, { status: 401 });
        }

        if (!recipeContext) {
            return NextResponse.json({ error: 'Contexto da receita necessário.' }, { status: 400 });
        }

        const systemPrompt = `Você é um Engenheiro de Alimentos e Consultor de Segurança Alimentar especialista.
Sua tarefa é analisar uma receita/ficha técnica e preencher automaticamente os campos de CONTROLE DE QUALIDADE e PONTOS CRÍTICOS DE CONTROLE.

REGRAS ESTRITAS:
1. Retorne APENAS um objeto JSON puro. NADA fora dele, sem blocos markdown.
2. O formato obrigatório é:
{
  "shelf_life": "string descrevendo a validade (ex: '5 dias sob refrigeração (0°C a 5°C)')",
  "storage_temperature": "string descrevendo condições de armazenamento (ex: 'Refrigerado entre 0°C e 5°C, em recipiente hermético')",
  "allergens": "string listando TODOS os alergênicos presentes segundo RDC 26/2015 da ANVISA. Formato: 'CONTÉM: [lista]. PODE CONTER TRAÇOS DE: [lista].' Se não houver alergênicos conhecidos, escreva 'Não contém alergênicos declarados conforme RDC 26/2015.'",
  "ccp_notes": "string com pontos críticos de controle, um por linha, no formato:\\n- PCC1: [descrição]\\n- PCC2: [descrição]\\netc."
}

3. Para ALERGÊNICOS, considere os 18 alergênicos da ANVISA (RDC 26/2015):
   Trigo (glúten), centeio, cevada, aveia, crustáceos, ovos, peixes, amendoim, soja, leites (lactose/proteína do leite), amêndoas, avelãs, castanhas de caju, castanhas do Pará, macadâmias, nozes, pecãs, pistaches, látex natural, sulfitos.
   
4. Para VALIDADE (shelf_life), considere:
   - Tipo de preparo (cru, cozido, processado)
   - Presença de conservantes naturais (ácido cítrico, sal)
   - Nível de umidade e atividade de água
   - Padrão conservador para segurança alimentar

5. Para PCC (Pontos Críticos de Controle), considere:
   - Temperaturas críticas de cocção e resfriamento
   - Riscos de contaminação cruzada
   - Manipulação de alergênicos
   - Armazenamento correto
   - Prazo de exposição em temperatura ambiente`;

        const userMessage = `Analise esta receita/ficha técnica e preencha os campos de qualidade:\n\n${recipeContext}`;

        let resultJsonString = "{}";

        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey });
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: userMessage }] }],
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.3,
                    responseMimeType: "application/json"
                }
            });
            resultJsonString = result.text;
        } else if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey });
            const msg = await anthropic.messages.create({
                model: DEFAULT_ANTHROPIC_MODEL,
                max_tokens: 1500,
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }],
                temperature: 0.3,
            });
            resultJsonString = msg.content[0].text;
        } else {
            const openaiConfig = { apiKey };
            if (provider === 'custom') openaiConfig.baseURL = baseUrl;
            else if (provider === 'groq') openaiConfig.baseURL = "https://api.groq.com/openai/v1";

            const openai = new OpenAI(openaiConfig);

            let modelId = 'gpt-4o-mini';
            if (provider === 'groq') modelId = 'llama-3.3-70b-versatile';

            const completion = await openai.chat.completions.create({
                model: modelId,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3
            });
            resultJsonString = completion.choices[0].message.content;
        }

        // Limpeza de segurança
        const cleanedJson = resultJsonString.substring(
            resultJsonString.indexOf('{'),
            resultJsonString.lastIndexOf('}') + 1
        );

        const parsed = JSON.parse(cleanedJson);
        return NextResponse.json({ success: true, data: parsed });

    } catch (error) {
        console.error('Erro no Finalizar com I.A.:', error);
        return NextResponse.json({ error: 'Erro ao processar.', details: error.message }, { status: 500 });
    }
}
