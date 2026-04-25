import { matchAllItems } from './matcher.js';

const insumosFake = [
    { id: 'i1', name: 'Carne bovina contra filé', commercial_name: 'Contra filé bovino resfriado', brand: '', aliases: [] },
    { id: 'i2', name: 'Filé de peito de frango', commercial_name: 'Peito de frango sem pele', brand: 'Sadia', aliases: [] },
    { id: 'i3', name: 'Creme de leite', commercial_name: 'Creme de leite', brand: 'Piracanjuba', aliases: ['CREME LEITE PIRACANJUBA 12X1,03KG'] },
    { id: 'i4', name: 'Farinha de trigo', commercial_name: 'Farinha de trigo', brand: 'Nita', aliases: [] },
    { id: 'i5', name: 'Leite integral', commercial_name: 'Leite UHT integral', brand: 'Italac', aliases: [] },
    { id: 'i6', name: 'Óleo de soja', commercial_name: 'Óleo de soja refinado', brand: 'Vila Velha', aliases: [] },
    { id: 'i7', name: 'Presunto cozido', commercial_name: 'Presunto', brand: 'Perdigão', aliases: [] },
    { id: 'i8', name: 'Açúcar cristal', commercial_name: 'Açúcar', brand: 'União', aliases: [] },
];

const itensSimulados = [
    { descricao: 'CARNE RESF BOV S/ OSSO CONTRA FILE' },
    { descricao: 'FILE DE PEITO SEM  PELE RESFRIADO' },
    { descricao: 'CREME LEITE PIRACANJUBA 12X1,03KG' },
    { descricao: 'FARINHA NITA 5X5KG' },
    { descricao: 'LEITE ITALAC INTEGRAL 12X1' },
    { descricao: 'OLEO SOJA VILA VELHA BBN 18LT' },
    { descricao: 'OLEO SOJA VILA VELHA PET 20X900ML' },
    { descricao: 'PRESUNTO PERDIGAO 3,4KG CX2PC' },
    { descricao: 'PRODUTO QUE NAO EXISTE NO CADASTRO' },
];

const out = matchAllItems(itensSimulados, insumosFake);
out.forEach((it) => {
    console.log(`\n• ${it.descricao}`);
    if (it.matches.length === 0) {
        console.log('   sem candidatos');
    } else {
        it.matches.forEach((m, i) => {
            console.log(`   ${i + 1}. [${m.score.toFixed(3)} via:${m.via}] ${m.insumoNome}${m.insumoMarca ? ' / ' + m.insumoMarca : ''}`);
        });
    }
    console.log(`   AUTO: ${it.matchAutomatico ? `${it.matchAutomatico.insumoId} (${it.matchAutomatico.score.toFixed(3)} via ${it.matchAutomatico.via})` : 'NÃO — usuário decide'}`);
});
