/**
 * Propaga os dados técnicos de TODOS os ingredientes para todas as receitas.
 * Funciona via API que já conhece o alias @/lib (Next.js rodando em localhost:3000).
 */
import { db } from './lib/firebase.js';
import { collection, getDocsFromServer } from "firebase/firestore";

async function propagateAll() {
  console.log('📥 Carregando ingredientes com dados técnicos preenchidos...');
  const snap = await getDocsFromServer(collection(db, 'Ingredient'));

  const withTech = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(i => {
      const td = i.technical_data || {};
      return td.cleaning_loss_pct !== undefined || td.cooking_loss_pct !== undefined;
    });

  console.log(`🔄 ${withTech.length} ingredientes com dados técnicos. Iniciando propagação...\n`);

  let totalUpdated = 0;
  let errors = 0;

  for (const ing of withTech) {
    try {
      // Chama a API interna de save de ingrediente (que aciona propagateIngredientUpdate internamente)
      const res = await fetch(`http://localhost:3000/api/ingredients/${ing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ing,
          technical_data: ing.technical_data
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.propagated && result.propagated > 0) {
          console.log(`📡 ${ing.name} → ${result.propagated} receita(s) atualizada(s)`);
          totalUpdated += result.propagated;
        } else {
          process.stdout.write('.');
        }
      } else {
        // Tenta rota alternativa
        const res2 = await fetch(`http://localhost:3000/api/ingredients?id=${ing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ technical_data: ing.technical_data })
        });
        if (res2.ok) {
          process.stdout.write('.');
        } else {
          errors++;
        }
      }
    } catch (e) {
      errors++;
    }
  }

  console.log(`\n\n══════════════════════════════════════════════`);
  console.log(`✅ Propagação via API concluída`);
  console.log(`   Receitas atualizadas: ${totalUpdated}`);
  console.log(`   Erros: ${errors}`);
  console.log(`══════════════════════════════════════════════`);
  
  // Verificar qual rota de ingredientes existe
  console.log('\n🔍 Verificando rotas disponíveis...');
  try {
    const check = await fetch('http://localhost:3000/api/ingredients?id=test');
    console.log(`   /api/ingredients → status ${check.status}`);
  } catch { console.log('   /api/ingredients → não acessível'); }

  process.exit(0);
}

propagateAll().catch(e => { console.error(e); process.exit(1); });
