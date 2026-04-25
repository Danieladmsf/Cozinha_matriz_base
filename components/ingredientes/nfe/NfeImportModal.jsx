'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import NfeStep0Fornecedor from './NfeStep0Fornecedor';
import NfeStep1ReviewPrices from './NfeStep1ReviewPrices';
import NfeStep2MatchInsumos from './NfeStep2MatchInsumos';
import NfeStepSummary from './NfeStepSummary';

export default function NfeImportModal({ isOpen, onClose, onImported }) {
    const [step, setStep] = useState('upload');
    const [loadingParse, setLoadingParse] = useState(false);
    const [parseError, setParseError] = useState(null);
    const [cabecalho, setCabecalho] = useState(null);
    const [itens, setItens] = useState([]);
    const [jaImportada, setJaImportada] = useState(null);
    const [fornecedorExistente, setFornecedorExistente] = useState(null);
    const [fornecedorConfirmado, setFornecedorConfirmado] = useState(null);
    const [resumoFinal, setResumoFinal] = useState(null);

    const reset = useCallback(() => {
        setStep('upload');
        setLoadingParse(false);
        setParseError(null);
        setCabecalho(null);
        setItens([]);
        setJaImportada(null);
        setFornecedorExistente(null);
        setFornecedorConfirmado(null);
        setResumoFinal(null);
    }, []);

    const handleClose = () => {
        reset();
        onClose?.();
    };

    const handleFileSelected = async (file) => {
        setParseError(null);
        if (!file) return;
        if (!/\.xml$/i.test(file.name)) {
            setParseError('Arquivo precisa ser .xml');
            return;
        }
        setLoadingParse(true);
        try {
            const xml = await file.text();
            const res = await fetch('/api/nfe/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xml }),
            });
            const data = await res.json();
            if (!res.ok) {
                setParseError(data?.details || data?.error || 'Falha ao processar XML');
                return;
            }
            setCabecalho(data.cabecalho);
            setItens(data.itens);
            setJaImportada(data.jaImportada);
            setFornecedorExistente(data.fornecedorExistente || null);
            setFornecedorConfirmado(data.fornecedorExistente || null);
            setStep('step0');
        } catch (err) {
            setParseError(err.message || 'Erro inesperado ao ler arquivo');
        } finally {
            setLoadingParse(false);
        }
    };

    const handleStep0Continue = (fornecedor) => {
        setFornecedorConfirmado(fornecedor);
        setStep('step1');
    };

    const handleStep1Confirm = (itensAjustados) => {
        setItens(itensAjustados);
        setStep('step2');
    };

    const handleStep2Confirm = async (decisoes) => {
        try {
            const res = await fetch('/api/nfe/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cabecalho, itens, decisoes, fornecedorId: fornecedorConfirmado?.id || null }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast({ variant: 'destructive', title: 'Erro ao importar', description: data?.details || data?.error });
                return;
            }
            setResumoFinal(data);
            setStep('summary');
            onImported?.(data);
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erro ao importar', description: err.message });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(o) => { if (!o) handleClose(); }}>
            <DialogContent className="max-w-[95vw] xl:max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Importar NFe (XML)
                        {step !== 'upload' && cabecalho && (
                            <span className="text-sm font-normal text-gray-500">
                                — NFe {cabecalho.numero} • {cabecalho.emitente?.razaoSocial}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {step === 'upload' && (
                    <UploadStep
                        loading={loadingParse}
                        error={parseError}
                        onFile={handleFileSelected}
                    />
                )}

                {step === 'step0' && (
                    <NfeStep0Fornecedor
                        cabecalho={cabecalho}
                        fornecedorExistente={fornecedorExistente}
                        onCancel={handleClose}
                        onContinue={handleStep0Continue}
                    />
                )}

                {step === 'step1' && (
                    <NfeStep1ReviewPrices
                        cabecalho={cabecalho}
                        itens={itens}
                        jaImportada={jaImportada}
                        fornecedor={fornecedorConfirmado}
                        onCancel={handleClose}
                        onBack={() => setStep('step0')}
                        onConfirm={handleStep1Confirm}
                    />
                )}

                {step === 'step2' && (
                    <NfeStep2MatchInsumos
                        cabecalho={cabecalho}
                        itens={itens}
                        fornecedor={fornecedorConfirmado}
                        onBack={() => setStep('step1')}
                        onConfirm={handleStep2Confirm}
                    />
                )}

                {step === 'summary' && resumoFinal && (
                    <NfeStepSummary resumo={resumoFinal} onClose={handleClose} />
                )}
            </DialogContent>
        </Dialog>
    );
}

function UploadStep({ loading, error, onFile }) {
    const [dragOver, setDragOver] = useState(false);

    return (
        <div className="space-y-4 py-4">
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    onFile(e.dataTransfer.files?.[0]);
                }}
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
                <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                    Arraste o arquivo .xml da NFe aqui ou clique abaixo para selecionar
                </p>
                <input
                    type="file"
                    accept=".xml,text/xml,application/xml"
                    onChange={(e) => onFile(e.target.files?.[0])}
                    className="hidden"
                    id="nfe-xml-input"
                    disabled={loading}
                />
                <label htmlFor="nfe-xml-input">
                    <Button asChild disabled={loading}>
                        <span>{loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</>) : 'Selecionar XML'}</span>
                    </Button>
                </label>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
