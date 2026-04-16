---
name: receitas_em_massa
description: "Padrão definitivo para criar fichas técnicas completas diretamente no banco de dados Firestore, gerando código sequencial, status ativo e estrutura idêntica ao frontend."
---

# Como Criar Fichas Técnicas via Script

Esta skill cria receitas diretamente no Firestore usando o endpoint da API local, garantindo que o documento final seja idêntico ao gerado pelo frontend.

---

## Regras Obrigatórias

1. **Usar a API HTTP** (`POST http://localhost:3000/api/recipes`) para criar a receita — isso usa o `Recipe.create()` oficial.
2. **Gerar o código sequencial** com `generateRecipeCode()` e aplicar via `updateDoc` logo após a criação.
3. **Nunca usar `setDoc` direto** para criar receitas — isso bypassa a geração de código e o status ativo.
4. **Ingredientes** devem ter a estrutura rica completa (todos os campos do cadastro + campos de processo).
5. **Perdas por ingrediente** devem ser calculadas individualmente com `applyLosses()`.
6. **Campos de controle de qualidade** devem sempre ser incluídos: `shelf_life`, `storage_temperature`, `allergens`, `ccp_notes`.

---

## Campos do Documento Raiz da Receita

```js
{
  name: "Nome da Receita",
  category: "Nome da Categoria",
  category_id: "ID_DA_CATEGORIA_NO_FIRESTORE",
  type: "receitas",           // "receitas" ou "produtos"
  prep_time: 30,              // minutos
  production_time: 30,
  portion_size: 180,          // gramas por porção (para cálculo nutricional)
  video_url: "",
  notes: "",
  // Controle de Qualidade
  shelf_life: "2 dias",
  storage_temperature: "4 graus",
  allergens: "Não declarado.",
  ccp_notes: "Temperatura mínima: 71°C.",
  preparations: [ /* etapas */ ]
}
```

---

## Campos Obrigatórios de um Ingrediente

Copiar todos os campos do documento `Ingredient` do banco + adicionar os campos de processo:

```js
{
  // — campos do cadastro (cópia da collection Ingredient)
  ingredient_id: ing.id,
  id: ing.id,
  name: ing.name,
  unit: ing.unit,
  current_price: ing.current_price,
  active: true,
  item_type: 'ingrediente',
  ingredient_type: ing.ingredient_type || 'traditional',
  category: ing.category || '',
  brand: ing.brand || '',
  displayBrand: ing.brand || '',
  main_supplier: ing.main_supplier || '',
  displaySupplier: ing.main_supplier || '',
  supplier_id: ing.supplier_id || '',
  supplier_code: ing.supplier_code || '',
  brand_id: ing.brand_id || '',
  min_stock: 0,
  current_stock: 0,
  technical_data: {},
  notes: '',
  chosen_taco_id: ing.chosen_taco_id || null,
  chosen_variation_name: ing.chosen_variation_name || 'Cru',
  taco_variations: ing.taco_variations || [],
  taco_id: ing.taco_id || null,
  commercial_name: ing.commercial_name || '',
  last_update: ing.last_update || '',
  createdAt: ing.createdAt || null,
  updatedAt: ing.updatedAt || null,
  // — campos de processo (definidos por ingrediente)
  quantity: weightRaw,
  weight_frozen: '',
  weight_thawed: '',
  weight_raw: weightRaw,             // Peso bruto (antes da limpeza)
  weight_clean: weightClean,         // Pós limpeza
  weight_pre_cooking: weightClean,   // = pós limpeza (antes de ir para o calor)
  weight_cooked: weightCooked,       // Pós cocção (após chapa/forno/vapor)
  weight_portioned: '',
  dndId: `dnd-${ing.id}-${Date.now()}`,
}
```

---

## Estrutura de uma Etapa (Preparation)

```js
{
  id: gid(),
  title: "1º Etapa: Nome da Etapa",
  processes: ["cleaning", "cooking"],  // define quais colunas aparecem na UI
  ingredients: [ /* array de ingredientes */ ],
  instructions: "",
  notes: [
    {
      id: gid(),
      title: "",
      content: "<p>Texto da nota em HTML</p>",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}
```

