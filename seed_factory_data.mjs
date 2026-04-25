import { db } from './lib/firebase.js';
import { collection, getDocs, doc, setDoc, query, where, Timestamp } from "firebase/firestore";

// Definição das marcas/fornecedores a serem criadas
const SUPPLIERS = [
  "Friboi", "Seara", "Sadia", "Aurora", "Nestlé", 
  "Danone", "Unilever", "Bunge", "Cargill", "Ambev", 
  "Piracanjuba", "Itambé", "Hortifruti", "Ypê"
];

// Dados dos insumos com Preço Base (Estimado) e Dados Técnicos
const INGREDIENTS = [
  // ── CARNES BOVINAS ─────────────────────────────────────────────
  { name: 'Acém Bovino', category: 'Carnes', unit: 'kg', price: 29.90, brand: 'Friboi', thaw: 0, clean: 18, cook: 27, time: 420 },
  { name: 'Alcatra Bovina', category: 'Carnes', unit: 'kg', price: 44.90, brand: 'Friboi', thaw: 0, clean: 8, cook: 22, time: 240 },
  { name: 'Contrafilé Bovino', category: 'Carnes', unit: 'kg', price: 48.90, brand: 'Friboi', thaw: 0, clean: 10, cook: 22, time: 240 },
  { name: 'Filé Mignon Bovino', category: 'Carnes', unit: 'kg', price: 79.90, brand: 'Friboi', thaw: 0, clean: 12, cook: 20, time: 300 },
  { name: 'Carne Moída Bovina', category: 'Carnes', unit: 'kg', price: 32.90, brand: 'Friboi', thaw: 0, clean: 5, cook: 25, time: 120 },

  // ── CARNES SUÍNAS ──────────────────────────────────────────────
  { name: 'Pernil Suíno', category: 'Carnes', unit: 'kg', price: 22.90, brand: 'Seara', thaw: 4, clean: 15, cook: 25, time: 360 },
  { name: 'Bacon Defumado', category: 'Carnes', unit: 'kg', price: 39.90, brand: 'Sadia', thaw: 0, clean: 5, cook: 30, time: 120 },

  // ── AVES ───────────────────────────────────────────────────────
  { name: 'Peito de Frango', category: 'Aves', unit: 'kg', price: 18.90, brand: 'Aurora', thaw: 3, clean: 5, cook: 25, time: 180 },
  { name: 'Coxa e Sobrecoxa de Frango', category: 'Aves', unit: 'kg', price: 14.90, brand: 'Aurora', thaw: 3, clean: 10, cook: 25, time: 240 },

  // ── PEIXES E FRUTOS DO MAR ────────────────────────────────────
  { name: 'Filé de Tilápia', category: 'Peixes', unit: 'kg', price: 45.90, brand: 'Seara', thaw: 5, clean: 30, cook: 20, time: 600 },
  { name: 'Salmão Fresco', category: 'Peixes', unit: 'kg', price: 110.00, brand: 'Hortifruti', thaw: 5, clean: 20, cook: 20, time: 480 },

  // ── RAÍZES, BULBOS E HORTALIÇAS ───────────────────────────────
  { name: 'Cebola Branca', category: 'Hortifruti', unit: 'kg', price: 6.50, brand: 'Hortifruti', thaw: 0, clean: 10, cook: 30, time: 180 },
  { name: 'Alho Descascado', category: 'Hortifruti', unit: 'kg', price: 25.00, brand: 'Hortifruti', thaw: 0, clean: 0, cook: 0, time: 300 },
  { name: 'Batata Inglesa', category: 'Hortifruti', unit: 'kg', price: 6.90, brand: 'Hortifruti', thaw: 0, clean: 25, cook: 5, time: 300 },
  { name: 'Cenoura', category: 'Hortifruti', unit: 'kg', price: 5.90, brand: 'Hortifruti', thaw: 0, clean: 22, cook: 10, time: 300 },
  { name: 'Tomate Italiano', category: 'Hortifruti', unit: 'kg', price: 8.90, brand: 'Hortifruti', thaw: 0, clean: 10, cook: 20, time: 120 },

  // ── GRÃOS E CEREAIS ───────────────────────────────────────────
  // cookLoss negativo significa ganho (absorção de água)
  { name: 'Arroz Branco', category: 'Grãos', unit: 'kg', price: 6.00, brand: 'Cargill', thaw: 0, clean: 0, cook: -150, time: 60 }, 
  { name: 'Feijão Carioca', category: 'Grãos', unit: 'kg', price: 8.50, brand: 'Cargill', thaw: 0, clean: 0, cook: -200, time: 120 },
  { name: 'Macarrão Espaguete', category: 'Secos', unit: 'kg', price: 7.90, brand: 'Bunge', thaw: 0, clean: 0, cook: -60, time: 60 },
  { name: 'Farinha de Trigo', category: 'Secos', unit: 'kg', price: 5.50, brand: 'Bunge', thaw: 0, clean: 0, cook: 0, time: 0 },

  // ── LATICÍNIOS ───────────────────────────────────────────────
  { name: 'Leite Integral', category: 'Laticínios', unit: 'l', price: 5.50, brand: 'Piracanjuba', thaw: 0, clean: 0, cook: 20, time: 0 },
  { name: 'Creme de Leite', category: 'Laticínios', unit: 'kg', price: 18.00, brand: 'Nestlé', thaw: 0, clean: 0, cook: 10, time: 0 },
  { name: 'Queijo Mussarela', category: 'Laticínios', unit: 'kg', price: 45.00, brand: 'Itambé', thaw: 0, clean: 0, cook: 20, time: 60 },
  { name: 'Manteiga', category: 'Laticínios', unit: 'kg', price: 65.00, brand: 'Itambé', thaw: 0, clean: 0, cook: 15, time: 0 },

  // ── TEMPEROS E ÓLEOS ──────────────────────────────────────────
  { name: 'Óleo de Soja', category: 'Mercearia', unit: 'l', price: 6.50, brand: 'Bunge', thaw: 0, clean: 0, cook: 0, time: 0 },
  { name: 'Azeite de Oliva', category: 'Mercearia', unit: 'l', price: 42.00, brand: 'Cargill', thaw: 0, clean: 0, cook: 0, time: 0 },
  { name: 'Sal Refinado', category: 'Mercearia', unit: 'kg', price: 3.50, brand: 'Cargill', thaw: 0, clean: 0, cook: 0, time: 0 }
];

