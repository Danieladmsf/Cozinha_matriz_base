import { useState, useMemo, useEffect } from "react";

export function useIngredientFilters(ingredients = []) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar filtros do localStorage no mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSearch = localStorage.getItem('ing_filter_search');
      const savedCategory = localStorage.getItem('ing_filter_category');
      const savedSupplier = localStorage.getItem('ing_filter_supplier');

      if (savedSearch) setSearchTerm(savedSearch);
      if (savedCategory) setCategoryFilter(savedCategory);
      if (savedSupplier) setSupplierFilter(savedSupplier);
      
      setIsLoaded(true);
    }
  }, []);

  // Salvar filtros no localStorage sempre que mudarem
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('ing_filter_search', searchTerm);
      localStorage.setItem('ing_filter_category', categoryFilter);
      localStorage.setItem('ing_filter_supplier', supplierFilter);
    }
  }, [searchTerm, categoryFilter, supplierFilter, isLoaded]);

  // Filtros únicos baseados nos ingredientes
  const uniqueCategories = useMemo(() => {
    return [...new Set(ingredients.map(ing => ing.category).filter(Boolean))].sort();
  }, [ingredients]);

  const uniqueSuppliers = useMemo(() => {
    return [...new Set(ingredients.map(ing => ing.main_supplier).filter(Boolean))].sort();
  }, [ingredients]);

  // Ingredientes filtrados
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ingredient => {
      const matchesSearch = (ingredient.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (ingredient.displaySupplier?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (ingredient.displayBrand?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || ingredient.category === categoryFilter;
      const matchesSupplier = supplierFilter === "all" || ingredient.main_supplier === supplierFilter;

      return matchesSearch && matchesCategory && matchesSupplier;
    });
  }, [ingredients, searchTerm, categoryFilter, supplierFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setSupplierFilter("all");
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ing_filter_search');
      localStorage.removeItem('ing_filter_category');
      localStorage.removeItem('ing_filter_supplier');
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    supplierFilter,
    setSupplierFilter,
    uniqueCategories,
    uniqueSuppliers,
    filteredIngredients,
    resetFilters,
    hasActiveFilters: searchTerm || categoryFilter !== "all" || supplierFilter !== "all"
  };
}