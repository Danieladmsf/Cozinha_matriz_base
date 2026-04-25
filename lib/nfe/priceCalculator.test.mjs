import { readFileSync } from 'node:fs';
import { parseNfeXml } from './parser.js';
import { enrichItemsWithCanonicalPrice } from './priceCalculator.js';

const files = [
    'XmlEmail[100].[001].[543383].xml',
    '35260465790610000181550020023577771848970754-procNFe.xml',
    '35260406880979000116550010052351161993568533-nfe.xml',
];

const root = process.cwd();

for (const file of files) {
    console.log(`\n========== ${file} ==========`);
    const xml = readFileSync(`${root}/${file}`, 'utf8');
    const { itens } = parseNfeXml(xml);
    const enriched = enrichItemsWithCanonicalPrice(itens);
    enriched.forEach((it) => {
        const c = it.calculoPreco;
        console.log(
            `[${it.indice}] ${it.descricao}\n` +
            `    uCom=${it.unidadeComercial} qtd=${it.quantidade} unit=R$${it.valorUnitario.toFixed(4)}\n` +
            `    >>> R$ ${c.precoCanonico.toFixed(4)} / ${c.unidadeCanonica}  [conf:${c.confiabilidade}]\n` +
            `    obs: ${c.observacao}`
        );
    });
}
