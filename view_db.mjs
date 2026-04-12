import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function check() {
    console.log("=== TIPOS DE CATEGORIA (AS ABAS) ===");
    const typesSnap = await getDocs(collection(db, "CategoryType"));
    typesSnap.docs.forEach(d => console.log(`- ${d.data().label} (valor: ${d.data().value})`));

    console.log("\n=== ÁRVORE DE CATEGORIAS CRIADAS ===");
    const treeSnap = await getDocs(collection(db, "CategoryTree"));
    if (treeSnap.empty) {
      console.log("(Nenhuma categoria cadastrada ainda)");
    } else {
      treeSnap.docs.forEach(d => {
          const data = d.data();
          console.log(`- Nome: ${data.name} | Tipo: ${data.type} | Nível: ${data.level}`);
      });
    }

    console.log("\n=== INSUMOS/INGREDIENTES ===");
    const ingSnap = await getDocs(collection(db, "Ingredient"));
    if (ingSnap.empty) {
      console.log("(Nenhum insumo cadastrado ainda)");
    } else {
      console.log(`Total: ${ingSnap.size} insumos cadastrados.`);
      // Limitamos a amostragem pra não floodar o terminal
      ingSnap.docs.slice(0, 5).forEach(d => {
         console.log(`  > ${d.data().name} (Cat: ${d.data().category})`);
      });
    }
    
    console.log("\n=== RECEITAS/FICHAS TÉCNICAS ===");
    const recSnap = await getDocs(collection(db, "Recipe"));
    if (recSnap.empty) {
      console.log("(Nenhuma receita cadastrada ainda)");
    } else {
      console.log(`Total: ${recSnap.size} receitas cadastradas.`);
    }

    process.exit(0);
}
check();
