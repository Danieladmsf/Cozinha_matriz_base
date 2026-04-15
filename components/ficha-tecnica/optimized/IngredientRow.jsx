import React, { useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Edit, Trash2, StickyNote } from "lucide-react";
import { formatCurrency } from '@/lib/formatUtils';
import { formatCapitalize } from '@/lib/textUtils';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const IngredientRow = ({
  ingredient,
  prepIndex,
  ingredientIndex,
  prep,
  onUpdateIngredient,
  onRemoveIngredient,
  readOnly = false,
  onOpenIngredientModal,
}) => {
  const processes = prep.processes || [];
  const hasProcess = (processName) => processes.includes(processName);


  const parseNumericValue = (value) => {
    if (!value) return 0;
    const cleaned = String(value).replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatDisplayValue = (value) => {
    if (!value && value !== 0) return '';
    const num = parseNumericValue(value);
    if (num === 0 && String(value).trim() === '') return '';

    // Se o número tem mais de 3 casas decimais, trunca visualmente para 3 casas
    const strVal = String(value).replace(',', '.');
    if (strVal.includes('.') && strVal.split('.')[1].length > 3) {
      return num.toFixed(3).replace('.', ',');
    }
    return String(value); // Mantém como o usuário digitou se for válido e curto
  };

  const handleBlurFormat = (field, value) => {
    if (!value && value !== 0) return;
    const num = parseNumericValue(value);
    if (isNaN(num) || num === 0 && String(value).trim() === '') return;

    // Formata sempre para 3 casas decimais (ex: 1 -> 1,000)
    const formatted = num.toFixed(3).replace('.', ',');

    if (String(value) !== formatted) {
      updateIngredientField(field, formatted);
    }

    // Preenchimento FRONTAL (Frente para trás - "Tab cascade")
    // SÍNCRONO: para garantir que o React execute junto e o input receba foco já preenchido.
    const fieldOrder = [
      'weight_frozen',
      'weight_thawed',
      'weight_raw',
      'weight_clean',
      'weight_pre_cooking',
      'weight_cooked',
      'weight_portioned'
    ];
    
    const currentFieldIndex = fieldOrder.indexOf(field);
    if (currentFieldIndex >= 0) {
      for (let i = currentFieldIndex + 1; i < fieldOrder.length; i++) {
        const nextField = fieldOrder[i];
        const nextValue = ingredient[nextField];

        let isActiveProcess = false;
        if (nextField === 'weight_thawed' && hasProcess('defrosting')) isActiveProcess = true;
        if (nextField === 'weight_raw') isActiveProcess = true;
        if (nextField === 'weight_clean' && hasProcess('cleaning')) isActiveProcess = true;
        if (nextField === 'weight_pre_cooking' && hasProcess('cooking')) isActiveProcess = true;
        if (nextField === 'weight_cooked' && hasProcess('cooking')) isActiveProcess = true;
        if (nextField === 'weight_portioned' && hasProcess('portioning')) isActiveProcess = true;

        if (isActiveProcess) {
          if (!nextValue || nextValue === '' || parseNumericValue(nextValue) === 0) {
            onUpdateIngredient(prepIndex, ingredientIndex, nextField, formatted);
          }
          break; // O Tab preenche apenas 1 passo adiante.
        }
      }
    }
  };



  const calculatedValues = useMemo(() => {
    const calculateLoss = (initial, final) => {
      const initialNum = parseNumericValue(initial);
      const finalNum = parseNumericValue(final);
      if (initialNum === 0) return 0;
      return ((initialNum - finalNum) / initialNum) * 100;
    };

    const calculateYield = () => {
      let initialWeight = 0;
      let finalWeight = 0;

      // Determinar peso inicial - pegar o primeiro campo preenchido na ordem dos processos
      if (hasProcess('defrosting') && parseNumericValue(ingredient.weight_frozen) > 0) {
        initialWeight = parseNumericValue(ingredient.weight_frozen);
      } else if ((hasProcess('cleaning') || hasProcess('defrosting')) && parseNumericValue(ingredient.weight_raw) > 0) {
        initialWeight = parseNumericValue(ingredient.weight_raw);
      } else if (hasProcess('cooking')) {
        // Se só tem cocção, usar weight_pre_cooking ou weight_raw
        initialWeight = parseNumericValue(ingredient.weight_pre_cooking) ||
          parseNumericValue(ingredient.weight_raw);
      } else if (hasProcess('portioning') || hasProcess('packaging')) {
        initialWeight = parseNumericValue(ingredient.weight_raw) || parseNumericValue(ingredient.quantity);
      }

      // Determinar peso final - SEMPRE o último processo da cadeia
      if (hasProcess('portioning') && parseNumericValue(ingredient.weight_portioned) > 0) {
        finalWeight = parseNumericValue(ingredient.weight_portioned);
      } else if (hasProcess('packaging')) {
        // Para embalagem, o peso final é igual ao inicial (perda zero)
        finalWeight = parseNumericValue(ingredient.weight_raw) || parseNumericValue(ingredient.quantity);
      } else if (hasProcess('cooking') && parseNumericValue(ingredient.weight_cooked) > 0) {
        finalWeight = parseNumericValue(ingredient.weight_cooked);
      } else if (hasProcess('cleaning') && parseNumericValue(ingredient.weight_clean) > 0) {
        finalWeight = parseNumericValue(ingredient.weight_clean);
      } else if (hasProcess('defrosting') && parseNumericValue(ingredient.weight_thawed) > 0) {
        finalWeight = parseNumericValue(ingredient.weight_thawed);
      }

      if (initialWeight === 0) return 0;

      return (finalWeight / initialWeight) * 100;
    };

    const defrostingLoss = calculateLoss(ingredient.weight_frozen, ingredient.weight_thawed);

    let cleaningInitialWeight = 0;
    if (hasProcess('defrosting') && parseNumericValue(ingredient.weight_thawed) > 0) {
      cleaningInitialWeight = parseNumericValue(ingredient.weight_thawed);
    } else {
      cleaningInitialWeight = parseNumericValue(ingredient.weight_raw);
    }
    const cleaningLoss = calculateLoss(cleaningInitialWeight, parseNumericValue(ingredient.weight_clean));

    let cookingInitialWeight = parseNumericValue(ingredient.weight_pre_cooking);
    if (cookingInitialWeight === 0) {
      cookingInitialWeight = parseNumericValue(ingredient.weight_clean) ||
        parseNumericValue(ingredient.weight_thawed) ||
        parseNumericValue(ingredient.weight_raw);
    }
    const cookingLoss = calculateLoss(cookingInitialWeight, parseNumericValue(ingredient.weight_cooked));

    const portioningLoss = calculateLoss(
      ingredient.weight_raw || ingredient.weight_cooked || ingredient.weight_clean,
      ingredient.weight_portioned
    );

    const yieldPercentage = calculateYield();

    // Identificar qual campo é o "Ativo" (último preenchido > 0)
    const getActiveField = () => {
      if (parseNumericValue(ingredient.weight_portioned) > 0) return 'weight_portioned';
      if (parseNumericValue(ingredient.weight_cooked) > 0) return 'weight_cooked';
      if (parseNumericValue(ingredient.weight_pre_cooking) > 0) return 'weight_pre_cooking';
      if (parseNumericValue(ingredient.weight_clean) > 0) return 'weight_clean';
      if (parseNumericValue(ingredient.weight_raw) > 0) return 'weight_raw';
      if (parseNumericValue(ingredient.weight_thawed) > 0) return 'weight_thawed';
      if (parseNumericValue(ingredient.weight_frozen) > 0) return 'weight_frozen';
      return null;
    };

    const activeField = getActiveField();

    return {
      defrostingLoss,
      cleaningLoss,
      cookingLoss,
      portioningLoss,
      yieldPercentage,
      activeField
    };
  }, [ingredient, prep.processes]);

  // Helper para cores do input ativo
  const getActiveStyles = (field) => {
    if (calculatedValues.activeField !== field) return "border-gray-200";

    const styles = {
      weight_frozen: "border-cyan-500 ring-1 ring-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.2)]",
      weight_thawed: "border-cyan-500 ring-1 ring-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.2)]",
      weight_raw: "border-emerald-500 ring-1 ring-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.2)]",
      weight_clean: "border-emerald-500 ring-1 ring-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.2)]",
      weight_pre_cooking: "border-amber-500 ring-1 ring-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.2)]",
      weight_cooked: "border-amber-500 ring-1 ring-amber-200 shadow-[0_0_8_rgba(245,158,11,0.2)]",
      weight_portioned: "border-purple-500 ring-1 ring-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
    };

    return `border-2 ${styles[field] || "border-blue-500"}`;
  };

  const updateIngredientField = (field, value) => {
    let cleanValue = String(value);

    // Evita o efeito "01" ao digitar se o campo tinha 0 oculto ou estava vazio
    if (/^0+[1-9]/.test(cleanValue)) {
      cleanValue = cleanValue.replace(/^0+/, '');
    } else if (/^0+0[,\.]/.test(cleanValue)) {
      cleanValue = cleanValue.replace(/^0+(?=0[,\.])/, '');
    }

    // Atualizar o campo principal primeiro
    onUpdateIngredient(prepIndex, ingredientIndex, field, cleanValue);
  };

  if (ingredient.is_note_row) {
    return (
      <TableRow className="border-b border-gray-100 bg-yellow-50/50 hover:bg-yellow-50">
        <TableCell colSpan={100} className="px-6 py-3 text-sm text-yellow-800 italic">
          <div className="flex items-start gap-2">
            <StickyNote className="h-4 w-4 mt-0.5 opacity-60 flex-shrink-0" />
            <div 
              className="whitespace-pre-wrap prose prose-sm max-w-none text-yellow-800 [&_p]:m-0 italic"
              dangerouslySetInnerHTML={{ __html: ingredient.name }}
            />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="border-b border-gray-50 hover:bg-gray-50/50">
      <TableCell className="font-medium px-4 py-2 font-mono">
        <div className="flex flex-col">
          <span>{formatCapitalize(ingredient.name)}</span>
          
          {/* Seletor de Variações TACO */}
          {ingredient.taco_variations && ingredient.taco_variations.length > 0 && (
            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
              {ingredient.taco_variations.length > 1 ? (
                <Select
                  value={ingredient.chosen_taco_id || ingredient.taco_variations.find(v => v.is_base)?.taco_id || ingredient.taco_id}
                  onValueChange={(val) => {
                    const variation = ingredient.taco_variations.find(v => v.taco_id === val);
                    onUpdateIngredient(prepIndex, ingredientIndex, 'chosen_taco_id', val);
                    if (variation) {
                      onUpdateIngredient(prepIndex, ingredientIndex, 'chosen_variation_name', variation.variation_name);
                    }
                  }}
                  disabled={readOnly || ingredient.locked}
                >
                  <SelectTrigger className="h-6 text-[10px] w-auto min-w-[100px] border-blue-100 bg-blue-50/50 text-blue-700 py-0 px-2 hover:bg-blue-100 transition-colors">
                    <SelectValue placeholder="Escolha a variação" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredient.taco_variations.map((variant) => (
                      <SelectItem 
                        key={variant.taco_id} 
                        value={variant.taco_id}
                        className="text-xs"
                      >
                        {variant.variation_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="h-5 text-[9px] font-normal border-gray-100 bg-gray-50 text-gray-500 py-0 px-1.5 flex-shrink-0 w-fit">
                  Nutrição: {ingredient.taco_variations[0].variation_name}
                </Badge>
              )}
            </div>
          )}

          {ingredient.usage_note && (
            <span className="text-xs text-amber-600 italic mt-0.5 flex items-center gap-1">
              <StickyNote className="h-3 w-3" />
              {ingredient.usage_note}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="text-center px-4 py-2">
        {formatCurrency(parseNumericValue(ingredient.current_price))}
      </TableCell>

      <TableCell className="text-center px-4 py-2">
        {(() => {
          const brutPrice = parseNumericValue(ingredient.current_price);
          if (hasProcess('packaging')) {
            // Para embalagem: custo = preço unitário (cada item é 1 unidade)
            return formatCurrency(brutPrice);
          }
          const yieldPercent = calculatedValues.yieldPercentage;
          const liquidPrice = yieldPercent > 0 ? brutPrice / (yieldPercent / 100) : brutPrice;
          return formatCurrency(liquidPrice);
        })()}
      </TableCell>

      {hasProcess('defrosting') && (
        <>
          <TableCell className="px-4 py-2">
            <Input
              type="text"
              value={formatDisplayValue(ingredient.weight_frozen)}
              onChange={(e) => updateIngredientField('weight_frozen', e.target.value)}
              onBlur={(e) => handleBlurFormat('weight_frozen', e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={readOnly || ingredient.locked}
              className={`w-24 h-8 text-center text-xs ${readOnly || ingredient.locked ? 'bg-gray-100 cursor-not-allowed' : getActiveStyles('weight_frozen')}`}
              placeholder="0,000"
            />
          </TableCell>
          <TableCell className="px-4 py-2">
            <Input
              type="text"
              value={formatDisplayValue(ingredient.weight_thawed)}
              onChange={(e) => updateIngredientField('weight_thawed', e.target.value)}
              onBlur={(e) => handleBlurFormat('weight_thawed', e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={readOnly || ingredient.locked}
              className={`w-24 h-8 text-center text-xs ${readOnly || ingredient.locked ? 'bg-gray-100 cursor-not-allowed' : getActiveStyles('weight_thawed')}`}
              placeholder="0,000"
            />
          </TableCell>
          <TableCell className="text-center px-4 py-2">
            <Badge variant="secondary">
              {calculatedValues.defrostingLoss.toFixed(2)}%
            </Badge>
          </TableCell>
        </>
      )}

      {hasProcess('cleaning') && (
        <>
          {!hasProcess('defrosting') && (
            <TableCell className="px-4 py-2">
              <Input
                type="text"
                value={formatDisplayValue(ingredient.weight_raw)}
                onChange={(e) => updateIngredientField('weight_raw', e.target.value)}
                onBlur={(e) => handleBlurFormat('weight_raw', e.target.value)}
                onFocus={(e) => e.target.select()}
                disabled={readOnly || ingredient.locked}
                className={`w-24 h-8 text-center text-xs ${readOnly || ingredient.locked ? 'bg-gray-100 cursor-not-allowed' : getActiveStyles('weight_raw')}`}
                placeholder={(() => {
                  // If purely cleaning (no defrost), raw is the start, so 0,000 is fine?
                  // actually if it's the start, 0,000 is correct.
                  return "0,000";
                })()}
              />
            </TableCell>
          )}
          {hasProcess('defrosting') && (
            <TableCell className="px-4 py-2">
              {parseNumericValue(ingredient.weight_frozen) > 0 || parseNumericValue(ingredient.weight_thawed) > 0 ? (
                <Input
                  type="text"
                  value={formatDisplayValue(ingredient.weight_thawed)}
                  readOnly
                  className="w-24 h-8 text-center text-xs bg-gray-50 cursor-not-allowed"
                  placeholder="0,000"
                  title="Valor vem do processo de descongelamento"
                />
              ) : (
                <Input
                  type="text"
                  value={formatDisplayValue(ingredient.weight_raw)}
                  onChange={(e) => updateIngredientField('weight_raw', e.target.value)}
                  onBlur={(e) => handleBlurFormat('weight_raw', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  disabled={readOnly || ingredient.locked}
                  className={`w-24 h-8 text-center text-xs ${readOnly || ingredient.locked ? 'bg-gray-100 cursor-not-allowed' : getActiveStyles('weight_raw')}`}
                  placeholder="0,000"
                  title="Peso de entrada limpo (Fresco)"
                />
              )}
            </TableCell>
          )}
          <TableCell className="px-4 py-2">
            <Input
              type="text"
              value={formatDisplayValue(ingredient.weight_clean)}
              onChange={(e) => updateIngredientField('weight_clean', e.target.value)}
              onBlur={(e) => handleBlurFormat('weight_clean', e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={readOnly || ingredient.locked}
              className={`w-24 h-8 text-center text-xs ${readOnly || ingredient.locked ? 'bg-gray-100 cursor-not-allowed' : getActiveStyles('weight_clean')}`}
              placeholder="0,000"
            />
          </TableCell>
          <TableCell className="text-center px-4 py-2">
            <Badge variant="secondary">
              {calculatedValues.cleaningLoss.toFixed(2)}%
            </Badge>
          </TableCell>
        </>
      )}

      {hasProcess('cooking') && (
        <>
          <TableCell className="px-4 py-2">
            <Input
              type="text"
              value={formatDisplayValue(ingredient.weight_pre_cooking)}
              onChange={(e) => updateIngredientField('weight_pre_cooking', e.target.value)}
              onBlur={(e) => handleBlurFormat('weight_pre_cooking', e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={readOnly || ingredient.locked}
              className={`w-24 h-8 text-center text-xs ${readOnly || ingredient.locked ? 'bg-gray-100 cursor-not-allowed' : getActiveStyles('weight_pre_cooking')}`}
              placeholder={(() => {
                // Inferred Previous Weight Logic for Placeholder
                const prev = parseNumericValue(ingredient.weight_clean) ||
                  parseNumericValue(ingredient.weight_thawed) ||
                  parseNumericValue(ingredient.weight_raw);
                return prev > 0 ? prev.toFixed(3) : "0,000";
              })()}
              title="Peso antes da cocção (Automático se vazio)"
            />
          </TableCell>
          <TableCell className="px-4 py-2">
            <Input
              type="text"
              value={formatDisplayValue(ingredient.weight_cooked)}
              onChange={(e) => updateIngredientField('weight_cooked', e.target.value)}
              onBlur={(e) => handleBlurFormat('weight_cooked', e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={readOnly || ingredient.locked}
              className={`w-24 h-8 text-center text-xs ${readOnly || ingredient.locked ? 'bg-gray-100 cursor-not-allowed' : getActiveStyles('weight_cooked')}`}
              placeholder="0,000"
              title="Peso depois da cocção"
            />
          </TableCell>
          <TableCell className="text-center px-4 py-2">
            <Badge variant="secondary">
              {calculatedValues.cookingLoss.toFixed(2)}%
            </Badge>
          </TableCell>
        </>
      )}

      {hasProcess('portioning') && (
        <>
          {!hasProcess('defrosting') && !hasProcess('cleaning') && !hasProcess('cooking') && (
            <TableCell className="px-4 py-2">
              <Input
                type="text"
                value={formatDisplayValue(ingredient.weight_raw)}
                onChange={(e) => updateIngredientField('weight_raw', e.target.value)}
                onBlur={(e) => handleBlurFormat('weight_raw', e.target.value)}
                onFocus={(e) => e.target.select()}
                disabled={readOnly || ingredient.locked}
                className={`w-24 h-8 text-center text-xs ${readOnly || ingredient.locked ? 'bg-gray-100 cursor-not-allowed' : getActiveStyles('weight_frozen')}`}
                placeholder="0,000"
              />
            </TableCell>
          )}
          <TableCell className="px-4 py-2">
            <Input
              type="text"
              value={formatDisplayValue(ingredient.weight_portioned)}
              onChange={(e) => updateIngredientField('weight_portioned', e.target.value)}
              onBlur={(e) => handleBlurFormat('weight_portioned', e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={readOnly || ingredient.locked}
              className={`w-24 h-8 text-center text-xs ${readOnly || ingredient.locked ? 'bg-gray-100 cursor-not-allowed' : getActiveStyles('weight_portioned')}`}
              placeholder="0,000"
            />
          </TableCell>
          <TableCell className="text-center px-4 py-2">
            <Badge variant="secondary">
              {calculatedValues.portioningLoss.toFixed(2)}%
            </Badge>
          </TableCell>
        </>
      )}

      <TableCell className="text-center px-4 py-2">
        {hasProcess('packaging') ? (
          <span className="text-gray-400 font-medium">-</span>
        ) : (
          <Badge variant="default">
            {calculatedValues.yieldPercentage.toFixed(1)}%
          </Badge>
        )}
      </TableCell>

      <TableCell className="px-4 py-2">
        <div className="flex gap-1 justify-end items-center">


          {!readOnly && (
            <>
              {!ingredient.locked && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-blue-50"
                  onClick={() => onOpenIngredientModal && onOpenIngredientModal(prepIndex, ingredientIndex)}
                  title="Editar ingrediente"
                >
                  <Edit className="h-3 w-3 text-blue-500" />
                </Button>
              )}
              {ingredient.locked && (
                <span className="text-xs text-amber-500 mr-2 flex items-center" title="Este item faz parte de uma receita importada e não pode ser editado.">
                  <span className="mr-1">🔒</span>
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveIngredient(
                  prepIndex,
                  ingredientIndex
                )}
                className="h-7 w-7 rounded-full hover:bg-red-50"
                title="Remover ingrediente"
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </>
          )}
          {readOnly && ingredient.locked && (
            <span className="text-xs text-gray-400 italic">Locked</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default React.memo(IngredientRow);
