import { XMLParser } from 'fast-xml-parser';

const parserOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
    removeNSPrefix: false,
};

function toNumber(v) {
    if (v === undefined || v === null || v === '') return 0;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
}

function pickInfNFe(parsed) {
    if (parsed?.nfeProc?.NFe?.infNFe) return parsed.nfeProc.NFe.infNFe;
    if (parsed?.NFe?.infNFe) return parsed.NFe.infNFe;
    if (parsed?.infNFe) return parsed.infNFe;
    return null;
}

function asArray(x) {
    if (x === undefined || x === null) return [];
    return Array.isArray(x) ? x : [x];
}

export function parseNfeXml(xmlString) {
    if (typeof xmlString !== 'string' || xmlString.trim().length === 0) {
        throw new Error('XML vazio ou inválido.');
    }

    const parser = new XMLParser(parserOptions);
    let parsed;
    try {
        parsed = parser.parse(xmlString);
    } catch (err) {
        throw new Error(`Falha ao parsear XML: ${err.message}`);
    }

    const infNFe = pickInfNFe(parsed);
    if (!infNFe) {
        throw new Error('Estrutura NFe não reconhecida (infNFe ausente).');
    }

    const ide = infNFe.ide || {};
    const emit = infNFe.emit || {};
    const dest = infNFe.dest || {};
    const total = infNFe.total?.ICMSTot || {};

    const chaveAcesso = (infNFe['@_Id'] || '').replace(/^NFe/, '');

    const cabecalho = {
        chaveAcesso,
        numero: ide.nNF || '',
        serie: ide.serie || '',
        dataEmissao: ide.dhEmi || ide.dEmi || '',
        naturezaOperacao: ide.natOp || '',
        emitente: {
            cnpj: emit.CNPJ || '',
            razaoSocial: emit.xNome || '',
            nomeFantasia: emit.xFant || '',
            uf: emit.enderEmit?.UF || '',
            municipio: emit.enderEmit?.xMun || '',
            ie: emit.IE || '',
        },
        destinatario: {
            cnpj: dest.CNPJ || dest.CPF || '',
            razaoSocial: dest.xNome || '',
        },
        totais: {
            valorProdutos: toNumber(total.vProd),
            valorDesconto: toNumber(total.vDesc),
            valorFrete: toNumber(total.vFrete),
            valorOutros: toNumber(total.vOutro),
            valorNota: toNumber(total.vNF),
        },
    };

    const detList = asArray(infNFe.det);
    const itens = detList.map((det, idx) => {
        const prod = det.prod || {};
        const qCom = toNumber(prod.qCom);
        const vUnCom = toNumber(prod.vUnCom);
        const vProd = toNumber(prod.vProd);
        const vDesc = toNumber(prod.vDesc);
        const vFrete = toNumber(prod.vFrete);
        const vOutro = toNumber(prod.vOutro);

        return {
            indice: Number(det['@_nItem']) || idx + 1,
            codigoProduto: prod.cProd || '',
            ean: prod.cEAN && prod.cEAN !== 'SEM GTIN' ? prod.cEAN : '',
            eanTributavel: prod.cEANTrib && prod.cEANTrib !== 'SEM GTIN' ? prod.cEANTrib : '',
            descricao: prod.xProd || '',
            ncm: prod.NCM || '',
            cfop: prod.CFOP || '',
            unidadeComercial: (prod.uCom || '').toUpperCase(),
            quantidade: qCom,
            valorUnitario: vUnCom,
            valorTotal: vProd,
            valorDesconto: vDesc,
            valorFrete: vFrete,
            valorOutros: vOutro,
            valorLiquido: Number((vProd - vDesc + vFrete + vOutro).toFixed(4)),
            unidadeTributavel: (prod.uTrib || '').toUpperCase(),
            quantidadeTributavel: toNumber(prod.qTrib),
            valorUnitarioTributavel: toNumber(prod.vUnTrib),
        };
    });

    return { cabecalho, itens };
}

export default parseNfeXml;
