/**
 * Preenche os Dados Técnicos (perdas e tempo de mão de obra) de todos os ingredientes
 * com base em referências culinárias padrão da gastronomia brasileira.
 * 
 * Campos:
 *   technical_data.thawing_loss_pct   = % perda no descongelamento
 *   technical_data.cleaning_loss_pct  = % perda na limpeza (casca, nervo, osso, talo)
 *   technical_data.cooking_loss_pct   = % perda na cocção (evaporação, gordura, umidade)
 *   technical_data.cleaning_time_per_kg = segundos de mão de obra por kg
 */
import { db } from './lib/firebase.js';
import { collection, getDocsFromServer, doc, updateDoc } from "firebase/firestore";

// ──────────────────────────────────────────────────────────────────
// BASE DE CONHECIMENTO TÉCNICO
// thaw = descongelamento, clean = limpeza, cook = cocção
// time = tempo de pré-preparo em segundos/kg
// ──────────────────────────────────────────────────────────────────
const TECH_DATABASE = [

  // ── CARNES BOVINAS ─────────────────────────────────────────────
  { match: ['acém', 'acem'],                        thaw: 0,  clean: 18, cook: 27, time: 420 },
  { match: ['alcatra'],                             thaw: 0,  clean: 8,  cook: 22, time: 240 },
  { match: ['contrafilé', 'contrafile'],            thaw: 0,  clean: 10, cook: 22, time: 240 },
  { match: ['filé mignon', 'file mignon', 'filé'], thaw: 0,  clean: 12, cook: 20, time: 300 },
  { match: ['fraldinha'],                           thaw: 0,  clean: 10, cook: 22, time: 240 },
  { match: ['patinho'],                             thaw: 0,  clean: 8,  cook: 25, time: 240 },
  { match: ['picanha'],                             thaw: 0,  clean: 8,  cook: 20, time: 240 },
  { match: ['maminha'],                             thaw: 0,  clean: 8,  cook: 20, time: 240 },
  { match: ['coxão mole', 'coxao mole'],            thaw: 0,  clean: 10, cook: 25, time: 240 },
  { match: ['coxão duro', 'coxao duro'],            thaw: 0,  clean: 10, cook: 28, time: 300 },
  { match: ['músculo', 'musculo'],                  thaw: 0,  clean: 15, cook: 35, time: 360 },
  { match: ['costela bovina', 'costela'],           thaw: 0,  clean: 20, cook: 30, time: 480 },
  { match: ['carne moída', 'carne moida'],          thaw: 0,  clean: 5,  cook: 25, time: 120 },
  { match: ['bife'],                                thaw: 0,  clean: 8,  cook: 25, time: 180 },

  // ── CARNES SUÍNAS ──────────────────────────────────────────────
  { match: ['pernil suíno', 'pernil'],              thaw: 4,  clean: 15, cook: 25, time: 360 },
  { match: ['lombo suíno', 'lombo'],                thaw: 4,  clean: 8,  cook: 20, time: 240 },
  { match: ['costelinha', 'costela suína'],         thaw: 4,  clean: 12, cook: 28, time: 360 },
  { match: ['bacon', 'panceta'],                    thaw: 0,  clean: 5,  cook: 30, time: 120 },
  { match: ['linguiça', 'linguica'],                thaw: 0,  clean: 0,  cook: 25, time: 60  },

  // ── AVES ───────────────────────────────────────────────────────
  { match: ['frango inteiro'],                      thaw: 5,  clean: 22, cook: 28, time: 600 },
  { match: ['peito de frango', 'peito frango'],     thaw: 3,  clean: 5,  cook: 25, time: 180 },
  { match: ['coxa', 'sobrecoxa', 'coxa e sobre'],  thaw: 3,  clean: 10, cook: 25, time: 240 },
  { match: ['pé de frango', 'moela'],               thaw: 3,  clean: 30, cook: 30, time: 600 },
  { match: ['frango'],                              thaw: 4,  clean: 18, cook: 27, time: 480 },
  { match: ['peru'],                                thaw: 5,  clean: 20, cook: 28, time: 600 },

  // ── PEIXES E FRUTOS DO MAR ────────────────────────────────────
  { match: ['salmão', 'salmao'],                    thaw: 5,  clean: 20, cook: 20, time: 480 },
  { match: ['atum'],                                thaw: 5,  clean: 20, cook: 20, time: 480 },
  { match: ['tilápia', 'tilapia'],                  thaw: 5,  clean: 30, cook: 20, time: 600 },
  { match: ['merluza', 'bacalhau'],                 thaw: 5,  clean: 25, cook: 20, time: 480 },
  { match: ['camarão', 'camarao'],                  thaw: 5,  clean: 35, cook: 15, time: 900 },
  { match: ['lula'],                                thaw: 5,  clean: 25, cook: 15, time: 600 },
  { match: ['polvo'],                               thaw: 5,  clean: 20, cook: 35, time: 600 },
  { match: ['mariscos', 'marisco'],                 thaw: 5,  clean: 40, cook: 20, time: 900 },
  { match: ['sardinha'],                            thaw: 0,  clean: 30, cook: 25, time: 600 },

  // ── RAÍZES, TUBÉRCULOS E BULBOS ───────────────────────────────
  { match: ['cenoura'],                             thaw: 0,  clean: 22, cook: 10, time: 300 },
  { match: ['batata inglesa', 'batata'],            thaw: 0,  clean: 25, cook: 5,  time: 300 },
  { match: ['batata-doce', 'batata doce'],          thaw: 0,  clean: 20, cook: 5,  time: 300 },
  { match: ['batata baroa', 'baroa', 'chuchú'],     thaw: 0,  clean: 25, cook: 10, time: 300 },
  { match: ['mandioca', 'aipim', 'macaxeira'],      thaw: 0,  clean: 35, cook: 10, time: 360 },
  { match: ['inhame', 'cará', 'cara'],              thaw: 0,  clean: 30, cook: 10, time: 300 },
  { match: ['beterraba'],                           thaw: 0,  clean: 20, cook: 15, time: 240 },
  { match: ['nabo'],                                thaw: 0,  clean: 20, cook: 15, time: 240 },
  { match: ['rabanete'],                            thaw: 0,  clean: 15, cook: 0,  time: 180 },
  { match: ['gengibre'],                            thaw: 0,  clean: 20, cook: 0,  time: 180 },
  { match: ['batata asterix'],                      thaw: 0,  clean: 25, cook: 5,  time: 300 },

  // ── BULBOS ────────────────────────────────────────────────────
  { match: ['cebola'],                              thaw: 0,  clean: 10, cook: 30, time: 180 },
  { match: ['alho'],                                thaw: 0,  clean: 15, cook: 0,  time: 300 },
  { match: ['alho-poró', 'alho poro'],              thaw: 0,  clean: 20, cook: 15, time: 180 },
  { match: ['salsão', 'salsao', 'aipo'],            thaw: 0,  clean: 25, cook: 15, time: 180 },

  // ── HORTALIÇAS E VERDURAS ─────────────────────────────────────
  { match: ['tomate'],                              thaw: 0,  clean: 10, cook: 20, time: 120 },
  { match: ['pimentão', 'pimentao'],                thaw: 0,  clean: 15, cook: 15, time: 180 },
  { match: ['abobrinha', 'abobrinha italiana'],     thaw: 0,  clean: 10, cook: 15, time: 120 },
  { match: ['berinjela'],                           thaw: 0,  clean: 10, cook: 20, time: 120 },
  { match: ['chuchu'],                              thaw: 0,  clean: 15, cook: 10, time: 180 },
  { match: ['pepino'],                              thaw: 0,  clean: 10, cook: 0,  time: 120 },
  { match: ['brócolis', 'brocolis'],                thaw: 0,  clean: 35, cook: 15, time: 240 },
  { match: ['couve-flor', 'couve flor'],            thaw: 0,  clean: 40, cook: 15, time: 240 },
  { match: ['repolho'],                             thaw: 0,  clean: 15, cook: 20, time: 180 },
  { match: ['couve'],                               thaw: 0,  clean: 20, cook: 30, time: 180 },
  { match: ['espinafre'],                           thaw: 0,  clean: 20, cook: 50, time: 180 },
  { match: ['alface'],                              thaw: 0,  clean: 20, cook: 0,  time: 120 },
  { match: ['rúcula', 'rucula'],                    thaw: 0,  clean: 15, cook: 0,  time: 120 },
  { match: ['acelga'],                              thaw: 0,  clean: 15, cook: 30, time: 120 },
  { match: ['agrião', 'agriao'],                    thaw: 0,  clean: 20, cook: 20, time: 120 },
  { match: ['chicória', 'chicoria'],                thaw: 0,  clean: 15, cook: 0,  time: 120 },
  { match: ['aspargo'],                             thaw: 0,  clean: 25, cook: 20, time: 240 },
  { match: ['vagem'],                               thaw: 0,  clean: 10, cook: 15, time: 120 },
  { match: ['ervilha torta', 'ervilha fresca'],     thaw: 0,  clean: 5,  cook: 10, time: 120 },
  { match: ['milho verde'],                         thaw: 0,  clean: 35, cook: 15, time: 300 },
  { match: ['jiló', 'jilo'],                        thaw: 0,  clean: 5,  cook: 20, vtime: 120 },
  { match: ['quiabo'],                              thaw: 0,  clean: 8,  cook: 20, time: 120 },
  { match: ['maxixe'],                              thaw: 0,  clean: 10, cook: 15, time: 120 },
  { match: ['abóbora', 'abobora', 'moranga'],       thaw: 0,  clean: 30, cook: 15, time: 300 },
  { match: ['cará roxo'],                           thaw: 0,  clean: 30, cook: 10, time: 300 },

  // ── FRUTAS ────────────────────────────────────────────────────
  { match: ['limão', 'limao', 'lima'],              thaw: 0,  clean: 30, cook: 0,  time: 120 },
  { match: ['laranja'],                             thaw: 0,  clean: 35, cook: 0,  time: 120 },
  { match: ['banana'],                              thaw: 0,  clean: 30, cook: 10, time: 60  },
  { match: ['maçã', 'maca'],                       thaw: 0,  clean: 18, cook: 10, time: 120 },
  { match: ['abacaxi', 'ananás'],                   thaw: 0,  clean: 40, cook: 0,  time: 300 },
  { match: ['manga'],                               thaw: 0,  clean: 35, cook: 0,  time: 180 },
  { match: ['mamão', 'mamao'],                      thaw: 0,  clean: 30, cook: 0,  time: 120 },
  { match: ['coco ralado', 'coco'],                 thaw: 0,  clean: 50, cook: 0,  time: 600 },
  { match: ['maracujá', 'maracuja'],                thaw: 0,  clean: 50, cook: 0,  time: 120 },
  { match: ['morango'],                             thaw: 0,  clean: 10, cook: 0,  time: 120 },
  { match: ['uva'],                                 thaw: 0,  clean: 5,  cook: 0,  time: 60  },
  { match: ['pêssego', 'pessego'],                  thaw: 0,  clean: 15, cook: 0,  time: 120 },
  { match: ['pera'],                                thaw: 0,  clean: 15, cook: 10, time: 120 },
  { match: ['melão', 'melao'],                      thaw: 0,  clean: 35, cook: 0,  time: 180 },
  { match: ['melancia'],                            thaw: 0,  clean: 50, cook: 0,  time: 180 },

  // ── GRÃOS, CEREAIS E MASSAS ───────────────────────────────────
  { match: ['arroz'],                               thaw: 0,  clean: 0,  cook: -150, time: 60  }, // GANHO: absorve água (negativo = ganho)
  { match: ['feijão', 'feijao'],                    thaw: 0,  clean: 0,  cook: -200, time: 120 }, // GANHO
  { match: ['lentilha'],                            thaw: 0,  clean: 0,  cook: -100, time: 60  },
  { match: ['grão-de-bico', 'grao de bico'],        thaw: 0,  clean: 0,  cook: -100, time: 60  },
  { match: ['ervilha seca'],                        thaw: 0,  clean: 0,  cook: -80,  time: 60  },
  { match: ['canjica', 'milho canjica'],             thaw: 0,  clean: 0,  cook: -120, time: 60  },
  { match: ['quinoa'],                              thaw: 0,  clean: 0,  cook: -80,  time: 60  },
  { match: ['macarrão', 'massa', 'macarrao'],       thaw: 0,  clean: 0,  cook: -60,  time: 60  },
  { match: ['farinha de trigo', 'farinha'],         thaw: 0,  clean: 0,  cook: 0,    time: 0   },
  { match: ['amido', 'maisena', 'maizena'],         thaw: 0,  clean: 0,  cook: 0,    time: 0   },
  { match: ['fubá', 'fuba'],                        thaw: 0,  clean: 0,  cook: -50,  time: 0   },
  { match: ['polenta'],                             thaw: 0,  clean: 0,  cook: -50,  time: 0   },

  // ── LATICÍNIOS E OVOS ─────────────────────────────────────────
  { match: ['leite'],                               thaw: 0,  clean: 0,  cook: 20, time: 0   },
  { match: ['creme de leite'],                      thaw: 0,  clean: 0,  cook: 10, time: 0   },
  { match: ['queijo mussarela', 'mussarela'],       thaw: 0,  clean: 0,  cook: 20, time: 60  },
  { match: ['queijo prato', 'queijo'],              thaw: 0,  clean: 5,  cook: 20, time: 60  },
  { match: ['ricota'],                              thaw: 0,  clean: 0,  cook: 10, time: 0   },
  { match: ['requeijão', 'requeijao'],              thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['manteiga'],                            thaw: 0,  clean: 0,  cook: 15, time: 0   },
  { match: ['iogurte'],                             thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['ovo', 'ovos'],                         thaw: 0,  clean: 12, cook: 10, time: 60  }, // 12% casca

  // ── ÓLEOS E GORDURAS ──────────────────────────────────────────
  { match: ['azeite'],                              thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['óleo de soja', 'oleo de soja'],        thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['óleo de girassol'],                    thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['banha'],                               thaw: 0,  clean: 0,  cook: 10, time: 0   },

  // ── TEMPEROS SECOS E AROMÁTICOS ───────────────────────────────
  { match: ['sal', 'sal refinado', 'sal marinho'],  thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['pimenta do reino', 'pimenta'],         thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['páprica', 'paprica', 'paprika'],       thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['cominho', 'cuminho'],                  thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['açafrão', 'acafrao', 'cúrcuma', 'curcuma'], thaw: 0, clean: 0, cook: 0, time: 0 },
  { match: ['louro'],                               thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['orégano', 'oregano'],                  thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['tomilho'],                             thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['alecrim'],                             thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['sálvia', 'salvia'],                    thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['manjericão', 'manjericao', 'basilico'],thaw: 0,  clean: 10, cook: 20, time: 60  },
  { match: ['salsinha', 'salsa'],                   thaw: 0,  clean: 15, cook: 20, time: 60  },
  { match: ['cebolinha'],                           thaw: 0,  clean: 15, cook: 15, time: 60  },
  { match: ['coentro'],                             thaw: 0,  clean: 15, cook: 20, time: 60  },
  { match: ['hortelã', 'hortela'],                  thaw: 0,  clean: 15, cook: 15, time: 60  },
  { match: ['canela'],                              thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['noz-moscada', 'noz moscada'],          thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['cravo'],                               thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['curry'],                               thaw: 0,  clean: 0,  cook: 0,  time: 0   },
  { match: ['chimichurri'],                         thaw: 0,  clean: 0,  cook: 0,  time: 0   },

  // ── CALDOS, CONSERVAS E PROCESSADOS ──────────────────────────
  { match: ['caldo de galinha', 'caldo de carne', 'caldo'],  thaw: 0, clean: 0, cook: 20, time: 0 },
  { match: ['extrato de tomate', 'molho de tomate'],          thaw: 0, clean: 0, cook: 15, time: 0 },
  { match: ['azeitona'],                            thaw: 0,  clean: 5,  cook: 0,  time: 60  },
  { match: ['palmito'],                             thaw: 0,  clean: 5,  cook: 0,  time: 30  },
  { match: ['milho'],                               thaw: 0,  clean: 5,  cook: 0,  time: 30  },
  { match: ['ervilha'],                             thaw: 0,  clean: 5,  cook: 0,  time: 30  },
  { match: ['cogumelo', 'champignon'],              thaw: 0,  clean: 10, cook: 30, time: 120 },

  // ── ÁGUA ──────────────────────────────────────────────────────
  { match: ['água', 'agua'],                        thaw: 0,  clean: 0,  cook: 100, time: 0  }, // evapora toda
];

