import { CategoryTree } from '@/app/api/entities';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Normalização canônica de tipos — garante consistência no banco
const TYPE_ALIASES = {
  'recipe': 'receitas', 'recipes': 'receitas', 'receita': 'receitas',
  'product': 'produtos', 'products': 'produtos', 'produto': 'produtos',
  'ingredient': 'ingredientes', 'ingredients': 'ingredientes', 'ingrediente': 'ingredientes',
};

function normalizeType(rawType) {
  const t = (rawType || '').toLowerCase().trim();
  return TYPE_ALIASES[t] || t || 'receitas';
}

// GET /api/category-tree - Buscar categorias da árvore
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let categories = await CategoryTree.getAll();

    // Filtrar por tipo se especificado (com normalização)
    if (type) {
      const normalizedRequestType = normalizeType(type);
      categories = categories.filter(cat =>
        normalizeType(cat.type) === normalizedRequestType ||
        cat.category_type === type
      );
    }

    return NextResponse.json(categories);

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get categories', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/category-tree - Criar nova categoria
export async function POST(request) {
  try {
    const categoryData = await request.json();

    // Normalizar type antes de salvar
    if (categoryData.type) {
      categoryData.type = normalizeType(categoryData.type);
    }

    const newCategory = await CategoryTree.create(categoryData);

    return NextResponse.json(newCategory, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create category', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/category-tree?id=... - Atualizar categoria
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const categoryData = await request.json();

    // Normalizar type antes de atualizar
    if (categoryData.type) {
      categoryData.type = normalizeType(categoryData.type);
    }

    const updatedCategory = await CategoryTree.update(id, categoryData);

    return NextResponse.json(updatedCategory);

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update category', details: error.message },
      { status: 500 }
    );
  }
}