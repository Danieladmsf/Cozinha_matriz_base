import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// 🔑 Chave mestra global — fallback para qualquer tenant sem chave própria
const MASTER_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

export async function POST(request) {
    try {
        const body = await request.json();
        const { provider: rawProvider, apiKey: userApiKey, baseUrl, userInput, ingredientsContext, segment, conversationHistory, currentDraft } = body;

        // Resolver provider e API key — se não veio key, usar chave mestra com Anthropic
        const provider = userApiKey ? (rawProvider || 'anthropic') : 'anthropic';
        const apiKey = userApiKey || MASTER_ANTHROPIC_KEY;

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
                    await ai.models.generateContent({ model: 'gemini-1.5-flash', contents: testSysPrompt });
                } else if (provider === 'anthropic') {
                    const anthropic = new Anthropic({ apiKey });
                    await anthropic.messages.create({
                        model: DEFAULT_ANTHROPIC_MODEL, max_tokens: 10, messages: [{ role: "user", content: testSysPrompt }]
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
${conversationHistory ? `\n--- HISTÓRICO DA CONVERSA (contexto das solicitações anteriores) ---\n${conversationHistory}\n` : ''}
${currentDraft ? `\n--- RASCUNHO ATUAL (resultado anterior que o usuário quer MODIFICAR) ---\n${currentDraft}\n\n⚠️ INSTRUÇÃO CRÍTICA: O usuário deseja EDITAR o rascunho acima. Aplique APENAS as mudanças solicitadas abaixo, preservando TODO o restante que já estava correto. NÃO regenere do zero.\n` : ''}
--- ${currentDraft ? 'INSTRUÇÃO DE MODIFICAÇÃO' : 'INSTRUÇÕES BRUTAS'} DO USUÁRIO ---
${userInput}

--- DIRETRIZ ESTRITA DE SAÍDA ---
* RETORNE UM OBJETO JSON COM UMA CHAVE "steps" CONTENDO UM ARRAY DE OBJETOS.
* FORMATO: { "steps": [ {"title": "...", "content": "..."}, ... ], "message": "(opcional) frase curta e natural sobre o que você fez" }
* NÃO USE MARCADORES DO TIPO \`\`\`json ou texto solto.
${currentDraft ? '* O JSON retornado deve ser a versão COMPLETA e FINAL com as modificações aplicadas.' : ''}
`;

        // --- DIRETRIZES DE SEGMENTO ---
        let segmentPrompt = "";
        if (segment === 'porcionamento') {
            segmentPrompt = `
MODO: PORCIONAMENTO E BOLEADO
* FOCO: Consolidar rendimento final, dividir a massa em porções iguais, boleamento e armazenamento.
* NÃO prefixe títulos com "Xº Passo" — o frontend já faz isso automaticamente.

ESTRUTURA OBRIGATÓRIA — EXATAMENTE 4 SEÇÕES FIXAS NESTA ORDEM (cada uma um objeto no array "steps"):

══════════════════════════════════════════════
SEÇÃO 1 — title: "RENDIMENTO FINAL"
══════════════════════════════════════════════
content: TRANSCREVA os valores do bloco "MÉTRICAS PRÉ-CALCULADAS" do contexto. Você NÃO calcula nada aqui — apenas formata como HTML.

⛔ REGRA INQUEBRÁVEL: Use os números EXATOS do bloco "MÉTRICAS PRÉ-CALCULADAS". É PROIBIDO:
- Recalcular rendimento, ganho ou perda
- Inventar valores quando o bloco já informou
- Alterar qualquer número (ex: trocar 200% por 185%)

Mapeamento direto das métricas → bullets:
  "[Ingrediente] cru: Xg"         → "- <b>[Ingrediente] cru:</b> Xg<br>"
  "[Ingrediente] cozido: Xg"      → "- <b>[Ingrediente] cozido:</b> Xg<br>"
  "Rendimento: X% (...)"          → "- <b>Rendimento:</b> X% (COPIE a interpretação entre parênteses)<br>"
  "Perdas por limpeza: ..."       → "- <b>Perda por limpeza:</b> ...<br>"

Se o bloco disser "Dados insuficientes", escreva "- <b>Rendimento:</b> não calculável (dados insuficientes)<br>".

Exemplo (dadas métricas "Feijão Carioca cru: 315g", "Feijão Carioca cozido: 944g", "Rendimento: 300% (ganho de 200% por absorção/incorporação de água)"):
"- <b>Feijão cru:</b> 315g<br>- <b>Feijão cozido:</b> 944g<br>- <b>Rendimento:</b> 300% (ganho de 200% por absorção de água)<br>- <b>Perda por limpeza:</b> alho 14,3% / cebola 9,7%<br>"

══════════════════════════════════════════════
SEÇÃO 2 — title: "PORCIONAMENTO"
══════════════════════════════════════════════
content: Instruções de divisão em porções iguais, técnica de boleamento e peso por porção. Use bullets terminados em <br>. Se o usuário indicar peso/quantidade específica, use-o; senão, sugira porção padrão baseada no peso total cozido.
Exemplo:
"- Divida a massa em porções de 400g<br>- Boleie cada porção em formato redondo<br>- Disponha em recipientes untados com óleo<br>"

══════════════════════════════════════════════
SEÇÃO 3 — title: "ARMAZENAMENTO"
══════════════════════════════════════════════
content: bullets curtos com instruções de recipiente, resfriamento, identificação e validade. Sempre inclua data de preparo e prazo de conservação.
Exemplo:
"- Armazenar em recipiente adequado com tampa<br>- Deixar esfriar completamente antes de refrigerar<br>- Identificar com data de preparo<br>- Conservar por até 3 dias sob refrigeração<br>"

══════════════════════════════════════════════
SEÇÃO 4 — title: "NOTAS"
══════════════════════════════════════════════
content: Observações técnicas relevantes baseadas nos ingredientes. Inclua: comportamento na cocção (ex: "triplica de peso"), notas sobre temperos (ex: "a páprica adiciona cor e sabor suave"), alertas (ex: "retirar o louro antes de servir"). Use bullets terminados em <br>. Gere de 2 a 5 observações pertinentes.
Exemplo:
"- O feijão triplica de peso após o cozimento<br>- A páprica doce adiciona cor e sabor suave<br>- O louro deve ser retirado antes de servir<br>"
`;
        } else if (segment === 'embalagem') {
            segmentPrompt = `
MODO: EMBALAGEM E FINALIZAÇÃO
* FOCO: Material da embalagem, vedação, etiquetagem e validade.
* ITENS: Descreva como usar os itens de embalagem listados no contexto.
`;
        } else {
            segmentPrompt = `
MODO: PREPARO E COCÇÃO
* FOCO: Técnica culinária, ordem de mistura e pontos de cocção.
* NÃO prefixe títulos com "Xº Passo" — o frontend já faz isso automaticamente.

══════════════════════════════════════════════
REGRAS DE FIDELIDADE AOS DADOS (OBRIGATÓRIAS)
══════════════════════════════════════════════

F1) ⛔ SEÇÃO INGREDIENTES = ESPELHO LITERAL DO CONTEXTO (regra inquebrável):
   - A seção INGREDIENTES do JSON é uma TRANSCRIÇÃO FIEL da lista em "DADOS TÉCNICOS DA ETAPA". Não é criatividade, é cópia.
   - Se o contexto tem N itens rotulados "- Ingrediente: X | Quantidade usada: Yg", a seção INGREDIENTES tem EXATAMENTE os mesmos N itens, na mesma ordem, com o mesmo peso de "Quantidade usada".
   - ⚠️ Mesmo que o usuário envie instruções focadas apenas em ALGUNS ingredientes (ex: "o feijão deixa de molho"), a seção INGREDIENTES continua contendo TODOS os N itens originais — não omita os que não foram citados.
   - É TERMINANTEMENTE PROIBIDO adicionar óleo, azeite, manteiga, cheiro-verde, pimenta, açúcar, ou QUALQUER outro item "tradicional" que não esteja no contexto.
   - Se uma técnica culinária tradicional exigir um item ausente (ex: refogar pede óleo), você DEVE ADAPTAR sem ele (ex: "suar" alho/cebola só com água), NUNCA inventar.
   - VALIDAÇÃO OBRIGATÓRIA antes de retornar o JSON: conte as linhas "- Ingrediente:" do contexto e as linhas da seção INGREDIENTES. Se os números não baterem, REESCREVA incluindo os ausentes.

F2) CADA ingrediente do contexto DEVE aparecer EXATAMENTE UMA VEZ na seção INGREDIENTES, com o peso EXATO que veio no contexto. NUNCA copie o peso de um ingrediente em outro.

F3) O PRODUTO PRINCIPAL (normalmente o de maior peso, ex: arroz, feijão, carne) SEMPRE aparece em INGREDIENTES E é o foco do preparo. Nunca omita.

F4) RESPEITE O TIPO de cada ingrediente:
   - Secos aromáticos (louro, orégano, pimenta seca, especiarias em pó) NÃO são aquecidos sozinhos; são adicionados junto à cocção ou no tempero final.
   - Líquidos (água, óleo, leite, caldo) aparecem na Cocção ou Refogamento — nunca são "picados" ou "refogados" como sólidos.
   - Sal, açúcar, temperos em pó são adicionados durante cocção, não picados.

F5) Se no contexto NÃO houver óleo/gordura, adapte o Refogamento: use apenas água para "suar" alho e cebola, OU pule o Refogamento e vá direto pra Cocção.

F6) Quando referenciar um ingrediente numa ação, use seu NOME e seu PRÓPRIO peso (do contexto) — nunca misture peso de outro item. Exemplo CORRETO: "Aqueça 29mL de óleo" (se óleo=29mL no contexto). ERRADO: "Aqueça 315g de louro" (copiou peso do feijão para o louro).

F7) ⛔ FIDELIDADE NUMÉRICA INQUEBRÁVEL — NUNCA ARREDONDE PESOS:
   - Contexto diz "169g" → escreva EXATAMENTE "169g". É PROIBIDO escrever "160g", "170g", "~169g" ou "cerca de 169g".
   - Vale para INGREDIENTES E para ações no PROCESSO DE PREPARO.
   - ERRADO: "Junte 160g de Acém e 70g de Fraldinha" (quando contexto = 169g + 72g)
   - CORRETO: "Junte 169g de Acém e 72g de Fraldinha"

F8) ⛔ NUNCA INVENTE NÚMEROS PÓS-COCÇÃO:
   - Só cite peso pós-cocção se o contexto trouxer "Pós-cocção: Xg" para aquele ingrediente.
   - Se o contexto NÃO trouxer, descreva qualitativamente ("a carne firma e perde suco", "o feijão dobra de volume") — SEM número específico.
   - ERRADO: "reduzindo a carne para aproximadamente 120g de Acém e 52g de Fraldinha pós-cocção" (números inventados)
   - CORRETO: "grelhe até a carne firmar e formar crosta"

F9) ⛔ INSTRUÇÃO DO USUÁRIO > ESTRUTURA PADRÃO — REGRA ANTI-CONTRADIÇÃO:
   - Se o usuário descreveu UM fluxo específico, IGNORE a ESTRUTURA PADRÃO e siga o fluxo dele.
   - Exemplo: usuário disse "tempero só na hora de grelhar na chapa" → NÃO crie passo "Tempero" antes da grelha. O tempero entra APENAS na cocção.
   - Antes de retornar o JSON, leia a instrução INTEIRA do usuário e valide: nenhum passo pode contradizer o que ele disse. Se contradiz, REESCREVA.
   - Passos duplicados (ex: "Tempero" no passo 2 + "use o tempero ao grelhar" no passo 4) são PROIBIDOS — escolha um lugar só, baseado no que o usuário pediu.

ESTRUTURA OBRIGATÓRIA — EXATAMENTE 3 SEÇÕES FIXAS NESTA ORDEM (cada uma um objeto no array "steps"):

══════════════════════════════════════════════
SEÇÃO 1 — title: "INGREDIENTES"
══════════════════════════════════════════════
content: TRANSCREVA EXATAMENTE o bloco "LISTA DE INGREDIENTES" do contexto. NÃO altere nomes, NÃO altere pesos, NÃO escolha outro peso dos "DETALHES TÉCNICOS".

Processo mecânico de conversão:
  Bloco do contexto: "- Feijão Carioca: 315g"
  Vira no JSON:     "- Feijão Carioca: 315g<br>"
(apenas adiciona <br> no fim de cada linha, sem mudar mais nada.)

⛔ PROIBIDO:
- Usar peso de "Pós-limpeza" ou "Quantidade usada" aqui (esses só aparecem no PROCESSO DE PREPARO)
- Adicionar, remover ou renomear itens
- Alterar a ordem das linhas

Exemplo (dado bloco "- Feijão Carioca: 315g\\n- Alho: 14g\\n- Cebola: 31g"):
"- Feijão Carioca: 315g<br>- Alho: 14g<br>- Cebola: 31g<br>"

══════════════════════════════════════════════
SEÇÃO 2 — title: "PROCESSO DE PREPARO"
══════════════════════════════════════════════
content: Organize o processo em passos numerados sequenciais (mínimo 3, máximo 6), cada um com um sub-título em <b> seguido de lista de ações com hífen. Use <br><br> ao final de cada passo numerado.

ESTRUTURA PADRÃO (use quando o usuário não especificar outra):
  1. <b>Preparo dos Temperos:</b>  → picar, lavar, separar ingredientes
  2. <b>Refogamento:</b>           → aquecer óleo, dourar alho/cebola, fritar base
  3. <b>Cocção:</b>                → adicionar líquidos, temperos de cozimento, finalizar

ESTRUTURA ADAPTATIVA: Se o usuário solicitar etapas adicionais (ex: hidratação, molho, marinada, descanso, montagem, finalização), adapte a estrutura cronologicamente. Exemplos:
  - Se pedir "feijão de molho": adicione "1. <b>Hidratação:</b>" como primeiro passo, deslocando os demais.
  - Se pedir "marinar a carne": adicione "1. <b>Marinada:</b>" como primeiro passo.
  - Se pedir "4 etapas": gere exatamente 4 passos com títulos apropriados.
  Sempre respeite a ORDEM CRONOLÓGICA real do processo culinário.

Exemplo com 4 etapas (hidratação + preparo + refogamento + cocção):
"1. <b>Hidratação:</b><br>- Lavar 315g de feijão carioca em água corrente<br>- Cobrir com água e deixar de molho por 3 horas<br>- Escorrer e reservar o feijão hidratado<br><br>2. <b>Preparo dos Temperos:</b><br>- Picar 13g de alho<br>- Picar 28g de cebola<br><br>3. <b>Refogamento:</b><br>- Aqueça 80g de óleo de soja em uma panela<br>- Refogue a cebola e o alho até dourar<br><br>4. <b>Cocção:</b><br>- Em outra panela, ferva 1000g de água<br>- Quando a água estiver fervendo, adicione o feijão escorrido<br>- Adicione o refogado, 4g de sal, 2g de louro e 9g de páprica doce<br>- Cozinhe até o feijão ficar macio<br><br>"

══════════════════════════════════════════════
SEÇÃO 3 — title: "ARMAZENAMENTO"
══════════════════════════════════════════════
content: bullets curtos com instruções de recipiente, resfriamento, identificação e validade. Sempre inclua data de preparo e prazo de conservação.
Exemplo:
"- Armazenar em recipiente adequado com tampa<br>- Deixar esfriar completamente antes de refrigerar<br>- Identificar com data de preparo<br>- Conservar por até 3 dias sob refrigeração<br>"
`;
        }

        // REGRA FINAL INQUEBRÁVEL - adicionada a TODAS as chamadas, de TODO provider
        const htmlEnforcementRule = `

REGRAS INEGOCIÁVEIS DE FORMATAÇÃO HTML (LEIA COM ATENÇÃO):

A) Mantenha TODAS as tags <b> e <br> literais na string do JSON — o front-end renderiza o HTML.

B) Cada bullet (linha que começa com hífen "-") DEVE terminar com <br>.
   CORRETO: "- Arroz: 367g<br>"
   ERRADO:  "- Arroz: 367g\\n"

C) Cada passo numerado (1., 2., 3.) DEVE terminar com <br><br>.
   CORRETO: "1. <b>Preparo dos Temperos:</b><br>- Picar cebola<br><br>2. <b>Refogamento:</b><br>..."
   ERRADO:  "1. Preparo... 2. Refogamento..." (sem tags)

D) O "title" de cada step contém APENAS o nome da seção em MAIÚSCULO, sem prefixos de numeração. O frontend adiciona "Xº Passo" automaticamente.

══════════════════════════════════════════════
MODO INTERATIVO (OBRIGATÓRIO)
══════════════════════════════════════════════

Antes de gerar o JSON de passos, avalie se a instrução do usuário contém informação SUFICIENTE para produzir um resultado concreto e específico.

⛔ É PROIBIDO gerar passos genéricos/placeholder como:
- "Etapa Adicional: Siga as instruções do usuário"
- "Nova etapa: A definir"
- "Ajuste conforme preferência"

Se a instrução for VAGA, INCOMPLETA ou AMBÍGUA, retorne um JSON de CLARIFICAÇÃO em vez de steps:
{ "clarification": "Sua pergunta aqui" }

Exemplos de quando usar clarificação:
- Usuário: "adicione mais uma etapa" → { "clarification": "Claro! Que tipo de etapa você quer adicionar? Por exemplo:\n\n• **Hidratação** — deixar o feijão de molho\n• **Marinada** — temperar a carne antes\n• **Finalização** — ajuste final de tempero\n\nDescreva o que deve acontecer nessa etapa que eu monto pra você!" }
- Usuário: "mude o preparo" → { "clarification": "Posso mudar! Mas o que exatamente?\n\nAtualmente o preparo tem: Temperos → Refogamento → Cocção.\nQual desses quer alterar, ou quer reorganizar a ordem?" }
- Usuário: "tá errado" → { "clarification": "Me diz qual parte está errada que eu corrijo! É o tempo de cozimento? A ordem dos passos? O peso de algum ingrediente?" }

Se a instrução for CLARA e ESPECÍFICA (ex: "coloque o feijão de molho por 3h como primeiro passo"), gere o JSON normalmente com { "steps": [...] }.

══════════════════════════════════════════════
CAMPO "message" — FALE COMO GENTE, NÃO COMO ROBÔ
══════════════════════════════════════════════

Junto com "steps" (ou sozinho), inclua um "message" com 1-2 frases conversacionais sobre o que você FEZ ou PENSOU. Soa como cozinheiro experiente, sem floreio corporativo.

EXEMPLOS BONS:
- Rascunho do zero: "Beleza, montei a base aqui — segui a ordem clássica: temperos, refogamento e cocção. Dá uma olhada e me diz o que ajustar."
- Edição cirúrgica: "Mexi só no passo 2 como você pediu, o resto deixei intacto."
- Adição de etapa: "Coloquei a hidratação como passo 1 e empurrei os outros pra frente."
- Sem óleo no contexto: "Como não tem óleo na ficha, suei o alho e a cebola só com água mesmo."

⛔ FRASES PROIBIDAS (lista negra — NÃO escreva nenhuma destas, nem variações):
- "Espero ter ajudado" / "Espero que sirva" / "Espero que goste" / "Espero que seja útil"
- "Se precisar de ajustes, é só avisar" / "Qualquer coisa, é só falar" / "Estou à disposição"
- "Aqui está o resultado" / "Segue o resultado" / "Conforme solicitado"
- "Fico feliz em ajudar" / "Foi um prazer" / "Com certeza!"
- "Criei o rascunho com sucesso" / "Pronto, foi feito!" (óbvio)

POR QUÊ: essas frases são bajulação corporativa de chatbot. Cozinheiro de verdade não fala assim — termina a frase quando acaba o assunto, sem rodeio.

EVITE TAMBÉM:
- Repetir o que já está visível nos steps (redundante)
- Comentar que "o resto segue como estava" sempre que edita um trecho (o usuário já sabe)
- Pontos de exclamação em série ("!" toda hora soa forçado)

PADRÃO BOM: termine SECO. Se já disse o que fez, pare. Não precisa fechar com cortesia.
  RUIM:  "Adicionei a hidratação como passo 1. Espero que sirva!"
  BOM:   "Adicionei a hidratação como passo 1."
  RUIM:  "Mexi só no passo 2. Se precisar de mais ajustes, é só avisar!"
  BOM:   "Mexi só no passo 2."

══════════════════════════════════════════════
QUANDO O USUÁRIO NÃO PEDIU AÇÃO — RESPONDA SÓ COM "message"
══════════════════════════════════════════════

Se a entrada do usuário NÃO é um pedido de gerar/editar receita — saudação ("oi", "ola", "tudo bem?"), agradecimento ("valeu", "obrigado"), pergunta casual, conversa fiada — responda APENAS com:

  { "message": "sua resposta natural aqui" }

⛔ ALUCINAÇÃO ZERO — REGRA INQUEBRÁVEL:
Quando você está retornando { "message": "..." } SEM steps, é TERMINANTEMENTE PROIBIDO usar verbos de ação no passado como:
  "ajustei", "atualizei", "preparei", "modifiquei", "adicionei", "removi", "criei", "corrigi", "incluí"

Esses verbos só são permitidos quando você ESTÁ retornando steps no MESMO turno. Se não há steps, você não FEZ nada — então não pode dizer que fez.

Exemplos do que NÃO fazer (alucinação real do sistema):
- ❌ Usuário: "ola" → "Oi! Preparei a receita com base nos ingredientes que você forneceu."
- ❌ Usuário: "ola" → "Mantive o rascunho como estava, pois não houve solicitação..."
  (mesmo "mantive" é problemático — você não fez nada, nem manteve)
- ❌ Usuário: "valeu" → "Ajustei conforme seu feedback."

Exemplos CORRETOS:
- ✅ Usuário: "ola"         → { "message": "E aí. Me diz como quer montar essa etapa." }
- ✅ Usuário: "valeu"       → { "message": "Boa." }
- ✅ Usuário: "tudo certo?" → { "message": "Tudo. Aguardando seu comando." }
- ✅ Usuário: "obrigado"    → { "message": "Por nada." }

Se a saudação vier JUNTO com um pedido real (ex: "oi, monta um rascunho"), aí sim retorne steps + message.

══════════════════════════════════════════════
RESUMO DOS FORMATOS DE RESPOSTA
══════════════════════════════════════════════

CRÍTICO: RESPONDA APENAS UM OBJETO JSON. Escolha UM dos formatos:

- { "steps": [...], "message": "..." }   ← gerou/editou receita (caso comum)
- { "steps": [...] }                      ← edição trivial sem comentário
- { "clarification": "..." }              ← pedido de ação ambíguo, precisa de mais info
- { "message": "..." }                    ← small talk / não é pedido de ação

NÃO USE TEXTO ANTES OU DEPOIS, NEM BLOCOS \`\`\`json.`;

        // Bloco TOP — vai ANTES de tudo, onde o modelo é mais atento.
        // Resume as 5 regras mais violadas em formato bullet curto. A redundância com regras detalhadas mais abaixo é intencional.
        const survivalRules = `
══════════════════════════════════════════════
REGRAS DE SOBREVIVÊNCIA — LEIA PRIMEIRO, ELAS PREVALECEM SOBRE TUDO
══════════════════════════════════════════════

R1) ALUCINAÇÃO ZERO. Se sua resposta NÃO contém "steps", é PROIBIDO usar verbos de ação no passado ("ajustei", "atualizei", "preparei", "modifiquei", "adicionei", "removi", "criei", "mantive", "corrigi"). Você não fez nada — então não pode dizer que fez. Para "ola", "valeu", "obrigado" → responda só conversação curta, sem fingir trabalho.

R2) FIDELIDADE NUMÉRICA. NUNCA arredonde pesos. Contexto = "169g" → você escreve "169g". JAMAIS "160g", "170g" ou "~169g". Vale para INGREDIENTES e para PROCESSO DE PREPARO.

R3) NUNCA INVENTE NÚMEROS PÓS-COCÇÃO. Só cite peso pós-cocção se vier explícito no contexto ("Pós-cocção: Xg"). Caso contrário descreva qualitativamente, sem número.

R4) INSTRUÇÃO DO USUÁRIO > ESTRUTURA PADRÃO. Se ele disse "tempero só na hora de grelhar", NÃO inclua tempero antes. Antes de retornar, releia a instrução e valide que NENHUM passo a contradiz. Passos duplicados ou contraditórios = REESCREVA.

R5) ZERO BAJULAÇÃO. Termine SECO. Lista negra absoluta — NÃO escreva nem variações:
  - "Espero ter ajudado" / "Espero que sirva" / "Espero que goste"
  - "Se precisar de ajustes, é só falar" / "Qualquer coisa, é só falar" / "Estou à disposição"
  - "Aqui está o resultado" / "Conforme solicitado" / "Foi um prazer"
  - "Fico feliz em ajudar" / "Com certeza!"
Se já disse o que fez, PARE. Não feche com cortesia.

══════════════════════════════════════════════
`;

        const finalSystemPrompt = survivalRules + segmentPrompt + htmlEnforcementRule;

        let resultJsonString = "{}";

        // ============================================
        // 1. GOOGLE GEMINI
        // ============================================
        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: apiKey });

            const response = await ai.models.generateContent({
                model: 'gemini-1.5-pro',
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

            // Prompt caching: o system prompt é longo (~3500 tokens) e idêntico entre edições
            // da mesma etapa. Marcar com cache_control: "ephemeral" faz a Anthropic cobrar
            // ~10% do preço na 2ª+ chamada dentro de 5min. Economia típica: 70-80% por sessão.
            const response = await anthropic.messages.create({
                model: DEFAULT_ANTHROPIC_MODEL,
                max_tokens: 4000,
                temperature: 0.1,
                system: [
                    { type: "text", text: finalSystemPrompt, cache_control: { type: "ephemeral" } }
                ],
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

        // Mensagem conversacional opcional — quando presente, o front mostra ela em vez do canned text
        const message = (typeof parsedData.message === 'string' && parsedData.message.trim()) ? parsedData.message.trim() : null;

        // Resposta de CLARIFICAÇÃO — a IA está pedindo mais detalhes ao usuário
        if (parsedData.clarification && typeof parsedData.clarification === 'string') {
            return NextResponse.json({ clarification: parsedData.clarification, message });
        }

        // Detecta se a IA realmente retornou steps (vs. só small talk)
        const stepsCandidate = Array.isArray(parsedData) ? parsedData
            : (parsedData.steps && Array.isArray(parsedData.steps)) ? parsedData.steps
            : (parsedData.notes && Array.isArray(parsedData.notes)) ? parsedData.notes
            : null;

        // SMALL TALK: sem steps, sem clarification, só message → devolve só a fala, sem mexer no rascunho
        if (!stepsCandidate && message) {
            return NextResponse.json({ message });
        }

        // Sem nada útil → erro
        if (!stepsCandidate) {
            return NextResponse.json({
                error: 'A I.A. retornou um formato inesperado. Tente reformular sua instrução.',
                rawOutput: resultJsonString
            }, { status: 500 });
        }

        return NextResponse.json({ notes: stepsCandidate, message });

    } catch (error) {
        console.error('API Gen AI Error:', error);
        return NextResponse.json(
            { error: 'Erro interno na comunicação com a API da Inteligência Artificial.', details: error.message },
            { status: 500 }
        );
    }
}
