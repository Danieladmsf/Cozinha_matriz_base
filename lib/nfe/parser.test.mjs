import { readFileSync } from 'node:fs';
import { parseNfeXml } from './parser.js';

const files = [
    'XmlEmail[100].[001].[543383].xml',
    '35260465790610000181550020023577771848970754-procNFe.xml',
    '35260406880979000116550010052351161993568533-nfe.xml',
];

const root = process.cwd();
let failed = 0;

for (const file of files) {
    console.log(`\n========== ${file} ==========`);
    try {
        const xml = readFileSync(`${root}/${file}`, 'utf8');
        const { cabecalho, itens } = parseNfeXml(xml);
        console.log('Emitente:', cabecalho.emitente.razaoSocial, '-', cabecalho.emitente.cnpj);
        console.log('NFe:', cabecalho.numero, '| Data:', cabecalho.dataEmissao);
        console.log('Total nota: R$', cabecalho.totais.valorNota.toFixed(2));
        console.log(`Itens (${itens.length}):`);
        itens.forEach((it) => {
            console.log(
                `  [${it.indice}] ${it.descricao} | ${it.unidadeComercial} ` +
                `qtd=${it.quantidade} unit=R$${it.valorUnitario.toFixed(4)} ` +
                `total=R$${it.valorTotal.toFixed(2)}`
            );
        });
    } catch (err) {
        console.error('FALHOU:', err.message);
        failed++;
    }
}

console.log(`\n${failed === 0 ? 'OK — todos parsearam' : `FALHA em ${failed} arquivo(s)`}`);
process.exit(failed === 0 ? 0 : 1);
