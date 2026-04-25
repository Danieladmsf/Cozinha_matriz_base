import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, Timestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// ── BASE TÉCNICA DE INSUMOS (142 itens) ────────────────────────
const TECH_DATABASE = [
  // CARNES BOVINAS
  { name: 'Acém', cat: 'Carnes', thaw: 0, clean: 18, cook: 27, time: 420, price: 29.90 },
  { name: 'Alcatra', cat: 'Carnes', thaw: 0, clean: 8, cook: 22, time: 240, price: 44.90 },
  { name: 'Contrafilé', cat: 'Carnes', thaw: 0, clean: 10, cook: 22, time: 240, price: 48.90 },
  { name: 'Filé Mignon', cat: 'Carnes', thaw: 0, clean: 12, cook: 20, time: 300, price: 79.90 },
  { name: 'Fraldinha', cat: 'Carnes', thaw: 0, clean: 10, cook: 22, time: 240, price: 38.90 },
  { name: 'Patinho', cat: 'Carnes', thaw: 0, clean: 8, cook: 25, time: 240, price: 34.90 },
  { name: 'Picanha', cat: 'Carnes', thaw: 0, clean: 8, cook: 20, time: 240, price: 69.90 },
  { name: 'Maminha', cat: 'Carnes', thaw: 0, clean: 8, cook: 20, time: 240, price: 44.90 },
  { name: 'Coxão Mole', cat: 'Carnes', thaw: 0, clean: 10, cook: 25, time: 240, price: 36.90 },
  { name: 'Coxão Duro', cat: 'Carnes', thaw: 0, clean: 10, cook: 28, time: 300, price: 32.90 },
  { name: 'Músculo', cat: 'Carnes', thaw: 0, clean: 15, cook: 35, time: 360, price: 28.90 },
  { name: 'Costela Bovina', cat: 'Carnes', thaw: 0, clean: 20, cook: 30, time: 480, price: 25.90 },
  { name: 'Carne Moída', cat: 'Carnes', thaw: 0, clean: 5, cook: 25, time: 120, price: 32.90 },
  { name: 'Bife', cat: 'Carnes', thaw: 0, clean: 8, cook: 25, time: 180, price: 38.90 },
  // SUÍNOS
  { name: 'Pernil Suíno', cat: 'Carnes', thaw: 4, clean: 15, cook: 25, time: 360, price: 22.90 },
  { name: 'Lombo Suíno', cat: 'Carnes', thaw: 4, clean: 8, cook: 20, time: 240, price: 28.90 },
  { name: 'Costelinha Suína', cat: 'Carnes', thaw: 4, clean: 12, cook: 28, time: 360, price: 24.90 },
  { name: 'Bacon', cat: 'Carnes', thaw: 0, clean: 5, cook: 30, time: 120, price: 39.90 },
  { name: 'Linguiça', cat: 'Carnes', thaw: 0, clean: 0, cook: 25, time: 60, price: 19.90 },
  // AVES
  { name: 'Frango Inteiro', cat: 'Aves', thaw: 5, clean: 22, cook: 28, time: 600, price: 12.90 },
  { name: 'Peito de Frango', cat: 'Aves', thaw: 3, clean: 5, cook: 25, time: 180, price: 18.90 },
  { name: 'Coxa e Sobrecoxa', cat: 'Aves', thaw: 3, clean: 10, cook: 25, time: 240, price: 14.90 },
  { name: 'Moela', cat: 'Aves', thaw: 3, clean: 30, cook: 30, time: 600, price: 9.90 },
  { name: 'Peru', cat: 'Aves', thaw: 5, clean: 20, cook: 28, time: 600, price: 16.90 },
  // PEIXES
  { name: 'Salmão', cat: 'Peixes', thaw: 5, clean: 20, cook: 20, time: 480, price: 110.00 },
  { name: 'Atum', cat: 'Peixes', thaw: 5, clean: 20, cook: 20, time: 480, price: 89.90 },
  { name: 'Tilápia', cat: 'Peixes', thaw: 5, clean: 30, cook: 20, time: 600, price: 45.90 },
  { name: 'Merluza', cat: 'Peixes', thaw: 5, clean: 25, cook: 20, time: 480, price: 35.90 },
  { name: 'Camarão', cat: 'Peixes', thaw: 5, clean: 35, cook: 15, time: 900, price: 65.90 },
  { name: 'Lula', cat: 'Peixes', thaw: 5, clean: 25, cook: 15, time: 600, price: 49.90 },
  { name: 'Polvo', cat: 'Peixes', thaw: 5, clean: 20, cook: 35, time: 600, price: 89.90 },
  { name: 'Sardinha', cat: 'Peixes', thaw: 0, clean: 30, cook: 25, time: 600, price: 12.90 },
  // RAÍZES E TUBÉRCULOS
  { name: 'Cenoura', cat: 'Hortifruti', thaw: 0, clean: 22, cook: 10, time: 300, price: 5.90 },
  { name: 'Batata Inglesa', cat: 'Hortifruti', thaw: 0, clean: 25, cook: 5, time: 300, price: 6.90 },
  { name: 'Batata Doce', cat: 'Hortifruti', thaw: 0, clean: 20, cook: 5, time: 300, price: 7.90 },
  { name: 'Mandioca', cat: 'Hortifruti', thaw: 0, clean: 35, cook: 10, time: 360, price: 8.90 },
  { name: 'Inhame', cat: 'Hortifruti', thaw: 0, clean: 30, cook: 10, time: 300, price: 9.90 },
  { name: 'Beterraba', cat: 'Hortifruti', thaw: 0, clean: 20, cook: 15, time: 240, price: 6.90 },
  { name: 'Nabo', cat: 'Hortifruti', thaw: 0, clean: 20, cook: 15, time: 240, price: 7.90 },
  { name: 'Rabanete', cat: 'Hortifruti', thaw: 0, clean: 15, cook: 0, time: 180, price: 8.90 },
  { name: 'Gengibre', cat: 'Hortifruti', thaw: 0, clean: 20, cook: 0, time: 180, price: 19.90 },
  // BULBOS
  { name: 'Cebola', cat: 'Hortifruti', thaw: 0, clean: 10, cook: 30, time: 180, price: 6.50 },
  { name: 'Alho', cat: 'Hortifruti', thaw: 0, clean: 15, cook: 0, time: 300, price: 25.00 },
  { name: 'Alho-Poró', cat: 'Hortifruti', thaw: 0, clean: 20, cook: 15, time: 180, price: 12.90 },
  { name: 'Salsão', cat: 'Hortifruti', thaw: 0, clean: 25, cook: 15, time: 180, price: 14.90 },
  // HORTALIÇAS
  { name: 'Tomate', cat: 'Hortifruti', thaw: 0, clean: 10, cook: 20, time: 120, price: 8.90 },
  { name: 'Pimentão', cat: 'Hortifruti', thaw: 0, clean: 15, cook: 15, time: 180, price: 9.90 },
  { name: 'Abobrinha', cat: 'Hortifruti', thaw: 0, clean: 10, cook: 15, time: 120, price: 7.90 },
  { name: 'Berinjela', cat: 'Hortifruti', thaw: 0, clean: 10, cook: 20, time: 120, price: 8.90 },
  { name: 'Chuchu', cat: 'Hortifruti', thaw: 0, clean: 15, cook: 10, time: 180, price: 5.90 },
  { name: 'Pepino', cat: 'Hortifruti', thaw: 0, clean: 10, cook: 0, time: 120, price: 6.90 },
  { name: 'Brócolis', cat: 'Hortifruti', thaw: 0, clean: 35, cook: 15, time: 240, price: 12.90 },
  { name: 'Couve-Flor', cat: 'Hortifruti', thaw: 0, clean: 40, cook: 15, time: 240, price: 11.90 },
  { name: 'Repolho', cat: 'Hortifruti', thaw: 0, clean: 15, cook: 20, time: 180, price: 5.90 },
  { name: 'Couve', cat: 'Hortifruti', thaw: 0, clean: 20, cook: 30, time: 180, price: 4.90 },
  { name: 'Espinafre', cat: 'Hortifruti', thaw: 0, clean: 20, cook: 50, time: 180, price: 8.90 },
  { name: 'Alface', cat: 'Hortifruti', thaw: 0, clean: 20, cook: 0, time: 120, price: 4.90 },
  { name: 'Rúcula', cat: 'Hortifruti', thaw: 0, clean: 15, cook: 0, time: 120, price: 6.90 },
  { name: 'Vagem', cat: 'Hortifruti', thaw: 0, clean: 10, cook: 15, time: 120, price: 11.90 },
  { name: 'Quiabo', cat: 'Hortifruti', thaw: 0, clean: 8, cook: 20, time: 120, price: 9.90 },
  { name: 'Abóbora', cat: 'Hortifruti', thaw: 0, clean: 30, cook: 15, time: 300, price: 5.90 },
  { name: 'Milho Verde', cat: 'Hortifruti', thaw: 0, clean: 35, cook: 15, time: 300, price: 8.90 },
  { name: 'Aspargo', cat: 'Hortifruti', thaw: 0, clean: 25, cook: 20, time: 240, price: 29.90 },
  // FRUTAS
  { name: 'Limão', cat: 'Hortifruti', thaw: 0, clean: 30, cook: 0, time: 120, price: 7.90 },
  { name: 'Laranja', cat: 'Hortifruti', thaw: 0, clean: 35, cook: 0, time: 120, price: 5.90 },
  { name: 'Banana', cat: 'Hortifruti', thaw: 0, clean: 30, cook: 10, time: 60, price: 5.90 },
  { name: 'Maçã', cat: 'Hortifruti', thaw: 0, clean: 18, cook: 10, time: 120, price: 9.90 },
  { name: 'Abacaxi', cat: 'Hortifruti', thaw: 0, clean: 40, cook: 0, time: 300, price: 6.90 },
  { name: 'Manga', cat: 'Hortifruti', thaw: 0, clean: 35, cook: 0, time: 180, price: 7.90 },
  { name: 'Morango', cat: 'Hortifruti', thaw: 0, clean: 10, cook: 0, time: 120, price: 19.90 },
  { name: 'Coco', cat: 'Hortifruti', thaw: 0, clean: 50, cook: 0, time: 600, price: 12.90 },
  { name: 'Maracujá', cat: 'Hortifruti', thaw: 0, clean: 50, cook: 0, time: 120, price: 9.90 },
  { name: 'Melancia', cat: 'Hortifruti', thaw: 0, clean: 50, cook: 0, time: 180, price: 3.90 },
  // GRÃOS E CEREAIS (cook negativo = absorção de água)
  { name: 'Arroz Branco', cat: 'Grãos', thaw: 0, clean: 0, cook: -150, time: 60, price: 6.00 },
  { name: 'Feijão Carioca', cat: 'Grãos', thaw: 0, clean: 0, cook: -200, time: 120, price: 8.50 },
  { name: 'Lentilha', cat: 'Grãos', thaw: 0, clean: 0, cook: -100, time: 60, price: 12.90 },
  { name: 'Grão de Bico', cat: 'Grãos', thaw: 0, clean: 0, cook: -100, time: 60, price: 14.90 },
  { name: 'Quinoa', cat: 'Grãos', thaw: 0, clean: 0, cook: -80, time: 60, price: 29.90 },
  { name: 'Macarrão', cat: 'Secos', thaw: 0, clean: 0, cook: -60, time: 60, price: 7.90 },
  { name: 'Farinha de Trigo', cat: 'Secos', thaw: 0, clean: 0, cook: 0, time: 0, price: 5.50 },
  { name: 'Amido de Milho', cat: 'Secos', thaw: 0, clean: 0, cook: 0, time: 0, price: 8.90 },
  { name: 'Fubá', cat: 'Secos', thaw: 0, clean: 0, cook: -50, time: 0, price: 4.90 },
  // LATICÍNIOS
  { name: 'Leite Integral', cat: 'Laticínios', thaw: 0, clean: 0, cook: 20, time: 0, price: 5.50 },
  { name: 'Creme de Leite', cat: 'Laticínios', thaw: 0, clean: 0, cook: 10, time: 0, price: 18.00 },
  { name: 'Queijo Mussarela', cat: 'Laticínios', thaw: 0, clean: 0, cook: 20, time: 60, price: 45.00 },
  { name: 'Queijo Prato', cat: 'Laticínios', thaw: 0, clean: 5, cook: 20, time: 60, price: 48.00 },
  { name: 'Ricota', cat: 'Laticínios', thaw: 0, clean: 0, cook: 10, time: 0, price: 22.00 },
  { name: 'Requeijão', cat: 'Laticínios', thaw: 0, clean: 0, cook: 0, time: 0, price: 16.90 },
  { name: 'Manteiga', cat: 'Laticínios', thaw: 0, clean: 0, cook: 15, time: 0, price: 65.00 },
  { name: 'Iogurte', cat: 'Laticínios', thaw: 0, clean: 0, cook: 0, time: 0, price: 12.90 },
  { name: 'Ovo', cat: 'Laticínios', thaw: 0, clean: 12, cook: 10, time: 60, price: 18.90 },
  // ÓLEOS
  { name: 'Azeite de Oliva', cat: 'Mercearia', thaw: 0, clean: 0, cook: 0, time: 0, price: 42.00 },
  { name: 'Óleo de Soja', cat: 'Mercearia', thaw: 0, clean: 0, cook: 0, time: 0, price: 6.50 },
  { name: 'Banha', cat: 'Mercearia', thaw: 0, clean: 0, cook: 10, time: 0, price: 14.90 },
  // TEMPEROS
  { name: 'Sal Refinado', cat: 'Mercearia', thaw: 0, clean: 0, cook: 0, time: 0, price: 3.50 },
  { name: 'Pimenta do Reino', cat: 'Mercearia', thaw: 0, clean: 0, cook: 0, time: 0, price: 39.90 },
  { name: 'Páprica', cat: 'Mercearia', thaw: 0, clean: 0, cook: 0, time: 0, price: 29.90 },
  { name: 'Cominho', cat: 'Mercearia', thaw: 0, clean: 0, cook: 0, time: 0, price: 34.90 },
  { name: 'Açafrão', cat: 'Mercearia', thaw: 0, clean: 0, cook: 0, time: 0, price: 24.90 },
  { name: 'Louro', cat: 'Mercearia', thaw: 0, clean: 0, cook: 0, time: 0, price: 19.90 },
  { name: 'Orégano', cat: 'Mercearia', thaw: 0, clean: 0, cook: 0, time: 0, price: 14.90 },
  { name: 'Manjericão', cat: 'Mercearia', thaw: 0, clean: 10, cook: 20, time: 60, price: 6.90 },
  { name: 'Salsinha', cat: 'Mercearia', thaw: 0, clean: 15, cook: 20, time: 60, price: 4.90 },
  { name: 'Cebolinha', cat: 'Mercearia', thaw: 0, clean: 15, cook: 15, time: 60, price: 4.90 },
  { name: 'Coentro', cat: 'Mercearia', thaw: 0, clean: 15, cook: 20, time: 60, price: 4.90 },
  { name: 'Canela', cat: 'Mercearia', thaw: 0, clean: 0, cook: 0, time: 0, price: 19.90 },
  // CALDOS E CONSERVAS
  { name: 'Caldo de Galinha', cat: 'Mercearia', thaw: 0, clean: 0, cook: 20, time: 0, price: 12.90 },
  { name: 'Extrato de Tomate', cat: 'Mercearia', thaw: 0, clean: 0, cook: 15, time: 0, price: 8.90 },
  { name: 'Azeitona', cat: 'Mercearia', thaw: 0, clean: 5, cook: 0, time: 60, price: 19.90 },
  { name: 'Palmito', cat: 'Mercearia', thaw: 0, clean: 5, cook: 0, time: 30, price: 14.90 },
  { name: 'Cogumelo', cat: 'Mercearia', thaw: 0, clean: 10, cook: 30, time: 120, price: 29.90 },
  { name: 'Água', cat: 'Mercearia', thaw: 0, clean: 0, cook: 100, time: 0, price: 0.01 },
];

