import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

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

const typesToCreate = [
  { value: "ingredient", label: "Insumos", is_system: true, order: 1 },
  { value: "recipe", label: "Receitas", is_system: true, order: 2 },
  { value: "product", label: "Produtos SKU", is_system: true, order: 3 },
  { value: "equipment", label: "Equipamentos", is_system: true, order: 4 },
  { value: "pack", label: "Embalagens", is_system: true, order: 5 }
];

async function seed() {
    console.log("Limpando coleção CategoryType e recriando padrões...");
    // 1. Apaga tudo que tem lá
    const snap = await getDocs(collection(db, "CategoryType"));
    for (let docSnap of snap.docs) {
        await deleteDoc(doc(db, "CategoryType", docSnap.id));
    }

    // 2. Cria só os padrões oficiais
    for (const t of typesToCreate) {
        await addDoc(collection(db, "CategoryType"), {
            ...t,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log("Criado padrão:", t.label);
    }
    
    console.log("Seeding concluído!");
    process.exit(0);
}
seed();