function generateId(prefix = '') {
  return prefix + Math.random().toString(36).substring(2, 15);
}

// Para obter compatibilidade com os logs do terminal
const log = console.log;

async function runSeeder() {
  log("🚀 Iniciando Seeder de Dados de Fábrica (Suppliers, Ingredients, PriceHistory)...");

  // 1. PROCESSAR SUPPLIERS
  log("\n--- Sincronizando Suppliers ---");
  const suppliersMap = {}; // Guarda IDs dos Suppliers inseridos/encontrados
  
  for (const supName of SUPPLIERS) {
    const q = query(collection(db, 'Supplier'), where("name", "==", supName));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      suppliersMap[supName] = snap.docs[0].id;
      log(`✔️ Fornecedor existente: ${supName}`);
    } else {
      const supId = generateId('sup_');
      await setDoc(doc(db, 'Supplier', supId), {
        id: supId,
        name: supName,
        active: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      suppliersMap[supName] = supId;
      log(`➕ Fornecedor criado: ${supName}`);
    }
  }

  // 2. PROCESSAR INGREDIENTES E HISTÓRICO DE PREÇOS
  log("\n--- Sincronizando Insumos ---");
  
  for (const item of INGREDIENTS) {
    // Busca se ingrediente já existe pelo nome
    const q = query(collection(db, 'Ingredient'), where("name", "==", item.name));
    const snap = await getDocs(q);
    
    let ingId = '';

    const techData = {
      thawing_loss_pct: item.thaw,
      cleaning_loss_pct: item.clean,
      cooking_loss_pct: item.cook,
      cleaning_time_per_kg: item.time
    };

    const targetSupplierId = suppliersMap[item.brand] || null;

    if (!snap.empty) {
      // Atualiza o existente
      ingId = snap.docs[0].id;
      await setDoc(doc(db, 'Ingredient', ingId), {
        ...snap.docs[0].data(),
        technical_data: techData,
        supplier_id: targetSupplierId, // Associa ao fornecedor
        updatedAt: Timestamp.now()
      }, { merge: true });
      log(`🔄 Insumo atualizado: ${item.name}`);
    } else {
      // Cria novo
      ingId = generateId('ing_');
      await setDoc(doc(db, 'Ingredient', ingId), {
        id: ingId,
        name: item.name,
        category: item.category,
        primary_unit: item.unit,
        type: item.category, // fallback for legacy
        supplier_id: targetSupplierId,
        technical_data: techData,
        active: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      log(`➕ Insumo criado: ${item.name}`);
    }

    // 3. INSERIR HISTÓRICO DE PREÇO (PriceHistory)
    const phId = generateId('ph_');
    await setDoc(doc(db, 'PriceHistory', phId), {
      id: phId,
      ingredient_id: ingId,
      supplier_id: targetSupplierId,
      brand: item.brand,
      price: item.price,
      unit: item.unit,
      date: Timestamp.now(),    // Data de validade da cotação
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    log(`   💲 Histórico inserido: R$ ${item.price.toFixed(2)} / ${item.unit} (${item.brand})`);
  }

  log("\n🎉 Seeding concluído com sucesso!");
  process.exit(0);
}

runSeeder().catch(e => {
  console.error("Erro no seeder:", e);
  process.exit(1);
});