const SUPPLIERS = [
  { name: 'Friboi', cat: 'Carnes' },
  { name: 'Seara', cat: 'Aves' },
  { name: 'Sadia', cat: 'Aves' },
  { name: 'Aurora', cat: 'Aves' },
  { name: 'Nestlé', cat: 'Laticínios' },
  { name: 'Piracanjuba', cat: 'Laticínios' },
  { name: 'Itambé', cat: 'Laticínios' },
  { name: 'Bunge', cat: 'Secos' },
  { name: 'Cargill', cat: 'Grãos' },
  { name: 'Ceagesp', cat: 'Hortifruti' },
  { name: 'Distribuidora Atacadista', cat: 'Mercearia' },
];

function genId(prefix = '') {
  return prefix + Math.random().toString(36).substring(2, 15);
}

export async function POST(request) {
  try {
    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
    }

    const basePath = `tenants/${tenantId}`;
    const now = Timestamp.now();
    let counts = { suppliers: 0, ingredients: 0, prices: 0, taco: 0 };

    // 1. SUPPLIERS
    const suppMap = {};
    for (const sup of SUPPLIERS) {
      const id = genId('sup_');
      await setDoc(doc(db, basePath, 'Supplier', id), {
        id, name: sup.name, active: true, createdAt: now, updatedAt: now
      });
      suppMap[sup.cat] = id;
      counts.suppliers++;
    }

    // 2. INGREDIENTS + PRICE HISTORY
    for (const item of TECH_DATABASE) {
      const ingId = genId('ing_');
      const supplierId = suppMap[item.cat] || suppMap['Mercearia'] || null;

      await setDoc(doc(db, basePath, 'Ingredient', ingId), {
        id: ingId,
        name: item.name,
        category: item.cat,
        type: item.cat,
        primary_unit: 'kg',
        supplier_id: supplierId,
        active: true,
        technical_data: {
          thawing_loss_pct: item.thaw,
          cleaning_loss_pct: item.clean,
          cooking_loss_pct: item.cook,
          cleaning_time_per_kg: item.time,
        },
        createdAt: now,
        updatedAt: now
      });
      counts.ingredients++;

      // Price history
      const phId = genId('ph_');
      await setDoc(doc(db, basePath, 'PriceHistory', phId), {
        id: phId,
        ingredient_id: ingId,
        supplier_id: supplierId,
        price: item.price,
        unit: 'kg',
        date: now,
        createdAt: now,
        updatedAt: now
      });
      counts.prices++;
    }

    // 3. TACO (NutritionFood + NutritionCategory)
    try {
      const tacoPath = path.join(process.cwd(), 'data', 'taco.json');
      if (fs.existsSync(tacoPath)) {
        const tacoData = JSON.parse(fs.readFileSync(tacoPath, 'utf8'));
        const categories = [...new Set(tacoData.map(i => i.category))];

        for (const catName of categories) {
          const catId = catName.toLowerCase().replace(/[^\w]/g, '_');
          await setDoc(doc(db, basePath, 'NutritionCategory', catId), {
            id: catId, category: catName, active: true, updatedAt: now
          });
        }

        const toStr = (v) => {
          if (v === null || v === undefined) return '';
          if (v === 0) return '0';
          if (v === 'NA' || v === 'Tr') return v;
          return v.toString();
        };

        for (const item of tacoData) {
          const foodId = `taco_${item.id}`;
          await setDoc(doc(db, basePath, 'NutritionFood', foodId), {
            id: foodId,
            taco_id: String(item.id),
            name: item.description,
            description: item.description,
            category_name: item.category,
            category_id: item.category.toLowerCase().replace(/[^\w]/g, '_'),
            active: true,
            updatedAt: now,
            humidity_percents: toStr(item.humidity_percents),
            energy_kcal: toStr(item.energy_kcal),
            energy_kj: toStr(item.energy_kj),
            protein_g: toStr(item.protein_g),
            lipid_g: toStr(item.lipid_g),
            carbohydrate_g: toStr(item.carbohydrate_g),
            fiber_g: toStr(item.fiber_g),
            ashes_g: toStr(item.ashes_g),
            calcium_mg: toStr(item.calcium_mg),
            magnesium_mg: toStr(item.magnesium_mg),
            manganese_mg: toStr(item.manganese_mg),
            phosphorus_mg: toStr(item.phosphorus_mg),
            iron_mg: toStr(item.iron_mg),
            sodium_mg: toStr(item.sodium_mg),
            potassium_mg: toStr(item.potassium_mg),
            copper_mg: toStr(item.copper_mg),
            zinc_mg: toStr(item.zinc_mg),
            retinol_mcg: toStr(item.retinol_mcg),
            thiamine_mg: toStr(item.thiamine_mg),
            riboflavin_mg: toStr(item.riboflavin_mg),
            pyridoxine_mg: toStr(item.pyridoxine_mg),
            niacin_mg: toStr(item.niacin_mg),
            vitaminC_mg: toStr(item.vitaminC_mg),
            cholesterol_mg: toStr(item.cholesterol_mg),
            saturated_g: toStr(item.saturated_g),
            monounsaturated_g: toStr(item.monounsaturated_g),
            polyunsaturated_g: toStr(item.polyunsaturated_g),
          });
          counts.taco++;
        }
      }
    } catch (tacoErr) {
      console.error('[seed-tenant] Erro no TACO:', tacoErr.message);
    }

    // 4. CONFIGURAÇÃO PADRÃO DA I.A. (CHAVE MESTRA)
    try {
      const aiConfigRef = doc(db, basePath, 'settings', 'ai_config');
      await setDoc(aiConfigRef, {
        aiProvider: 'anthropic',
        apiKey: '',
        baseUrl: '',
        activeProfileId: null,
        createdAt: now,
        updatedAt: now
      });
      console.log(`[seed-tenant] 🤖 Configuração de I.A. aplicada.`);
    } catch (aiErr) {
      console.error('[seed-tenant] Erro ao configurar I.A.:', aiErr.message);
    }

    console.log(`[seed-tenant] ✅ Tenant ${tenantId} semeado:`, counts);
    return NextResponse.json({ success: true, counts });
  } catch (error) {
    console.error('[seed-tenant] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
