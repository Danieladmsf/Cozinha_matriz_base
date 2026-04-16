/**
 * Corrige erros específicos nos dados técnicos dos ingredientes.
 */
import { db } from './lib/firebase.js';
import { collection, getDocsFromServer, doc, updateDoc } from "firebase/firestore";

// Correções pontuais: nome_do_ingrediente → dados corretos
const CORRECTIONS = {
  'Farinha de Mandioca':  { thaw: 0, clean: 0,  cook: 0,  time: 0   }, // já é farinha processada
  'Chuchu':               { thaw: 0, clean: 15, cook: 10, time: 180 }, // era 25%, correto é 15%
  'Couve Manteiga':       { thaw: 0, clean: 20, cook: 30, time: 180 }, // talos e folhas com dano
  'Arroz':                { thaw: 0, clean: 0,  cook: -150, time: 60 }, // já está certo, mantém
  'Feijão Carioca':       { thaw: 0, clean: 0,  cook: -200, time: 120 }, // já está certo, mantém
  // Outros que podem ter casado errado via keyword
  'Farinha de Trigo':     { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'Farinha de Trigo Especial': { thaw: 0, clean: 0, cook: 0, time: 0 },
  'Farinha de Milho':     { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'Amido de Milho':       { thaw: 0, clean: 0,  cook: 0,  time: 0   },
};

async function fixData() {
  console.log('📥 Carregando ingredientes...');
  const snap = await getDocsFromServer(collection(db, 'Ingredient'));
  const ingredients = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  let fixed = 0;

  for (const ing of ingredients) {
    const correction = CORRECTIONS[ing.name];
    if (!correction) continue;

    const current = ing.technical_data || {};

    // Só atualiza se for diferente
    const changed =
      current.thawing_loss_pct    !== correction.thaw  ||
      current.cleaning_loss_pct   !== correction.clean ||
      current.cooking_loss_pct    !== correction.cook  ||
      current.cleaning_time_per_kg !== correction.time;

    if (!changed) {
      console.log(`   ✓ ${ing.name} — sem alteração necessária`);
      continue;
    }

    await updateDoc(doc(db, 'Ingredient', ing.id), {
      technical_data: {
        thawing_loss_pct:     correction.thaw,
        cleaning_loss_pct:    correction.clean,
        cooking_loss_pct:     correction.cook,
        cleaning_time_per_kg: correction.time,
      },
      updatedAt: new Date()
    });

    const cookLabel = correction.cook < 0
      ? `⬆ +${Math.abs(correction.cook)}%`
      : `⬇ ${correction.cook}%`;

    console.log(`✅ ${ing.name} — Limpeza: ${correction.clean}% | Cocção: ${cookLabel}`);
    fixed++;
  }

  console.log(`\n✅ ${fixed} ingredientes corrigidos.`);
  process.exit(0);
}

fixData().catch(e => { console.error(e); process.exit(1); });
