'use client';

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, ChefHat, ChevronsUpDown, Check } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function RecipeFormModal({ isOpen, onClose, onSave, editingRecipe, fullCategoryTree = [], activeType = 'receitas', existingCodes = [] }) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: '',
    });
    const [categorySelectorOpen, setCategorySelectorOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingRecipe) {
                setFormData({
                    name: editingRecipe.name || '',
                    code: editingRecipe.code || '',
                    category: editingRecipe.category || '',
                });
            } else {
                setFormData({ name: '', code: '', category: '' });
            }
        }
    }, [isOpen, editingRecipe]);

    // Normalizar tipos para filtrar categorias corretas
    const normalizeType = (t) => {
        const raw = (t || '').toLowerCase().trim();
        const aliases = {
            'recipe': 'receitas', 'recipes': 'receitas', 'receita': 'receitas',
            'product': 'produtos', 'products': 'produtos', 'produto': 'produtos',
            'ingredient': 'ingredientes', 'ingredients': 'ingredientes', 'ingrediente': 'ingredientes',
        };
        return aliases[raw] || raw || 'receitas';
    };

    // Montar a árvore de categorias hierárquica
    const typeCats = fullCategoryTree.filter(cat => normalizeType(cat.type) === normalizeType(activeType) && cat.active !== false);

    const roots = typeCats
        .filter(c => c.level === 1)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const groupedCategories = roots.map(root => {
        const buildDescendants = (cats, parentId, prefix) => {
            let list = [];
            const children = cats
                .filter(c => c.parent_id === parentId)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            for (const child of children) {
                const label = `${prefix} > ${child.name}`;
                list.push({
                    value: child.id,
                    label: label,
                    originalName: child.name,
                    id: child.id
                });
                list = [...list, ...buildDescendants(cats, child.id, label)];
            }
            return list;
        };

        const descendants = buildDescendants(typeCats, root.id, root.name);

        const rootItem = {
            value: root.id,
            label: root.name,
            originalName: root.name,
            id: root.id,
            isRoot: true
        };

        return {
            groupName: root.name,
            items: [rootItem, ...descendants]
        };
    });

    const getSelectedLabel = () => {
        if (!formData.category) return "Sem Categoria";
        const found = groupedCategories.flatMap(g => g.items).find(c => c.originalName === formData.category);
        return found ? found.label : formData.category;
    };

    // Função para gerar código único de receita garantindo sequencial global
    const generateRecipeCode = (recipeName, allCodes = []) => {
        if (!recipeName) return '';

        const prefix = recipeName
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .slice(0, 3);

        let maxGlobalNumber = 0;
        allCodes.forEach(code => {
            const numMatch = code.match(/\d+/);
            if (numMatch) {
                const num = parseInt(numMatch[0], 10);
                if (num > maxGlobalNumber) {
                    maxGlobalNumber = num;
                }
            }
        });

        let counter = maxGlobalNumber + 1;
        let newCode = `${prefix}${String(counter).padStart(3, '0')}`;

        while (allCodes.includes(newCode)) {
            counter++;
            newCode = `${prefix}${String(counter).padStart(3, '0')}`;
        }

        return newCode;
    };

    const currentGeneratedCode = editingRecipe?.code || generateRecipeCode(formData.name, existingCodes);

    const handleSubmit = () => {
        if (!formData.name.trim()) return;
        onSave({
            ...formData,
            code: currentGeneratedCode
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl text-orange-900 border-b pb-2 flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-orange-600" />
                        {editingRecipe ? 'Editar Receita' : 'Nova Receita'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label>Nome da Receita</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Arroz à Grega, Strogonoff de Frango..."
                            className="border-gray-300"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Código</Label>
                            <Input
                                value={currentGeneratedCode}
                                readOnly
                                className="border-gray-300 font-mono bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Popover open={categorySelectorOpen} onOpenChange={setCategorySelectorOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={categorySelectorOpen}
                                        className="w-full justify-between font-normal border-gray-300"
                                    >
                                        <span className="truncate">{getSelectedLabel()}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar categoria..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="Sem Categoria"
                                                    onSelect={() => {
                                                        setFormData({ ...formData, category: '' });
                                                        setCategorySelectorOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            !formData.category ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    Sem Categoria
                                                </CommandItem>
                                            </CommandGroup>
                                            {groupedCategories.map((group) => (
                                                <CommandGroup key={group.groupName} heading={group.groupName}>
                                                    {group.items.map((category) => (
                                                        <CommandItem
                                                            key={category.value}
                                                            value={category.label}
                                                            onSelect={() => {
                                                                setFormData({ ...formData, category: category.originalName });
                                                                setCategorySelectorOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.category === category.originalName ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {category.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            ))}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                        <p className="text-sm text-orange-700">
                            💡 Após criar a receita, você será redirecionado para a <strong>Ficha Técnica</strong> onde poderá adicionar ingredientes, modo de preparo e calcular custos.
                        </p>
                    </div>
                </div>

                <DialogFooter className="mt-2 border-t pt-4">
                    <Button variant="ghost" onClick={onClose} className="text-gray-500">Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.name.trim()}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {editingRecipe ? 'Salvar Receita' : 'Criar e Abrir Ficha Técnica'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
