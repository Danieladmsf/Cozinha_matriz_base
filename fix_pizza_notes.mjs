/**
 * Atualiza a receita Massa de Pizza Napolitana (MAS004)
 * Move o modo de preparo para os notes (renderizados como "Passos" na UI)
 */
import { db } from './lib/firebase.js';
import { doc, getDoc, updateDoc } from "firebase/firestore";

const gid = () => Math.random().toString(36).slice(2, 18) + Date.now().toString(36);

const RECIPE_ID = '8o5kl4sgYezk7FUO6TOA';

async function main() {
  console.log('📖 Carregando receita...');
  const snap = await getDoc(doc(db, 'Recipe', RECIPE_ID));
  if (!snap.exists()) { console.error('Receita não encontrada!'); process.exit(1); }

  const recipe = snap.data();
  const preps = recipe.preparations || [];
  const etapa1 = preps.find(p => p.title.includes('1ª Etapa'));
  if (!etapa1) { console.error('Etapa 1 não encontrada!'); process.exit(1); }

  // Novo array de notes com TODO o modo de preparo como passos numerados
  const novosNotes = [
    {
      id: gid(),
      title: 'Ativar o Fermento',
      content: '<p>Em uma tigela grande, dissolva o fermento na água junto com o açúcar. Aguarde 5 minutos até espumar levemente.</p>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: gid(),
      title: 'Incorporar a Farinha',
      content: '<p>Adicione a farinha e o sal, misturando de dentro para fora até incorporar tudo. Cubra com plástico filme e leve à geladeira por 1 hora.</p>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: gid(),
      title: 'Dobras da Massa',
      content: '<p>Retire da geladeira e realize as dobras: dobre a massa sobre ela mesma dos 4 lados, cubra e aguarde 30 minutos. Repita o processo 4 vezes com intervalos de 30 minutos entre cada dobra.</p>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: gid(),
      title: 'Fermentação Lenta',
      content: '<p>Transfira a massa para um pote retangular borrifado com água, tampe e leve para a geladeira por até 24 horas. Se preferir, divida e boleie antes de levar à geladeira, colocando as porções em potes untados com óleo.</p>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: gid(),
      title: 'Abertura da Massa',
      content: '<p>Polvilhe semolina ou fubá na bancada e abra a massa com as mãos em movimentos circulares suaves, partindo do centro para as bordas. <strong>Não use rolo</strong> — preserve as bolhas de fermentação.</p>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: gid(),
      title: 'Assar',
      content: '<p>Adicione o molho de tomate e os ingredientes de sua preferência. Leve ao forno preaquecido na temperatura máxima (250–280°C) por 10–15 minutos, até a massa estar dourada e o recheio bem quente.</p><p><em>Forno de pizza a lenha: 400–450°C por 90 segundos.</em></p>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Atualiza etapa 1 com notes completos e instructions limpo
  const etapa1Atualizada = {
    ...etapa1,
    instructions: '', // limpa — tudo vai para notes
    notes: novosNotes,
  };

  // Reconstrói o array de preparações
  const prepAtualizadas = preps.map(p =>
    p.id === etapa1.id ? etapa1Atualizada : p
  );

  await updateDoc(doc(db, 'Recipe', RECIPE_ID), {
    preparations: prepAtualizadas,
    updatedAt: new Date(),
  });

  console.log(`✅ Receita atualizada! ${novosNotes.length} passos adicionados à Etapa 1.`);
  novosNotes.forEach((n, i) => console.log(`   ${i + 1}º Passo: ${n.title}`));
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
