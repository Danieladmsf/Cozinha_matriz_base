'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, Save, Search, Plus, X, Link2, Loader2, Check, Sparkles, Tag } from 'lucide-react';
import { Ingredient } from '@/app/api/entities';
import { formatCurrency } from '@/lib/formatUtils';
import { toast } from '@/components/ui/use-toast';

const ACOES = {
    VINCULAR: 'vincular',
    CRIAR: 'criar',
    IGNORAR: 'ignorar',
};

export default function NfeStep2MatchInsumos({ cabecalho, itens, fornecedor, onBack, onConfirm }) {
    const [insumos, setInsumos] = useState([]);
    const [loadingInsumos, setLoadingInsumos] = useState(true);
    const [marcasIA, setMarcasIA] = useState({});
    const [novasMarcasNoCatalogo, setNovasMarcasNoCatalogo] = useState(new Set());
    const [marcasItemDecidida, setMarcasItemDecidida] = useState({});
    const [loadingIA, setLoadingIA] = useState(true);
    const [erroIA, setErroIA] = useState(null);
    const [criandoMarcas, setCriandoMarcas] = useState(false);
    const [decisoes, setDecisoes] = useState(() => {
        const d = {};
        itens.forEach((it) => {
            if (it.matchAutomatico) {
                d[it.indice] = { acao: ACOES.VINCULAR, insumoId: it.matchAutomatico.insumoId };
            } else if (it.matches?.length > 0) {
                d[it.indice] = { acao: ACOES.VINCULAR, insumoId: it.matches[0].insumoId };
            } else {
                d[it.indice] = { acao: ACOES.CRIAR, novo: defaultNovo(it, cabecalho) };
            }
        });
        return d;
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        Ingredient.list()
            .then((list) => { if (!cancelled) setInsumos(Array.isArray(list) ? list : []); })
            .finally(() => { if (!cancelled) setLoadingInsumos(false); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const payload = itens.map((it) => ({ indice: it.indice, descricao: it.descricao }));
        fetch('/api/nfe/detect-brands', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itens: payload }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (cancelled) return;
                if (!res.ok) {
                    console.warn('[detect-brands] falhou', data);
                    setErroIA(data?.details || data?.error || `HTTP ${res.status}`);
                    return;
                }
                const map = {};
                (data.extraidas || []).forEach((e) => { if (e.marca) map[e.indice] = e.marca; });
                setMarcasIA(map);
                const novasSet = new Set();
                (data.novasMarcas || []).forEach((m) => novasSet.add(m.nome.toLowerCase()));
                setNovasMarcasNoCatalogo(novasSet);
            })
            .catch((err) => {
                console.warn('[detect-brands] erro', err);
                if (!cancelled) setErroIA(err.message || 'Falha de rede ao chamar IA');
            })
            .finally(() => { if (!cancelled) setLoadingIA(false); });
        return () => { cancelled = true; };
    }, []);

    const aceitarMarcaItem = (indice, marca) => {
        setMarcasItemDecidida((prev) => ({ ...prev, [indice]: 'aceita' }));
        setDecisoes((prev) => {
            const d = prev[indice];
            if (!d) return prev;
            if (d.acao === ACOES.VINCULAR) {
                return { ...prev, [indice]: { ...d, aplicarMarca: marca } };
            }
            if (d.acao === ACOES.CRIAR) {
                return { ...prev, [indice]: { ...d, novo: { ...(d.novo || {}), brand: marca } } };
            }
            return prev;
        });
    };

    const ignorarMarcaItem = (indice, marca) => {
        setMarcasItemDecidida((prev) => ({ ...prev, [indice]: 'ignorada' }));
        setDecisoes((prev) => {
            const d = prev[indice];
            if (!d) return prev;
            if (d.acao === ACOES.VINCULAR && d.aplicarMarca === marca) {
                return { ...prev, [indice]: { ...d, aplicarMarca: '' } };
            }
            if (d.acao === ACOES.CRIAR && d.novo?.brand === marca) {
                return { ...prev, [indice]: { ...d, novo: { ...d.novo, brand: '' } } };
            }
            return prev;
        });
    };

    const marcasParaCriarNoCatalogo = useMemo(() => {
        const set = new Map();
        Object.entries(marcasItemDecidida).forEach(([indice, status]) => {
            if (status !== 'aceita') return;
            const marca = marcasIA[indice];
            if (!marca) return;
            if (!novasMarcasNoCatalogo.has(marca.toLowerCase())) return;
            set.set(marca.toLowerCase(), marca);
        });
        return Array.from(set.values());
    }, [marcasItemDecidida, marcasIA, novasMarcasNoCatalogo]);

    const handleCriarMarcas = async () => {
        if (marcasParaCriarNoCatalogo.length === 0) {
            toast({ variant: 'destructive', title: 'Nenhuma marca aceita' });
            return;
        }
        setCriandoMarcas(true);
        try {
            const res = await fetch('/api/nfe/brands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nomes: marcasParaCriarNoCatalogo }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast({ variant: 'destructive', title: 'Erro ao criar marcas', description: data?.details || data?.error });
                return;
            }
            toast({ title: `${data.criadas?.length || 0} marca(s) criada(s) no catálogo` });
            setNovasMarcasNoCatalogo((prev) => {
                const next = new Set(prev);
                marcasParaCriarNoCatalogo.forEach((n) => next.delete(n.toLowerCase()));
                return next;
            });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erro ao criar marcas', description: err.message });
        } finally {
            setCriandoMarcas(false);
        }
    };

    const insumosById = useMemo(() => {
        const map = new Map();
        insumos.forEach((i) => map.set(i.id, i));
        return map;
    }, [insumos]);

    const setAcao = (indice, acao, payload = {}) => {
        setDecisoes((prev) => ({ ...prev, [indice]: { acao, ...payload } }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onConfirm(decisoes);
        } finally {
            setSubmitting(false);
        }
    };

    const totalPorAcao = useMemo(() => {
        const t = { vincular: 0, criar: 0, ignorar: 0 };
        Object.values(decisoes).forEach((d) => { t[d.acao] = (t[d.acao] || 0) + 1; });
        return t;
    }, [decisoes]);

    return (
        <div className="space-y-4">
            <div className="bg-gray-50 rounded p-3 text-sm flex justify-between">
                <div>
                    <span className="font-medium">Etapa 3 de 3:</span> Vincular cada item a um insumo cadastrado, criar novo ou ignorar.
                </div>
                <div className="flex gap-3 text-xs">
                    <span><Link2 className="inline h-3 w-3 mr-1 text-blue-600" />{totalPorAcao.vincular} vincular</span>
                    <span><Plus className="inline h-3 w-3 mr-1 text-green-600" />{totalPorAcao.criar} criar</span>
                    <span><X className="inline h-3 w-3 mr-1 text-gray-500" />{totalPorAcao.ignorar} ignorar</span>
                </div>
            </div>

            {loadingIA && (
                <Alert className="bg-purple-50 border-purple-200">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-sm">
                        <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                        IA analisando descrições para detectar marcas...
                    </AlertDescription>
                </Alert>
            )}

            {!loadingIA && erroIA && (
                <Alert variant="destructive">
                    <AlertDescription className="text-sm">
                        <strong>Detecção de marcas pela IA falhou:</strong> {erroIA}
                        <div className="text-xs mt-1 opacity-80">
                            Verifique se <code>ANTHROPIC_API_KEY</code> está configurada no <code>.env.local</code>. Você pode continuar a importação normalmente — apenas sem sugestão automática de marca.
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {!loadingIA && marcasParaCriarNoCatalogo.length > 0 && (
                <Alert className="bg-purple-50 border-purple-200 py-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <AlertDescription>
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <div>
                                <strong>{marcasParaCriarNoCatalogo.length}</strong> marca(s) aceita(s) ainda não estão no catálogo:{' '}
                                <span className="text-purple-700">{marcasParaCriarNoCatalogo.join(', ')}</span>
                            </div>
                            <Button size="sm" onClick={handleCriarMarcas} disabled={criandoMarcas}>
                                {criandoMarcas
                                    ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Criando...</>
                                    : <><Plus className="h-4 w-4 mr-1" />Criar no catálogo</>}
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {loadingInsumos && (
                <div className="text-center py-4 text-gray-500"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Carregando insumos cadastrados...</div>
            )}

            <div className="space-y-3">
                {itens.map((it) => (
                    <ItemRow
                        key={it.indice}
                        item={it}
                        insumos={insumos}
                        insumosById={insumosById}
                        marcaIA={marcasIA[it.indice] || null}
                        marcaStatus={marcasItemDecidida[it.indice]}
                        marcaENova={!!(marcasIA[it.indice] && novasMarcasNoCatalogo.has(marcasIA[it.indice].toLowerCase()))}
                        decisao={decisoes[it.indice]}
                        onSetAcao={(acao, payload) => setAcao(it.indice, acao, payload)}
                        onAceitarMarca={() => aceitarMarcaItem(it.indice, marcasIA[it.indice])}
                        onIgnorarMarca={() => ignorarMarcaItem(it.indice, marcasIA[it.indice])}
                    />
                ))}
            </div>

            <div className="flex justify-between pt-2 border-t">
                <Button variant="outline" onClick={onBack} disabled={submitting}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <Button onClick={handleSubmit} disabled={submitting || loadingInsumos}>
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando...</> : <><Save className="h-4 w-4 mr-2" />Confirmar e importar</>}
                </Button>
            </div>
        </div>
    );
}

function ItemRow({ item, insumos, insumosById, marcaIA, marcaStatus, marcaENova, decisao, onSetAcao, onAceitarMarca, onIgnorarMarca }) {
    const calc = item.calculoPreco;
    const candidatos = item.matches || [];
    const marcaAceita = marcaStatus === 'aceita';

    return (
        <div className="border rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-2 flex-wrap">
                        <span>{item.descricao}</span>
                        {marcaAceita && marcaIA && (
                            <Badge variant="outline" className="bg-emerald-50 border-emerald-300 text-emerald-700 text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Marca: {marcaIA}
                            </Badge>
                        )}
                    </div>
                    <div className="text-xs text-gray-600">
                        {item.unidadeComercial} × {item.quantidade} • {formatCurrency(item.valorUnitario)} unit.
                        {' → '} <strong>{formatCurrency(calc?.precoCanonico)}/{calc?.unidadeCanonica}</strong>
                    </div>
                </div>
                <div className="flex gap-1">
                    <Button size="sm" variant={decisao.acao === ACOES.VINCULAR ? 'default' : 'outline'}
                        onClick={() => onSetAcao(ACOES.VINCULAR, { insumoId: decisao.insumoId || candidatos[0]?.insumoId || '', aplicarMarca: decisao.aplicarMarca || '' })}>
                        <Link2 className="h-3 w-3 mr-1" />Vincular
                    </Button>
                    <Button size="sm" variant={decisao.acao === ACOES.CRIAR ? 'default' : 'outline'}
                        onClick={() => onSetAcao(ACOES.CRIAR, { novo: decisao.novo || defaultNovo(item) })}>
                        <Plus className="h-3 w-3 mr-1" />Criar
                    </Button>
                    <Button size="sm" variant={decisao.acao === ACOES.IGNORAR ? 'default' : 'outline'}
                        onClick={() => onSetAcao(ACOES.IGNORAR)}>
                        <X className="h-3 w-3 mr-1" />Ignorar
                    </Button>
                </div>
            </div>

            {marcaIA && !marcaStatus && (
                <div className="bg-purple-50 border border-purple-200 rounded p-2 flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span>
                            IA detectou marca: <strong className="text-purple-700">{marcaIA}</strong>
                            {marcaENova && <Badge variant="outline" className="ml-2 bg-amber-50 border-amber-300 text-amber-700 text-xs">nova no catálogo</Badge>}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-gray-300" onClick={onIgnorarMarca}>
                            <X className="h-3 w-3 mr-1" />Ignorar
                        </Button>
                        <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700" onClick={onAceitarMarca}>
                            <Check className="h-3 w-3 mr-1" />Aceitar marca
                        </Button>
                    </div>
                </div>
            )}

            {decisao.acao === ACOES.VINCULAR && (
                <VincularPicker
                    candidatos={candidatos}
                    insumos={insumos}
                    insumosById={insumosById}
                    insumoId={decisao.insumoId}
                    marcaIA={marcaAceita ? marcaIA : null}
                    aplicarMarca={decisao.aplicarMarca || ''}
                    onChange={(insumoId) => onSetAcao(ACOES.VINCULAR, { insumoId, aplicarMarca: decisao.aplicarMarca || '' })}
                    onToggleAplicarMarca={(marca) => onSetAcao(ACOES.VINCULAR, { insumoId: decisao.insumoId, aplicarMarca: marca })}
                />
            )}

            {decisao.acao === ACOES.CRIAR && (
                <CriarForm
                    novo={decisao.novo}
                    onChange={(novo) => onSetAcao(ACOES.CRIAR, { novo })}
                />
            )}
        </div>
    );
}

function VincularPicker({ candidatos, insumos, insumosById, insumoId, marcaIA, aplicarMarca, onChange, onToggleAplicarMarca }) {
    const [busca, setBusca] = useState('');
    const filtrados = useMemo(() => {
        if (!busca.trim()) return [];
        const q = busca.toLowerCase();
        return insumos.filter((i) => {
            const txt = `${i.name || ''} ${i.commercial_name || ''} ${i.brand || ''}`.toLowerCase();
            return txt.includes(q);
        }).slice(0, 8);
    }, [busca, insumos]);

    const escolhido = insumosById.get(insumoId);

    return (
        <div className="bg-blue-50/50 rounded p-2 space-y-2 ml-1">
            {candidatos.length > 0 && (
                <div>
                    <div className="text-xs text-gray-600 mb-1">Sugestões:</div>
                    <div className="flex flex-wrap gap-1.5">
                        {candidatos.map((c) => {
                            const sel = insumoId === c.insumoId;
                            return (
                                <button
                                    key={c.insumoId}
                                    type="button"
                                    onClick={() => onChange(c.insumoId)}
                                    className={
                                        'text-xs px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 ' +
                                        (sel
                                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-md ring-2 ring-emerald-300'
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400')
                                    }
                                >
                                    {sel && <Check className="h-3 w-3" />}
                                    <span>{c.insumoNome}{c.insumoMarca ? ` / ${c.insumoMarca}` : ''}</span>
                                    <Badge variant="secondary" className={'ml-0.5 text-xs ' + (sel ? 'bg-emerald-700 text-white' : '')}>
                                        {c.via === 'alias' ? 'alias' : c.score.toFixed(2)}
                                    </Badge>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            <div>
                <div className="text-xs text-gray-600 mb-1">Buscar outro:</div>
                <div className="relative">
                    <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                    <Input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Digite parte do nome do insumo..."
                        className="pl-7 h-8 text-sm"
                    />
                </div>
                {filtrados.length > 0 && (
                    <div className="mt-1 max-h-32 overflow-y-auto border rounded bg-white">
                        {filtrados.map((i) => (
                            <button
                                key={i.id}
                                type="button"
                                onClick={() => { onChange(i.id); setBusca(''); }}
                                className="w-full text-left px-2 py-1 text-sm hover:bg-blue-100"
                            >
                                {i.commercial_name || i.name}{i.brand ? ` — ${i.brand}` : ''}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {escolhido && (
                <div className="text-xs bg-white border rounded p-2 space-y-1.5">
                    <div>
                        Vinculando a: <strong>{escolhido.commercial_name || escolhido.name}</strong>
                        {escolhido.brand ? ` / ${escolhido.brand}` : ''}
                        {escolhido.current_price != null && ` • atual ${formatCurrency(escolhido.current_price)}/${escolhido.unit || 'un'}`}
                    </div>
                    {marcaIA && marcaIA.toLowerCase() !== String(escolhido.brand || '').toLowerCase() && (
                        <label className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded px-2 py-1 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={aplicarMarca === marcaIA}
                                onChange={(e) => onToggleAplicarMarca(e.target.checked ? marcaIA : '')}
                                className="h-3.5 w-3.5"
                            />
                            <Sparkles className="h-3 w-3 text-purple-600" />
                            <span>
                                Atualizar marca deste insumo para <strong>{marcaIA}</strong>
                                {escolhido.brand
                                    ? <> (atual: <em>{escolhido.brand}</em>)</>
                                    : <> (atualmente sem marca)</>}
                            </span>
                        </label>
                    )}
                </div>
            )}
            {!escolhido && insumoId && (
                <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">Insumo selecionado não encontrado.</AlertDescription>
                </Alert>
            )}
        </div>
    );
}

function CriarForm({ novo, onChange }) {
    const set = (k, v) => onChange({ ...novo, [k]: v });
    return (
        <div className="bg-green-50/50 rounded p-2 space-y-2 ml-1">
            <div className="grid grid-cols-2 gap-2 text-sm">
                <label className="space-y-1">
                    <span className="text-xs text-gray-600">Nome</span>
                    <Input value={novo.name} onChange={(e) => set('name', e.target.value)} className="h-8" />
                </label>
                <label className="space-y-1">
                    <span className="text-xs text-gray-600">Marca</span>
                    <Input value={novo.brand} onChange={(e) => set('brand', e.target.value)} className="h-8" />
                </label>
                <label className="space-y-1">
                    <span className="text-xs text-gray-600">Categoria</span>
                    <Input value={novo.category} onChange={(e) => set('category', e.target.value)} className="h-8" placeholder="opcional" />
                </label>
                <label className="space-y-1">
                    <span className="text-xs text-gray-600">Unidade canônica</span>
                    <Input value={novo.unit} onChange={(e) => set('unit', e.target.value)} className="h-8" />
                </label>
            </div>
        </div>
    );
}

function defaultNovo(item, cabecalho) {
    return {
        name: item.descricao || '',
        brand: '',
        category: '',
        unit: item.calculoPreco?.unidadeCanonica || 'un',
        main_supplier: cabecalho?.emitente?.razaoSocial || '',
        supplier_cnpj: cabecalho?.emitente?.cnpj || '',
    };
}
