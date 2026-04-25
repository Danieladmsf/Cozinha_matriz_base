'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, Plus, RefreshCw, X } from 'lucide-react';

export default function NfeStepSummary({ resumo, onClose }) {
    const r = resumo?.resumo || { criados: 0, atualizados: 0, ignorados: 0 };
    return (
        <div className="space-y-4 py-2">
            <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Importação concluída</h3>
                <p className="text-sm text-gray-600">NFe registrada e histórico atualizado.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 border border-green-200 rounded p-3">
                    <Plus className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold">{r.criados}</div>
                    <div className="text-xs text-gray-600">Insumos criados</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <RefreshCw className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold">{r.atualizados}</div>
                    <div className="text-xs text-gray-600">Atualizados</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <X className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold">{r.ignorados}</div>
                    <div className="text-xs text-gray-600">Ignorados</div>
                </div>
            </div>

            {resumo?.detalhes?.length > 0 && (
                <div className="border rounded">
                    <div className="bg-gray-50 px-3 py-1.5 text-xs font-medium border-b">Detalhes</div>
                    <div className="max-h-60 overflow-y-auto divide-y text-sm">
                        {resumo.detalhes.map((d, i) => (
                            <div key={i} className="px-3 py-2 flex justify-between">
                                <span className="truncate flex-1">{d.descricao}</span>
                                <span className={`text-xs ml-2 ${d.acao === 'criado' ? 'text-green-700' : d.acao === 'atualizado' ? 'text-blue-700' : 'text-gray-500'}`}>
                                    {d.acao}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-2 border-t">
                <Button onClick={onClose}>Fechar</Button>
            </div>
        </div>
    );
}
