import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
    try {
        const body = await request.json();
        const { provider, apiKey, baseUrl, masterPrompt, userInput, ingredientsContext, segment } = body;

        // Validações básicas
        if (!apiKey) {
            return NextResponse.json({ error: 'API Key não fornecida. Configure no menu lateral.' }, { status: 401 });
        }
        if (!userInput && !body.testMode) {
            return NextResponse.json({ error: 'O texto de instrução (userInput) está vazio.' }, { status: 400 });
        }

        // --- MODO DE TESTE DE CONEXÃO ---
        if (body.testMode) {
            const testSysPrompt = "Responda exatamente com a palavra: OK";
            try {
                if (provider === 'gemini') {
                    const ai = new GoogleGenAI({ apiKey });
                    await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: testSysPrompt });
                } else if (provider === 'anthropic') {
                    const anthropic = new Anthropic({ apiKey });
                    await anthropic.messages.create({
                        model: "claude-3-haiku-20240307", max_tokens: 10, messages: [{ role: "user", content: testSysPrompt }]
                    });
                } else {
                    const openaiConfig = { apiKey };
                    if (provider === 'custom' && baseUrl) openaiConfig.baseURL = baseUrl;
                    else if (provider === 'groq') openaiConfig.baseURL = "https://api.groq.com/openai/v1";

                    const openaiClient = new OpenAI(openaiConfig);
                    let modelId = 'gpt-4o-mini';
                    if (provider === 'custom') {
                        if (baseUrl.includes('deepseek')) modelId = 'deepseek-chat';
                        else if (baseUrl.includes('openrouter')) modelId = 'google/gemini-2.5-flash';
                        else if (baseUrl.includes('moonshot') || baseUrl.includes('kimi')) modelId = 'moonshot-v1-8k';
                    } else if (provider === 'groq') {
                        modelId = 'llama-3.3-70b-versatile';
                    }

                    await openaiClient.chat.completions.create({
                        model: modelId,
                        messages: [{ role: "user", content: testSysPrompt }],
                        max_tokens: 10
                    });
                }
                return NextResponse.json({ success: true, message: 'Conexão estabelecida com sucesso!' });
            } catch (error) {
                console.error("Test connection failed:", error);

                // Se a API retornar 503 Unavailable ou 429 Too Many Requests, a conexão foi tecnicamente sucedida e bateu na API autenticada.
                if (error.status === 503 || error.status === 429 || (error.message && (error.message.includes('503') || error.message.includes('429')))) {
                    return NextResponse.json({
                        success: true, // Forçamos sucesso pois a chave tá certa, só a IA q tá cheia ou em limit
                        warning: true,
                        message: 'Sua chave foi salva! (Aviso: A rede do provedor relatou alta demanda ou limite de acesso no momento, mas a configuração está correta).'
                    });
                }

                // Caso contrário (como 401, 403, 404), bloqueia o salvamento e exibe o detalhe do erro.
                return NextResponse.json({ error: 'Falha ao validar a chave da API.', details: error.message }, { status: 401 });
            }
        }

        // Montagem do Chat Request
        const finalPromptUser = `
--- DADOS TÉCNICOS DA ETAPA ---
${ingredientsContext || 'Nenhum ingrediente fornecido para esta etapa.'}

--- INSTRUÇÕES BRUTAS DO USUÁRIO ---
${userInput}

--- DIRETRIZ ESTRITA DE SAÍDA ---
* RETORNE UM OBJETO JSON COM UMA CHAVE "steps" CONTENDO UM ARRAY DE OBJETOS.
* FORMATO: { "steps": [ {"title": "...", "content": "..."}, ... ] }
* NÃO USE MARCADORES DO TIPO \`\`\`json ou texto solto.
`;

        // --- DIRETRIZES DE SEGMENTO ---
        let segmentPrompt = "";
        if (segment === 'porcionamento') {
            segmentPrompt = `
MODO: PORCIONAMENTO E BOLEADO
* FOCO: Dividir a massa final em porções iguais, técnica de boleamento e armazenamento.
* PESOS: Use os pesos informados ou sugira porções padrão se não houver.
* ESTILO: Descreva como "1. Divida... 2. Boleie... 3. Armazene...".
* TÍTULO OBRIGATÓRIO: Use "1º Passo - PORCIONAMENTO" ou similar.
`;
        } else if (segment === 'embalagem') {
            segmentPrompt = `
MODO: EMBALAGEM E FINALIZAÇÃO
* FOCO: Material da embalagem, vedação, etiquetagem e validade.
* ITENS: Descreva como usar os itens de embalagem listados no contexto.
* TÍTULO OBRIGATÓRIO: Use "1º Passo - EMBALAGEM" ou similar.
`;
        } else {
            segmentPrompt = `
MODO: PREPARO E COCÇÃO
* FOCO: Técnica culinária, ordem de mistura e pontos de cocção.
* TÍTULO OBRIGATÓRIO: Use "1º Passo - MATÉRIA-PRIMA" ou "1º Passo - PREPARO".
`;
        }

        const finalSystemPrompt = masterPrompt + "\n\n" + segmentPrompt + "\n\nCRÍTICO: RESPONDA APENAS UM OBJETO JSON NO FORMATO { \"steps\": [...] }. NÃO USE TEXTO ANTES OU DEPOIS.";

        let resultJsonString = "{}";

        // ============================================
        // 1. GOOGLE GEMINI
        // ============================================
        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: apiKey });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: finalSystemPrompt + "\n\n" + finalPromptUser,
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            });

            resultJsonString = response.text || "{}";
        }

        // ============================================
        // 2. OPENAI E COMPATÍVEIS (Ex: DeepSeek, Qwen, Kimi)
        // ============================================
        else if (provider === 'openai' || provider === 'custom' || provider === 'groq') {
            const openaiConfig = { apiKey };

            if (provider === 'custom' && baseUrl) {
                openaiConfig.baseURL = baseUrl;
            } else if (provider === 'groq') {
                openaiConfig.baseURL = "https://api.groq.com/openai/v1";
            }

            const openaiClient = new OpenAI(openaiConfig);

            let modelId = 'gpt-4o-mini';
            if (provider === 'custom') {
                if (baseUrl.includes('deepseek')) modelId = 'deepseek-chat';
                else if (baseUrl.includes('openrouter')) modelId = 'google/gemini-2.5-flash';
                else if (baseUrl.includes('moonshot') || baseUrl.includes('kimi')) modelId = 'moonshot-v1-8k';
            } else if (provider === 'groq') {
                modelId = 'llama-3.3-70b-versatile';
            }

            const response = await openaiClient.chat.completions.create({
                model: modelId,
                messages: [
                    { role: "system", content: finalSystemPrompt },
                    { role: "user", content: finalPromptUser }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            }).catch(async (e) => {
                if (e.message && e.message.includes('response_format')) {
                    return await openaiClient.chat.completions.create({
                        model: modelId,
                        messages: [
                            { role: "system", content: finalSystemPrompt },
                            { role: "user", content: finalPromptUser }
                        ],
                        temperature: 0.1
                    });
                }
                throw e;
            });

            resultJsonString = response.choices[0]?.message?.content || "{}";
        }

        // ============================================
        // 3. ANTHROPIC (CLAUDE)
        // ============================================
        else if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey });

            const response = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 4000,
                temperature: 0.1,
                system: finalSystemPrompt,
                messages: [
                    { role: "user", content: finalPromptUser }
                ]
            });

            resultJsonString = response.content[0].text || "{}";
        }

        else {
            return NextResponse.json({ error: 'Provedor IA não reconhecido.' }, { status: 400 });
        }


        // ============================================
        // TRATAMENTO DA RESPOSTA (Parsing JSON Seguro)
        // ============================================
        resultJsonString = resultJsonString.trim();

        if (resultJsonString.startsWith('\`\`\`json')) {
            resultJsonString = resultJsonString.replace(/^\`\`\`json/i, '').replace(/\`\`\`$/, '');
        } else if (resultJsonString.startsWith('\`\`\`')) {
            resultJsonString = resultJsonString.replace(/^\`\`\`/i, '').replace(/\`\`\`$/, '');
        }

        let parsedData;
        try {
            parsedData = JSON.parse(resultJsonString.trim());
        } catch (e) {
            console.error("Falha no Parse JSON. Retorno Puro:", resultJsonString);
            return NextResponse.json({
                error: 'O modelo de I.A. não retornou um formato válido. Tente reescrever a instrução.',
                rawOutput: resultJsonString
            }, { status: 500 });
        }

        // Extração inteligente do array de passos
        let steps = [];
        if (Array.isArray(parsedData)) {
            steps = parsedData;
        } else if (parsedData.steps && Array.isArray(parsedData.steps)) {
            steps = parsedData.steps;
        } else if (parsedData.notes && Array.isArray(parsedData.notes)) {
            steps = parsedData.notes;
        } else {
            // Se veio um objeto único que não é array nem tem chave conhecida, envolvemos ele
            steps = [parsedData];
        }

        return NextResponse.json({ notes: steps });

    } catch (error) {
        console.error('API Gen AI Error:', error);
        return NextResponse.json(
            { error: 'Erro interno na comunicação com a API da Inteligência Artificial.', details: error.message },
            { status: 500 }
        );
    }
}
