import { propagateIngredientUpdate } from '@/lib/services/recipePropagationService';
import { Ingredient } from '@/app/api/entities';

/**
 * POST /api/ingredients/propagate-all
 * Propaga os dados técnicos de TODOS os ingredientes para todas as receitas.
 */
export async function POST(request) {
  try {
    const start = Date.now();
    const ingredients = await Ingredient.list();

    const withTech = ingredients.filter(i => {
      const td = i.technical_data || {};
      return td.cleaning_loss_pct !== undefined || td.cooking_loss_pct !== undefined;
    });

    console.log(`[PROPAGATE-ALL] ${withTech.length} ingredientes com dados técnicos.`);

    let totalCount = 0;
    const errors = [];
    const updated = [];

    for (const ing of withTech) {
      try {
        const result = await propagateIngredientUpdate(ing.id, ing);
        if (result.count > 0) {
          totalCount += result.count;
          updated.push({ ingredient: ing.name, recipes: result.count });
          console.log(`[PROPAGATE-ALL] ${ing.name} → ${result.count} receita(s)`);
        }
      } catch (err) {
        errors.push({ ingredient: ing.name, error: err.message });
        console.error(`[PROPAGATE-ALL] Erro em ${ing.name}:`, err.message);
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    return Response.json({
      success: true,
      summary: {
        ingredients_processed: withTech.length,
        recipes_updated: totalCount,
        errors: errors.length,
        elapsed_seconds: elapsed
      },
      updated,
      errors
    });

  } catch (error) {
    console.error('[PROPAGATE-ALL] Erro fatal:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
