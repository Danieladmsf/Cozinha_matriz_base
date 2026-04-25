'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DecimalInput } from '@/components/ui/decimal-input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';

const UNIDADES_CANONICAS = ['kg', 'L', 'un'];

function round(n, casas) {
    const f = Math.pow(10, casas);
    return Math.round((Number(n) || 0) * f) / f;
}

function confidenceBadge(conf) {
    const map = {
        alta: { label: 'Direto da NFe', cls: 'bg-green-100 text-green-800 border-green-300' },
        media: { label: 'Calculado', cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        baixa: { label: 'Verifique', cls: 'bg-red-100 text-red-800 border-red-300' },
    };
    const c = map[conf] || map.media;
    return <Badge variant="outline" className={c.cls}>{c.label}</Badge>;
}

export default function NfeStep1ReviewPrices({ cabecalho, itens, jaImportada, fornecedor, onCancel, onBack, onConfirm }) {
    const [edits, setEdits] = useState(() => {
        const init = {};
        itens.forEach((it) => {
            init[it.indice] = {
                precoCanonico: round(it.calculoPreco?.precoCanonico ?? 0, 2),
                unidadeCanonica: it.calculoPreco?.unidadeCanonica ?? 'un',
                quantidadePorUnidadeComercial: round(it.calculoPreco?.quantidadePorUnidadeComercial ?? 1, 3),
            };
        });
        return init;
    });

    const updated = useMemo(() => itens.map((it) => {
        const e = edits[it.indice];
        const ajustado = e && e.precoCanonico !== it.calculoPreco?.precoCanonico ? e.precoCanonico : null;
        return {
            ...it,
            calculoPreco: {
                ...it.calculoPreco,
                precoCanonico: e?.precoCanonico ?? it.calculoPreco?.precoCanonico,
                unidadeCanonica: e?.unidadeCanonica ?? it.calculoPreco?.unidadeCanonica,
                quantidadePorUnidadeComercial: e?.quantidadePorUnidadeComercial ?? it.calculoPreco?.quantidadePorUnidadeComercial,
            },
            precoCanonicoAjustado: ajustado,
        };
    }), [itens, edits]);

    const handleChange = (indice, field, value) => {
        setEdits((prev) => {
            let v = value;
            if (field !== 'unidadeCanonica') {
                const n = Number(value);
                v = Number.isFinite(n) ? n : 0;
            }
            return { ...prev, [indice]: { ...prev[indice], [field]: v } };
        });
    };

    const verificarPendentes = updated.filter((it) => it.calculoPreco?.confiabilidade === 'baixa').length;

    return (
        <div className="space-y-4">
            {jaImportada && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Esta NFe já foi importada em {new Date(jaImportada.importadoEm).toLocaleString('pt-BR')}.
                        Continuar criará uma duplicata.
                    </AlertDescription>
                </Alert>
            )}

            <div className="bg-gray-50 rounded p-3 text-sm">
                <div className="font-medium">{cabecalho.emitente.razaoSocial}</div>
                <div className="text-gray-600">CNPJ {cabecalho.emitente.cnpj} • NFe {cabecalho.numero} • {cabecalho.dataEmissao?.split('T')[0]}</div>
                <div className="text-gray-600">Total: {formatCurrency(cabecalho.totais.valorNota)}</div>
                {fornecedor && (
                    <div className="text-gray-600 text-xs mt-1">
                        Fornecedor: <strong>{fornecedor.company_name}</strong>
                        {fornecedor.supplier_code ? ` (${fornecedor.supplier_code})` : ''}
                    </div>
                )}
            </div>

            <div className="border-l-4 border-blue-400 bg-blue-50 p-3 text-sm flex gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                    <strong>Etapa 2 de 3:</strong> Confira o preço por unidade canônica (R$/kg, R$/L ou R$/un).
                    Itens marcados <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 mx-1">Calculado</Badge>
                    foram extraídos da descrição — ajuste se estiver errado.
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="p-2 border whitespace-nowrap">#</th>
                            <th className="p-2 border">Descrição NFe</th>
                            <th className="p-2 border text-right whitespace-nowrap">uCom × qtd</th>
                            <th className="p-2 border text-right whitespace-nowrap">R$ unit (NFe)</th>
                            <th className="p-2 border text-right whitespace-nowrap">→ R$ canônico</th>
                            <th className="p-2 border text-center whitespace-nowrap">Unid.</th>
                            <th className="p-2 border text-right whitespace-nowrap">Qtd / uCom</th>
                            <th className="p-2 border text-center whitespace-nowrap">Origem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {updated.map((it) => {
                            const e = edits[it.indice];
                            return (
                                <tr key={it.indice} className="border-b">
                                    <td className="p-2 border text-center">{it.indice}</td>
                                    <td className="p-2 border">
                                        <div className="font-medium">{it.descricao}</div>
                                        {it.calculoPreco?.observacao && (
                                            <div className="text-xs text-gray-500 mt-1">{it.calculoPreco.observacao}</div>
                                        )}
                                    </td>
                                    <td className="p-2 border whitespace-nowrap">
                                        {it.unidadeComercial} × {it.quantidade}
                                    </td>
                                    <td className="p-2 border whitespace-nowrap">
                                        {formatCurrency(it.valorUnitario)}
                                    </td>
                                    <td className="p-2 border">
                                        <div className="flex items-center gap-1 justify-end">
                                            <span className="text-xs text-gray-500">R$</span>
                                            <DecimalInput
                                                value={e.precoCanonico}
                                                onChange={(ev) => handleChange(it.indice, 'precoCanonico', ev.target.value)}
                                                className="h-8 w-24 text-right tabular-nums"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-2 border">
                                        <select
                                            className="border rounded px-2 py-1 text-sm bg-white"
                                            value={e.unidadeCanonica}
                                            onChange={(ev) => handleChange(it.indice, 'unidadeCanonica', ev.target.value)}
                                        >
                                            {UNIDADES_CANONICAS.map((u) => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2 border">
                                        <div className="flex items-center gap-1 justify-end">
                                            <DecimalInput
                                                value={e.quantidadePorUnidadeComercial}
                                                onChange={(ev) => handleChange(it.indice, 'quantidadePorUnidadeComercial', ev.target.value)}
                                                className="h-8 w-20 text-right tabular-nums"
                                            />
                                            <span className="text-xs text-gray-500 w-6">{e.unidadeCanonica}</span>
                                        </div>
                                    </td>
                                    <td className="p-2 border">{confidenceBadge(it.calculoPreco?.confiabilidade)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {verificarPendentes > 0 && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {verificarPendentes} item(ns) com cálculo incerto. Reveja antes de prosseguir.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex justify-between pt-2 border-t">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    {onBack && (
                        <Button variant="ghost" onClick={onBack}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                        </Button>
                    )}
                </div>
                <Button onClick={() => onConfirm(updated)}>
                    Avançar — Vincular insumos <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}
