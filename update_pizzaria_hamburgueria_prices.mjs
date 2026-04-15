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

// Map of names to realistic prices, brands, and suppliers
const dataMap = {
  "Pão Francês": { price: 1.50, brand: "Padaria Local", supplier: "Padaria Local" },
  "Pão de Hambúrguer": { price: 2.50, brand: "Panco", supplier: "Distribuidora Master" },
  "Pão de Brioche": { price: 3.50, brand: "Boulangerie", supplier: "Padaria Artesanal" },
  "Presunto de Parma": { price: 180.00, brand: "Ceratti", supplier: "Armazém Gourmet" },
  "Muçarela de Búfala": { price: 90.00, brand: "La Bufalina", supplier: "Laticínios de Ouro" },
  "Carne Moída - Acém": { price: 35.00, brand: "Friboi", supplier: "Açougue Central" },
  "Carne Moída - Peito": { price: 32.00, brand: "Friboi", supplier: "Açougue Central" },
  "Carne Moída - Fraldinha": { price: 45.00, brand: "Friboi", supplier: "Açougue Central" },
  "Bacon em Fatias": { price: 55.00, brand: "Seara", supplier: "Atacadão Carnes" },
  "Cheddar Fatiado": { price: 48.00, brand: "Polenghi", supplier: "Laticínios de Ouro" },
  "Cebola Roxa": { price: 8.50, brand: "In Natura", supplier: "Ceasa" },
  "Alface Americana": { price: 4.50, brand: "In Natura", supplier: "Ceasa" },
  "Tomate Carmem": { price: 9.00, brand: "In Natura", supplier: "Ceasa" },
  "Picles de Pepino": { price: 35.00, brand: "Hemmer", supplier: "Distribuidora Master" },
  "Mostarda Amarela": { price: 22.00, brand: "Heinz", supplier: "Distribuidora Master" },
  "Farinha de Trigo Especial": { price: 8.50, brand: "Venturelli", supplier: "Moinho Regional" },
  "Fermento Biológico Seco": { price: 65.00, brand: "Fleshman", supplier: "Distribuidora Master" },
  "Tomate Pelati": { price: 28.00, brand: "Mutti", supplier: "Armazém Gourmet" },
  "Azeite de Oliva Extra Virgem": { price: 90.00, brand: "Gallo", supplier: "Armazém Gourmet" },
  "Muçarela": { price: 48.00, brand: "Scala", supplier: "Laticínios de Ouro" },
  "Calabresa Defumada": { price: 28.00, brand: "Seara", supplier: "Atacadão Carnes" },
  "Bacon em Cubos": { price: 45.00, brand: "Seara", supplier: "Atacadão Carnes" },
  "Orégano Seco": { price: 55.00, brand: "Kitano", supplier: "Mercado Central" },
  "Manjericão Fresco": { price: 35.00, brand: "In Natura", supplier: "Ceasa" },
  "Requeijão Cremoso (Catupiry)": { price: 49.00, brand: "Catupiry", supplier: "Laticínios de Ouro" },
  "Parmesão Ralado": { price: 95.00, brand: "Faixa Azul", supplier: "Laticínios de Ouro" },
  "Ovo": { price: 0.80, brand: "Granja", supplier: "Granja Central" }
};

async function run() {
    console.log("Atualizando insumos com preços, marcas e fornecedores...");
    let updatedCount = 0;
    
    const snap = await getDocs(collection(db, "Ingredient"));
    const today = new Date().toISOString().split('T')[0]; // ex: "2026-04-15"

    for (const d of snap.docs) {
        const item = d.data();
        const name = item.name;

        // Se o insumo estiver na nossa lista (ou seja, tem preço 0 ou falta marca/fornecedor)
        if (dataMap[name]) {
            const mapped = dataMap[name];
            
            // Só atualiza se precisar (verificando se não tem marca ou preço 0)
            if (!item.brand || item.current_price === 0 || item.current_price == null) {
                const updatePayload = {
                    current_price: mapped.price,
                    brand: mapped.brand,
                    displayBrand: mapped.brand,
                    main_supplier: mapped.supplier,
                    displaySupplier: mapped.supplier,
                    last_update: today,
                    updatedAt: new Date()
                };

                await updateDoc(doc(db, "Ingredient", d.id), updatePayload);
                console.log(`✅ Atualizado: ${name} (R$ ${mapped.price}, ${mapped.brand}, ${mapped.supplier})`);
                updatedCount++;
            }
        }
    }
    
    console.log(`\nAtualização concluída! Insumos ajustados: ${updatedCount}`);
    process.exit(0);
}

run();
