import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDZp5jHdx6RoDcww_poTH7_UpNFjpdIquE",
  authDomain: "cozinha-matriz-base.firebaseapp.com",
  projectId: "cozinha-matriz-base",
  storageBucket: "cozinha-matriz-base.firebasestorage.app",
  messagingSenderId: "459924162938",
  appId: "1:459924162938:web:9c5f55d19c9e4dcc0e2ec3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mapa de tradução: inglês → português canônico
const typeMap = {
  'recipe': 'receitas',
  'recipes': 'receitas',
  'receita': 'receitas',
  'product': 'produtos',
  'products': 'produtos',
  'produto': 'produtos',
  'ingredient': 'ingredientes',
  'ingredients': 'ingredientes',
  'ingrediente': 'ingredientes',
};

async function migrate() {
  console.log("=== MIGRAÇÃO DE TYPES: Inglês → Português ===\n");

  // ─── 1. Migrar CategoryType (as abas) ───
  console.log("📋 [1/2] Migrando CategoryType...");
  const typesSnap = await getDocs(collection(db, "CategoryType"));
  let typesUpdated = 0;

  for (const d of typesSnap.docs) {
    const data = d.data();
    const oldValue = data.value;
    const newValue = typeMap[oldValue?.toLowerCase()];

    if (newValue && newValue !== oldValue) {
      await updateDoc(doc(db, "CategoryType", d.id), { value: newValue });
      console.log(`   ✅ "${data.label}": value "${oldValue}" → "${newValue}"`);
      typesUpdated++;
    } else {
      console.log(`   ⏭️  "${data.label}": value "${oldValue}" (já OK)`);
    }
  }
  console.log(`   Total atualizado: ${typesUpdated}\n`);

  // ─── 2. Migrar CategoryTree (todas as categorias) ───
  console.log("🌳 [2/2] Migrando CategoryTree...");
  const treeSnap = await getDocs(collection(db, "CategoryTree"));
  let treeUpdated = 0;

  for (const d of treeSnap.docs) {
    const data = d.data();
    const oldType = data.type;
    const newType = typeMap[oldType?.toLowerCase()];

    if (newType && newType !== oldType) {
      await updateDoc(doc(db, "CategoryTree", d.id), { type: newType });
      console.log(`   ✅ "${data.name}": type "${oldType}" → "${newType}"`);
      treeUpdated++;
    } else {
      console.log(`   ⏭️  "${data.name}": type "${oldType}" (já OK)`);
    }
  }
  console.log(`   Total atualizado: ${treeUpdated}\n`);

  console.log("=== MIGRAÇÃO CONCLUÍDA ===");
  console.log(`   CategoryType: ${typesUpdated} atualizados`);
  console.log(`   CategoryTree: ${treeUpdated} atualizados`);
  console.log(`   Nenhum documento foi apagado. Apenas o campo 'type'/'value' foi renomeado.`);
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Erro na migração:", err);
  process.exit(1);
});