### Valores válidos para `processes`:
| Valor | Colunas exibidas na UI |
|---|---|
| `["cleaning", "cooking"]` | Limpeza + Cocção |
| `["defrosting", "cleaning", "cooking"]` | Descongelamento + Limpeza + Cocção |
| `["portioning"]` | Porcionamento (montagem) — sem ingredientes |

---

## Padrão de Arquitetura do Modo de Preparo (\`notes\`)

O modo de preparo deve OBRIGATORIAMENTE seguir uma estrutura rica, detalhada e padronizada utilizando o array de objetos `notes`. É mandatório separar a estrutura por fases macro (através da propriedade \`title\`) e inserir descrições detalhadas (na propriedade \`content\`).

### Diretrizes de Padrão:
1. **Quebra por Fases:** Use itens separados no array de `notes` para cada fase do processo (ex: "Matéria-Prima", "Limpeza", "Cocção", "Assar").
2. **Dados Técnicos nos Textos:** Declare valores reais de pesos pré e pós processo e os rendimentos diretamente nos blocos de conteúdo para balizar quem for executar a receita.
3. **Enumeração Contínua:** Enumere os passos ao longo de todas as notas progressivamente se for uma sequência de ações.

**Exemplo de preenchimento do array \`notes\` (Ação Direta no DB):**

```js
notes: [
  {
    id: gid(),
    title: "MATÉRIA-PRIMA",
    content: "<ul><li>Produto: Arroz cru (será cozido)</li><li>Peso pré-cocção: 0,367 kg</li><li>Peso pós-cocção: 0,916 kg</li><li>Rendimento: 250% (triplica de peso)</li></ul>"
  },
  {
    id: gid(),
    title: "PROCESSO DE LIMPEZA",
    content: "1. Lavar o arroz em água corrente até a água sair cristalina<br>2. Escorrer completamente antes do preparo"
  },
  {
    id: gid(),
    title: "PREPARO DOS TEMPEROS",
    content: "3. Alho:<br> - Peso bruto: 15g<br> - Pós limpeza: 13g<br> - Perda de 12,5% (casca e imperfeições)<br>4. Cebola:...<br>5. Picar alho e cebola finamente"
  },
  {
    id: gid(),
    title: "COCÇÃO",
    content: "6. Aqueça 29mL de óleo de soja em uma panela<br>7. Refogue a cebola (35g) e o alho (13g) até dourarem<br>8. Adicione o arroz lavado (367g) e refogue por 2 minutos..."
  }
]
```

---

## Estrutura da Etapa de Porcionamento (Montagem)

```js
{
  id: gid(),
  title: "2º Etapa: Porcionamento",
  processes: ["portioning"],
  ingredients: [],
  sub_components: [
    {
      id: gid(),
      type: 'preparation',
      source_id: etapa1.id,           // ID da etapa que está sendo puxada
      name: etapa1.title,
      assembly_weight_kg: "0.180",    // peso que será extraído (em kg)
      yield_weight: 0,
      total_cost: 0
    }
  ],
  assembly_config: {
    container_type: "unidade",        // "unidade" ou "kg"
    unit_type: "kg",
    units_quantity: "1",
    total_weight: "",
    notes: ""
  },
  instructions: "",
  notes: []
}
```

---

## Tabela de Perdas de Referência

```js
const LOSSES = {
  // Carnes
  'Acém (peça)':              { cleanLoss: 0.18, cookLoss: 0.25 },
  'Fraldinha (peça)':         { cleanLoss: 0.10, cookLoss: 0.22 },
  'Carne Moída - Acém':       { cleanLoss: 0.05, cookLoss: 0.25 },
  'Carne Moída - Fraldinha':  { cleanLoss: 0.03, cookLoss: 0.22 },
  'Frango (peça)':            { cleanLoss: 0.20, cookLoss: 0.28 },
  'Peito de Frango':          { cleanLoss: 0.05, cookLoss: 0.25 },
  // Legumes e hortaliças
  'Cebola':                   { cleanLoss: 0.10, cookLoss: 0.30 },
  'Alho':                     { cleanLoss: 0.12, cookLoss: 0.00 }, // usado cru
  'Tomate':                   { cleanLoss: 0.10, cookLoss: 0.20 },
  'Cenoura':                  { cleanLoss: 0.22, cookLoss: 0.10 },
  'Batata':                   { cleanLoss: 0.25, cookLoss: 0.05 },
  'Chuchu':                   { cleanLoss: 0.15, cookLoss: 0.10 },
  'Abobrinha':                { cleanLoss: 0.10, cookLoss: 0.15 },
  // Grãos e cereais
  'Arroz':                    { cleanLoss: 0.00, cookLoss: -1.50 }, // Negativo = ganho de peso
  'Feijão Carioca':           { cleanLoss: 0.00, cookLoss: -2.00 }, // Negativo = ganho de peso
  // Temperos secos (sem perda)
  'Sal Refinado':             { cleanLoss: 0.00, cookLoss: 0.00 },
  'Pimenta do Reino':         { cleanLoss: 0.00, cookLoss: 0.00 },
  'Azeite':                   { cleanLoss: 0.00, cookLoss: 0.00 },
  'Óleo de Soja':             { cleanLoss: 0.00, cookLoss: 0.00 },
  // Água
  'Água':                     { cleanLoss: 0.00, cookLoss: 1.00 }, // 100% de evaporação
};

function applyLosses(name, weightRaw) {
  const loss = LOSSES[name] || { cleanLoss: 0, cookLoss: 0 };
  const weightClean     = weightRaw * (1 - loss.cleanLoss);
  const weightPreCooking = weightClean;
  const weightCooked    = loss.cookLoss < 0
    ? weightPreCooking * (1 + Math.abs(loss.cookLoss))  // ganho (arroz, feijão)
    : weightPreCooking * (1 - loss.cookLoss);            // perda (carnes, legumes)
  return {
    weight_raw:         parseFloat(weightRaw.toFixed(5)),
    weight_clean:       parseFloat(weightClean.toFixed(5)),
    weight_pre_cooking: parseFloat(weightPreCooking.toFixed(5)),
    weight_cooked:      parseFloat(weightCooked.toFixed(5)),
    quantity:           weightRaw,
  };
}
```

---

## Função de Geração de Código Sequencial

```js
function generateRecipeCode(recipeName, allCodes = []) {
  const prefix = recipeName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
  let maxGlobalNumber = 0;
  allCodes.forEach(code => {
    const m = code.match(/\d+/);
    if (m) { const n = parseInt(m[0], 10); if (n > maxGlobalNumber) maxGlobalNumber = n; }
  });
  let counter = maxGlobalNumber + 1;
  let newCode = `${prefix}${String(counter).padStart(3, '0')}`;
  while (allCodes.includes(newCode)) { counter++; newCode = `${prefix}${String(counter).padStart(3, '0')}`; }
  return newCode;
}
```

---

## Fluxo Completo de Criação (3 Passos)

### Passo 1 — Criar via API HTTP
```js
const res = await fetch('http://localhost:3000/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(recipePayload)
});
const { data } = await res.json();
const newId = data.id;
```

### Passo 2 — Gerar e Aplicar Código
```js
const snap = await getDocsFromServer(collection(db, 'Recipe'));
const allCodes = snap.docs.map(d => d.data().code).filter(Boolean);
const code = generateRecipeCode(recipePayload.name, allCodes);

await updateDoc(doc(db, 'Recipe', newId), {
  code,
  active: true,
  status: 'active',
  updatedAt: new Date()
});
```

### Passo 3 — Verificar no sistema
Acessar a lista de Receitas no sistema e confirmar que o card aparece com o código e status corretos.

---

## Script Base Completo

Ver: `scripts/create-recipe-template.mjs`
