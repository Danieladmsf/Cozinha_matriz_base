'use client';

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Info } from "lucide-react";
import { NutritionFood } from "@/app/api/entities";
import { toast } from "@/components/ui/use-toast";

export default function AddIndustrialFoodModal({ onFoodAdded }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado inicial do formulário
  const [formData, setFormData] = useState({
    name: "",
    category: "Industrializados",
    referenceAmount: "100", // Porção no rótulo (ex: 12g, 20g ou 100g)
    energy_kcal: "",
    carbohydrate_g: "",
    protein_g: "",
    total_fat_g: "",
    saturated_fat_g: "",
    fiber_g: "",
    sodium_mg: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "Erro", description: "O nome do produto é obrigatório.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      
      const parseValue = (val) => {
        if (!val) return 0;
        // Substitui vírgula por ponto para o parseFloat entender decimais BR
        const normalized = val.toString().replace(",", ".");
        return parseFloat(normalized) || 0;
      };

      const ref = parseValue(formData.referenceAmount) || 100;
      const factor = 100 / ref;

      // Conversão para base 100g
      const finalData = {
        name: formData.name,
        description: formData.name,
        category_name: formData.category,
        energy_kcal: parseValue(formData.energy_kcal) * factor,
        carbohydrate_g: parseValue(formData.carbohydrate_g) * factor,
        protein_g: parseValue(formData.protein_g) * factor,
        lipid_g: parseValue(formData.total_fat_g) * factor,
        saturated_g: parseValue(formData.saturated_fat_g) * factor,
        fiber_g: parseValue(formData.fiber_g) * factor,
        sodium_mg: parseValue(formData.sodium_mg) * factor,
        source: "Manual (Industrializado)",
        active: true,
        created_at: new Date()
      };

      await NutritionFood.create(finalData);
      
      toast({ title: "Sucesso!", description: "Produto cadastrado com sucesso." });
      setOpen(false);
      
      // Limpar form
      setFormData({
        name: "",
        category: "Industrializados",
        referenceAmount: "100",
        energy_kcal: "",
        carbohydrate_g: "",
        protein_g: "",
        total_fat_g: "",
        saturated_fat_g: "",
        fiber_g: "",
        sodium_mg: "",
      });

      if (onFoodAdded) onFoodAdded();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Novo Alimento (Manual)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Plus className="text-orange-500" />
            Cadastrar Novo Alimento
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto (Ex: Ketchup Heinz)</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                placeholder="Digite o nome..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData(p => ({...p, category: v}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Industrializados">Industrializados</SelectItem>
                  <SelectItem value="Molhos e Condimentos">Molhos e Condimentos</SelectItem>
                  <SelectItem value="Laticínios">Laticínios</SelectItem>
                  <SelectItem value="Congelados">Congelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3 border border-blue-100 italic text-sm text-blue-700">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p>
              Preencha os valores conforme a Informação Nutricional do item. 
              O sistema fará a conversão automática para a base de 100g.
            </p>
          </div>

          {/* Tabela de Entrada (Estilo Rótulo) */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-100 p-3 border-b border-gray-200 grid grid-cols-2 items-center">
              <span className="font-bold text-sm uppercase">Informação Nutricional</span>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs font-semibold">PORÇÃO:</span>
                <Input 
                  name="referenceAmount" 
                  value={formData.referenceAmount} 
                  onChange={handleChange}
                  className="w-16 h-8 text-center font-bold bg-white"
                />
                <span className="text-xs font-bold">g</span>
              </div>
            </div>

            <div className="p-0 bg-white">
              {/* Grid de Nutrientes */}
              {[
                { label: "Valor Energético", unit: "kcal", name: "energy_kcal" },
                { label: "Carboidratos", unit: "g", name: "carbohydrate_g" },
                { label: "Proteínas", unit: "g", name: "protein_g" },
                { label: "Gorduras Totais", unit: "g", name: "total_fat_g" },
                { label: "Gorduras Saturadas", unit: "g", name: "saturated_fat_g" },
                { label: "Fibras Alimentares", unit: "g", name: "fiber_g" },
                { label: "Sódio", unit: "mg", name: "sodium_mg" },
              ].map((nut, i) => (
                <div key={nut.name} className={`grid grid-cols-2 p-3 gap-4 border-b border-gray-100 items-center ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <span className="text-sm font-medium">{nut.label} <span className="text-gray-400 font-normal">({nut.unit})</span></span>
                  <div className="flex justify-end">
                    <Input 
                      type="number"
                      step="any"
                      name={nut.name}
                      value={formData[nut.name]}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-24 h-9 text-right"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            className="bg-orange-600 hover:bg-orange-700 text-white" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar no Banco TACO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