// ──────────────────────────────────────────────────────────────────
// MOTOR DE MATCHING
// ──────────────────────────────────────────────────────────────────
function normalize(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function findTechData(ingredientName) {
  const name = normalize(ingredientName);

  // Busca do mais específico para o mais genérico (por tamanho do match)
  let bestMatch = null;
  let bestLength = 0;

  for (const entry of TECH_DATABASE) {
    for (const keyword of entry.match) {
      const kw = normalize(keyword);
      if (name.includes(kw) && kw.length > bestLength) {
        bestLength = kw.length;
        bestMatch = entry;
      }
    }
  }

  return bestMatch;
}

// ──────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('📥 Carregando ingredientes do banco...');
  const snap = await getDocsFromServer(collection(db, 'Ingredient'));

  const ingredients = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(i => i.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`\n📦 ${ingredients.length} ingredientes ativos encontrados.\n`);

  let updated = 0;
  let skipped = 0;
  const notFound = [];

  for (const ing of ingredients) {
    const tech = findTechData(ing.name);

    if (!tech) {
      notFound.push(ing.name);
      skipped++;
      continue;
    }

    // Converter perda de cocção negativa (ganho de peso) para o formato correto
    // O banco sempre guarda como positivo; negativo significa absorção
    const cookLoss = tech.cook;

    const techData = {
      thawing_loss_pct:    tech.thaw,
      cleaning_loss_pct:   tech.clean,
      cooking_loss_pct:    cookLoss,
      cleaning_time_per_kg: tech.time, // em segundos
    };

    // Só atualizar se algum valor for diferente do atual
    const current = ing.technical_data || {};
    const changed =
      current.thawing_loss_pct    !== techData.thawing_loss_pct  ||
      current.cleaning_loss_pct   !== techData.cleaning_loss_pct ||
      current.cooking_loss_pct    !== techData.cooking_loss_pct  ||
      current.cleaning_time_per_kg !== techData.cleaning_time_per_kg;

    if (!changed) {
      console.log(`   ✓ ${ing.name} — sem alteração`);
      continue;
    }

    await updateDoc(doc(db, 'Ingredient', ing.id), {
      technical_data: techData,
      updatedAt: new Date()
    });

    const gainLabel = cookLoss < 0 ? `⬆ +${Math.abs(cookLoss)}% (absorção)` : `⬇ ${cookLoss}%`;
    console.log(`✅ ${ing.name}`);
    console.log(`   Descongelamento: ${tech.thaw}% | Limpeza: ${tech.clean}% | Cocção: ${gainLabel} | Tempo: ${tech.time / 60} min/kg`);
    updated++;
  }

  console.log(`\n══════════════════════════════════`);
  console.log(`✅ ${updated} ingredientes atualizados`);
  console.log(`⚪ ${skipped} sem correspondência`);
  if (notFound.length > 0) {
    console.log(`\n📋 Ingredientes sem mapeamento (preencher manualmente):`);
    notFound.forEach(n => console.log(`   - ${n}`));
  }
  console.log(`══════════════════════════════════`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
