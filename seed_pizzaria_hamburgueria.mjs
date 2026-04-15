import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";

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

const ingredients = [
  // Solicitados
  { name: "Pão Francês", unit: "unidade", category: "Panificação" },
  { name: "Pão de Hambúrguer", unit: "unidade", category: "Panificação" },
  { name: "Pão de Brioche", unit: "unidade", category: "Panificação" },
  { name: "Presunto de Parma", unit: "Kg", category: "Frios e Embutidos" },
  { name: "Muçarela de Búfala", unit: "Kg", category: "Laticínios" },

  // Base Hambúrguer
  { name: "Carne Moída - Acém", unit: "Kg", category: "Açougue" },
  { name: "Carne Moída - Peito", unit: "Kg", category: "Açougue" },
  { name: "Carne Moída - Fraldinha", unit: "Kg", category: "Açougue" },
  { name: "Bacon em Fatias", unit: "Kg", category: "Frios e Embutidos" },
  { name: "Cheddar Fatiado", unit: "Kg", category: "Laticínios" },
  { name: "Cebola Roxa", unit: "Kg", category: "Hortifruti" },
  { name: "Alface Americana", unit: "unidade", category: "Hortifruti" },
  { name: "Tomate Carmem", unit: "Kg", category: "Hortifruti" },
  { name: "Picles de Pepino", unit: "Kg", category: "Mercearia" },
  { name: "Maionese", unit: "Kg", category: "Mercearia" },
  { name: "Ketchup", unit: "Kg", category: "Mercearia" },
  { name: "Mostarda Amarela", unit: "Kg", category: "Mercearia" },

  // Base Pizza
  { name: "Farinha de Trigo Especial", unit: "Kg", category: "Mercearia" },
  { name: "Fermento Biológico Seco", unit: "Kg", category: "Mercearia" },
  { name: "Tomate Pelati", unit: "Kg", category: "Mercearia" },
  { name: "Azeite de Oliva Extra Virgem", unit: "l", category: "Mercearia" },
  { name: "Muçarela", unit: "Kg", category: "Laticínios" },
  { name: "Calabresa Defumada", unit: "Kg", category: "Frios e Embutidos" },
  { name: "Bacon em Cubos", unit: "Kg", category: "Frios e Embutidos" },
  { name: "Orégano Seco", unit: "Kg", category: "Especiarias" },
  { name: "Manjericão Fresco", unit: "Kg", category: "Hortifruti" },
  { name: "Requeijão Cremoso (Catupiry)", unit: "Kg", category: "Laticínios" },
  { name: "Parmesão Ralado", unit: "Kg", category: "Laticínios" },
  { name: "Ovo", unit: "unidade", category: "Mercearia" }
];

async function seed() {
    console.log("Adicionando insumos para Pizzas e Hambúrgueres...");
    let addedCount = 0;
    
    // Primeiro pegar todos para evitar duplicação (por nome)
    const existingSnap = await getDocs(collection(db, "Ingredient"));
    const existingNames = new Set();
    existingSnap.forEach(doc => {
        existingNames.add(doc.data().name?.trim().toLowerCase());
    });

    for (const item of ingredients) {
        if(existingNames.has(item.name.toLowerCase())) {
            console.log(`[SKIP] Insumo já existe: ${item.name}`);
            continue;
        }

        const data = {
            ...item,
            current_price: 0,
            active: true,
            ingredient_type: "traditional",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        try {
            await addDoc(collection(db, "Ingredient"), data);
            console.log(`✅ Adicionado: ${item.name}`);
            addedCount++;
        } catch(e) {
            console.error(`Erro ao adicionar ${item.name}:`, e);
        }
    }
    
    console.log(`\nInserção concluída! Novos insumos cadastrados: ${addedCount}`);
    process.exit(0);
}

seed();
