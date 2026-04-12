import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

const defaults = [
    'Laticínios', 'Carnes', 'Vegetais', 'Frutas', 
    'Grãos', 'Temperos', 'Massas', 'Molhos', 'Bebidas', 'Outros'
];

async function clean() {
    console.log("Iniciando limpeza de Categories (Roots defaut)...");
    const snap = await getDocs(collection(db, "Category"));
    
    let cont = 0;
    for (let docSnap of snap.docs) {
        const data = docSnap.data();
        if (defaults.includes(data.name) && data.description === 'Categoria padrão do sistema') {
            await deleteDoc(doc(db, "Category", docSnap.id));
            console.log("Deletada categoria raiz auto-gerada:", data.name);
            cont++;
        }
    }
    console.log(`Foram deletadas ${cont} categorias padrões fantasma!`);
    process.exit(0);
}
clean();
