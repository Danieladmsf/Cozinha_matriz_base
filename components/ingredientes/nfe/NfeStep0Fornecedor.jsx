'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Check, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatCnpj, formatPhone } from '@/lib/formatUtils';

export default function NfeStep0Fornecedor({ cabecalho, fornecedorExistente, onCancel, onContinue }) {
    const emit = cabecalho?.emitente || {};
    const jaCadastrado = !!fornecedorExistente;

    const [form, setForm] = useState({
        company_name: emit.razaoSocial || '',
        cnpj: formatCnpj(emit.cnpj || ''),
        vendor_name: '',
        vendor_phone: '',
        email: '',
        address: [emit.municipio, emit.uf].filter(Boolean).join(' / '),
    });
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState(null);

    if (jaCadastrado) {
        return (
            <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                        <strong>Fornecedor já cadastrado:</strong> {fornecedorExistente.company_name}
                        {fornecedorExistente.supplier_code && ` (${fornecedorExistente.supplier_code})`}
                        <br />
                        <span className="text-xs text-gray-600">CNPJ {formatCnpj(fornecedorExistente.cnpj)}</span>
                    </AlertDescription>
                </Alert>

                <div className="bg-gray-50 rounded p-3 text-sm">
                    <div className="font-medium">{emit.razaoSocial}</div>
                    <div className="text-gray-600">{emit.municipio} / {emit.uf} • IE {emit.ie || '—'}</div>
                </div>

                <div className="flex justify-between pt-2 border-t">
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={() => onContinue(fornecedorExistente)}>
                        Avançar — Revisar preços <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        );
    }

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSalvarECCriar = async () => {
        setErro(null);
        if (!form.company_name.trim() || !form.cnpj.trim()) {
            setErro('Razão social e CNPJ são obrigatórios.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/nfe/supplier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setErro(data?.details || data?.error || 'Erro ao salvar fornecedor');
                return;
            }
            toast({ title: 'Fornecedor cadastrado', description: data.company_name });
            onContinue(data);
        } catch (err) {
            setErro(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                    <strong>Fornecedor novo.</strong> Não temos esse CNPJ cadastrado. Os dados ao lado vieram do XML.
                    Complete <strong>vendedor</strong> e <strong>WhatsApp</strong> (não vêm na NFe) e salve.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Building2 className="h-4 w-4" /> Vindo do XML (revise se necessário)
                    </h4>
                    <Field label="Razão social *">
                        <Input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
                    </Field>
                    <Field label="CNPJ *">
                        <Input
                            value={form.cnpj}
                            onChange={(e) => set('cnpj', formatCnpj(e.target.value))}
                            placeholder="00.000.000/0000-00"
                            inputMode="numeric"
                            maxLength={18}
                        />
                    </Field>
                    <Field label="Endereço (município/UF)">
                        <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
                    </Field>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Você completa</h4>
                    <Field label="Nome do vendedor">
                        <Input value={form.vendor_name} onChange={(e) => set('vendor_name', e.target.value)} placeholder="Ex: João da Silva" />
                    </Field>
                    <Field label="WhatsApp do vendedor">
                        <Input
                            value={form.vendor_phone}
                            onChange={(e) => set('vendor_phone', formatPhone(e.target.value))}
                            placeholder="(11) 99999-9999"
                            inputMode="numeric"
                            maxLength={15}
                        />
                    </Field>
                    <Field label="E-mail">
                        <Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contato@fornecedor.com.br" />
                    </Field>
                </div>
            </div>

            {erro && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{erro}</AlertDescription>
                </Alert>
            )}

            <div className="flex justify-between pt-2 border-t">
                <Button variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
                <Button onClick={handleSalvarECCriar} disabled={saving}>
                    {saving
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                        : <>Salvar fornecedor e avançar <ChevronRight className="h-4 w-4 ml-1" /></>}
                </Button>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block space-y-1">
            <span className="text-xs text-gray-600">{label}</span>
            {children}
        </label>
    );
}
