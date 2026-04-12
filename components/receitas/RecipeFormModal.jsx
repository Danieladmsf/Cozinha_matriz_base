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
import { Save, ChefHat } from "lucide-react";

export default function RecipeFormModal({ isOpen, onClose, onSave, editingRecipe, fullCategoryTree = [], activeType = 'receitas', existingCodes = [] }) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: '',
    });

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

    // Filtrar categorias do tipo ativo (receitas)
    const availableCategories = fullCategoryTree
        .filter(c => c.type === activeType && c.level === 1 && c.active !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

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
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Sem Categoria</option>
                                {availableCategories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
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
