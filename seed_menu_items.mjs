import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

// Configurar o admin usando a variável de ambiente que já aponta para o JSON
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.GOOGLE_APPLICATION_CREDENTIALS = './utils/cozinha-matriz-base-firebase-adminsdk-fbsvc-944f99cae6.json';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const OWNER_ID = "ibXDMh5w7TPUhoVmgwqMugiKPFW2";

const rawData = `Id	Ref	Titulo	Valor	Categoria	Promoção?	Mais vendido?	Ativo?	Opcões
1942730		Nenhum ficheiro selecionadoTorta de sardinha	R$ 7,00	Prato do dia				
1936074		Nenhum ficheiro selecionadoTorta de sardinha	R$ 7,00	Salgados				
1935749		Nenhum ficheiro selecionadoPromoção Suco de Limão	R$ 9,00	Sucos				
1925122		Nenhum ficheiro selecionadoCOMBO FEIJOADA	R$ 50,00	Marmitex				
1924801		Nenhum ficheiro selecionadoMarmitex M Feijoada	R$ 25,90	Marmitex				
1911829		Nenhum ficheiro selecionadoPF Pão de queijo	R$ 3,50	Salgados				
1640382		Nenhum ficheiro selecionadoPorção de Maionese 300grs	R$ 24,00	Prato do dia				
1596116		Nenhum ficheiro selecionadoCapeletti de carne ao molho Bolonhesa	R$ 19,90	Prato do dia				
1569213		Nenhum ficheiro selecionadoPromoção vitamina de Abacate 500ml	R$ 10,00	Vitaminas				
1464816		Nenhum ficheiro selecionadoFolheado de Presunto e queijo	R$ 7,00	Salgados				
1464815		Nenhum ficheiro selecionadoFolheado de peito de peru	R$ 7,00	Salgados				
1464814		Nenhum ficheiro selecionadoFolheado de Ricota	R$ 7,00	Salgados				
1464813		Nenhum ficheiro selecionadoCroissant frango	R$ 8,00	Salgados				
1464812		Nenhum ficheiro selecionadoCroissant quatro queijos	R$ 7,00	Salgados				
1464811		Nenhum ficheiro selecionadoCroissant presunto e queijo	R$ 8,00	Salgados				
1443230		Nenhum ficheiro selecionadoGuarana Antarctica 300ml (Retornavel)
Consumo no local
R$ 4,50	Refrigerantes				
1403692		Nenhum ficheiro selecionadoPF: Fricasse Frango
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 18,90	Prato do dia				
1380387		Nenhum ficheiro selecionadoPF: Peixe frito
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 22,90	Prato do dia				
1377282		Nenhum ficheiro selecionadoPF: File de Frango a Parmegiana	R$ 26,90	Prato do dia				
1340405		Nenhum ficheiro selecionadoPF : Nhoqque c/ Tirinha Carne Acebolada e Salada
Grupo de: Preferências de massa
R$ 22,90	Prato do dia				
1340403		Nenhum ficheiro selecionadoPF : Strogonoff de Frango	R$ 19,90	Prato do dia				
1336732		Nenhum ficheiro selecionadoPF: Filé de Frango a Milanesa
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 20,90	Prato do dia				
1332314		Nenhum ficheiro selecionadoPF: Copa Lombo em tiras Aceboladas
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 21,90	Prato do dia				
1332287		Nenhum ficheiro selecionadoPF: Tirinha de Frango Acebolada
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 18,90	Prato do dia				
1325703		Nenhum ficheiro selecionadoPF : Macarrão ao Sugo c/ Coxinha Frango Frita
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional
R$ 20,90	Prato do dia				
1325702		Nenhum ficheiro selecionadoPF : Nhoqque c/ Coxinha Asa Frango Frita
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências de massa
R$ 22,90	Prato do dia				
1319289		Nenhum ficheiro selecionadoPF: Kids c/ Nuggets
Grupo de: Preferências
R$ 17,90	Prato Feito				
1263969		Nenhum ficheiro selecionadoPF: Meio d Asa Frango e sobrecoxa refogada suculenta
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 18,90	Prato do dia				
1251543		Nenhum ficheiro selecionadoPF: Omelete
Grupo de: Escolha sua Guarnição Adicional; Preferências
R$ 16,90	Prato Feito				
1251483		Nenhum ficheiro selecionadoㅤ
Grupo de: Acréscimos; Recheio de:
R$ 18,00	Tapiocas				
1251482		Nenhum ficheiro selecionadoㅤ
Grupo de: Acréscimos; Recheio de:
R$ 20,00	Crepiocas				
1251481		Nenhum ficheiro selecionadoㅤ
Grupo de: Acréscimos
R$ 18,00	Omeletes				
1243961		Nenhum ficheiro selecionadoPF: Feijão gordo
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional
R$ 22,90	Prato do dia				
1241261		Nenhum ficheiro selecionadoPF: Lasanha ao Molho Rose
Grupo de: Escolha sua Guarnição Adicional; Preferências
R$ 20,90	Prato do dia				
1224019		Nenhum ficheiro selecionadoPF: Feijoada	R$ 25,90	Prato do dia				
1210502		Nenhum ficheiro selecionadoX Burguer
Grupo de: Acréscimos; Opção de Pão
R$ 15,00	Lanches Quentes				
1196323		Nenhum ficheiro selecionadoPorção de moqueca	R$ 20,00	Prato do dia				
1196322		Nenhum ficheiro selecionadoPF: Moqueca
Grupo de: Escolha sua Guarnição Adicional; Preferências
R$ 26,90	Prato do dia				
1193893		Nenhum ficheiro selecionadoPF: Peixe c/ batata ao molho
Grupo de: Escolha sua Guarnição Adicional; Preferências
R$ 24,90	Prato do dia				
1189813		Nenhum ficheiro selecionadoAdd Prato
Grupo de: Acréscimos; Escolha sua Guarnição Adicional
Somente PDV
R$	Prato Feito				
1177487		Nenhum ficheiro selecionadoUnidade charuto	R$ 10,00	Prato do dia				
1177443		Nenhum ficheiro selecionadoSalgados fritos	R$ 6,50	Salgados				
1177309		Nenhum ficheiro selecionadoPF: Charuto
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional
R$ 22,90	Prato do dia				
1177308		Nenhum ficheiro selecionadoPF : Nhoqque c/ Sobrecoxa Frango Assada
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências de massa
R$ 22,90	Prato do dia				
1168997		Nenhum ficheiro selecionadoPromoção vitamina Mista com Laranja 500 ml	R$ 9,00	Vitaminas				
1168974		Nenhum ficheiro selecionadoPedaço bolo fubá c/laranja	R$ 5,00	Sobremesas				
1168867		Nenhum ficheiro selecionadoPF: Kids c/ hamburguer
Grupo de: Preferências
R$ 17,90	Prato Feito				
1156291		Nenhum ficheiro selecionadoPF : Macarrão ao Sugo c/ Sobrecoxa
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 22,90	Prato do dia				
1149888		Nenhum ficheiro selecionadoOuro branco	R$ 2,50	Bomboniere				
1149887		Nenhum ficheiro selecionadoSonho de valsa	R$ 2,50	Bomboniere				
1149886		Nenhum ficheiro selecionadoStikadinho	R$ 2,00	Bomboniere				
1149885		Nenhum ficheiro selecionadoTrento	R$ 4,00	Bomboniere				
1140883		Nenhum ficheiro selecionado2 X tudo	R$ 50,00	Promoção Lanches Quentes				
1140862		Nenhum ficheiro selecionadoPF: Ponta de Peito de panela
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 22,90	Prato do dia				
1128098		Nenhum ficheiro selecionadoPF: Carne Moída c/ Legumes
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 20,90	Prato do dia				
1125623		Nenhum ficheiro selecionadoPedaço individual lasanha
Grupo de: Escolha sua Guarnição Adicional
R$ 15,00	Prato do dia				
1125620		Nenhum ficheiro selecionadoPF: Lasanha ao molho rose presunto e queijo
Grupo de: Escolha sua Guarnição Adicional
R$ 22,90	Prato do dia				
1125619		Nenhum ficheiro selecionadoPF: Tiras de carne Acebolado
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 22,90	Prato do dia				
1125618		Nenhum ficheiro selecionadoPF: Carré Suino Assado c/ Vinagrete
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 22,90	Prato do dia				
1114712		Nenhum ficheiro selecionadoPf : Sobrecoxa com Quiabo ao molho
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 19,90	Prato do dia				
1110425		Nenhum ficheiro selecionadoAzedinha	R$ 3,00	Bomboniere				
1110116		Nenhum ficheiro selecionadoPF: Almôndega ao molho
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 20,90	Prato do dia				
1110115		Nenhum ficheiro selecionadoPF: Carne Suina em cubos
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 21,90	Prato do dia				
1108322		Nenhum ficheiro selecionadoUnidade panqueca	R$ 10,00	Prato do dia				
1100104		Nenhum ficheiro selecionadoBioleve	R$ 4,00	Refrigerantes				
1099909		Nenhum ficheiro selecionadoPF: Costela Bovina cm Mandioca
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 22,90	Prato do dia				
1098051		Nenhum ficheiro selecionadoSalada no prato	R$ 30,00	Prato Feito				
1098015		Nenhum ficheiro selecionadoPedaço de quibe	R$ 8,00	Prato do dia				
1097732		Nenhum ficheiro selecionadoPF: Quibe assado
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 20,90	Prato do dia				
1095778		Nenhum ficheiro selecionadoCroissant de chocolate	R$ 8,00	Salgados				
1095736		Nenhum ficheiro selecionadoPF: Carne de Panela c/ Batata
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 22,90	Prato do dia				
1093513		Nenhum ficheiro selecionadoPF: Panqueca
Grupo de: Escolha sua Guarnição Adicional
R$ 22,90	Prato do dia				
1087935		Nenhum ficheiro selecionadoNhoque	R$ 20,00	Massas				
1087925		Nenhum ficheiro selecionadoPF : Sobrecoxa c/ Macarrão ao Sugo
Grupo de: Escolha sua Guarnição Adicional; Preferências
R$ 20,90	Prato do dia				
1085742		Nenhum ficheiro selecionadoPF: sem carne
Grupo de: Escolha sua Guarnição; Preferências
R$ 17,90	Prato Feito				
1085508		Nenhum ficheiro selecionadoCaldo de mandioca	R$ 20,00	Caldos				
1085478		Nenhum ficheiro selecionadoCoca cola 1L
Consumo no local
R$ 10,00	Refrigerantes				
1083075		Nenhum ficheiro selecionadoPF : Strogonoff de Carne
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 22,90	Prato do dia				
1081243		Nenhum ficheiro selecionadoPudim de leite condensado	R$ 6,00	Sobremesas				
1079474		Nenhum ficheiro selecionadoPaçoquita	R$ 0,50	Bomboniere				
1079473		Nenhum ficheiro selecionadoPé de Moça	R$ 3,50	Bomboniere				
1079472		Nenhum ficheiro selecionadoPaçoca	R$ 3,50	Bomboniere				
1079471		Nenhum ficheiro selecionadoPingo Leite	R$ 2,50	Bomboniere				
1079470		Nenhum ficheiro selecionadoDoce Ninho	R$ 2,50	Bomboniere				
1079469		Nenhum ficheiro selecionadoKit kat	R$ 7,00	Bomboniere				
1079468		Nenhum ficheiro selecionadoSuflair	R$ 8,00	Bomboniere				
1079467		Nenhum ficheiro selecionadoHalls	R$ 2,00	Bomboniere				
1079466		Nenhum ficheiro selecionadoTrident	R$ 3,00	Bomboniere				
1079465		Nenhum ficheiro selecionadoBalas	R$ 0,20	Bomboniere				
1078552		Nenhum ficheiro selecionadoPF: Pernil Suina Acebolada
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 19,90	Prato do dia				
1076561		Nenhum ficheiro selecionadoBomboniere	R$ 0,20*	Bomboniere				
1076560		Nenhum ficheiro selecionadoPF: Copa Lombo
Compartilhando Grupos/Opções
Grupo de: Preferências
R$ 21,90	Prato Feito				
1076516		Nenhum ficheiro selecionadoPF: Linguiça
Grupo de: PF: Copa Lombo
Grupo de: Preferências
R$ 20,90	Prato Feito				
1075201		Nenhum ficheiro selecionadoPF: Filé de peixe
Grupo de: PF: Copa Lombo
Grupo de: Preferências
R$ 28,90	Prato Feito				
1075200		Nenhum ficheiro selecionadoPF: Filé de frango
Grupo de: PF: Copa Lombo
Grupo de: Preferências
R$ 20,90	Prato Feito				
1074804		Nenhum ficheiro selecionadoPF: Contra filé
Grupo de: PF: Copa Lombo
Grupo de: Preferências
R$ 28,90	Prato Feito				
1074525		Nenhum ficheiro selecionadoX salada	R$ 23,00	Promoção Lanches Quentes				
1074524		Nenhum ficheiro selecionadoFrango salada	R$ 26,00	Promoção Lanches Quentes				
1074523		Nenhum ficheiro selecionadoX linguiça salada	R$ 24,00	Promoção Lanches Quentes				
1074522		Nenhum ficheiro selecionadoX tudo	R$ 27,00	Promoção Lanches Quentes				
1074521		Nenhum ficheiro selecionadoCopa Lombo salada	R$ 25,00	Promoção Lanches Quentes				
1074501		Nenhum ficheiro selecionadoPF : Calabresa Acebolada
Grupo de: Escolha sua Guarnição; Escolha sua Guarnição Adicional; Preferências
R$ 18,90	Prato do dia				
1040773		Nenhum ficheiro selecionadoSuco Nativo	R$ 3,50	Refrigerantes				
1040772		Nenhum ficheiro selecionadoLimoneto H2OH	R$ 7,00	Refrigerantes				
1040771		Nenhum ficheiro selecionadoÁgua sem Gás	R$ 4,00	Refrigerantes				
1040770		Nenhum ficheiro selecionadoÁgua com Gás	R$ 4,00	Refrigerantes				
1040769		Nenhum ficheiro selecionadoJaboti 2Lts	R$ 7,00	Refrigerantes				
1040767		Nenhum ficheiro selecionadoJaboti 250ml	R$ 3,50	Refrigerantes				
1040766		Nenhum ficheiro selecionadoJaboti 600ml
Consumo no local
R$ 5,00	Refrigerantes				
1040765		Nenhum ficheiro selecionadoCoca-Cola 2Lts	R$ 13,00	Refrigerantes				
1040764		Nenhum ficheiro selecionadoCoca-Cola 600ml	R$ 8,00	Refrigerantes				
1040751		Nenhum ficheiro selecionadoCoca-Cola KS
Consumo no local
R$ 5,00	Refrigerantes				
1040745		Nenhum ficheiro selecionadoCoca cola 220ml	R$ 5,00	Refrigerantes				
1040744		Nenhum ficheiro selecionadoRefrigerante lata 350ml	R$ 6,50*	Refrigerantes				
1040743		Nenhum ficheiro selecionadoCapuccino Gelado	R$ 10,00	Café				
1040742		Nenhum ficheiro selecionadoCapuccino Quente	R$ 8,00	Café				
1040741		Nenhum ficheiro selecionadoPingado	R$ 7,00	Café				
1040740		Nenhum ficheiro selecionadoCafé	R$ 3,50	Café				
1040739		Nenhum ficheiro selecionadoPão com ovo e queijo	R$ 15,00	Café				
1040738		Nenhum ficheiro selecionadoPão com ovo	R$ 12,00	Café				
1040737		Nenhum ficheiro selecionadoPão na chapa com queijo	R$ 10,00	Café				
1040736		Nenhum ficheiro selecionadoPão na Chapa com Manteiga	R$ 5,00	Café				
1040735		Nenhum ficheiro selecionadoPão de Queijo Recheado	R$ 6,00	Café				
1040734		Nenhum ficheiro selecionadoPão de Queijo	R$ 4,00	Café				
1040729		Nenhum ficheiro selecionadoFilé tudo
Grupo de: Bauru
R$ 35,00	Lanches Quentes				
1040728		Nenhum ficheiro selecionadoCarne Queijo Acebolado
Grupo de: Bauru
R$ 30,00	Lanches Quentes				
1040727		Nenhum ficheiro selecionadoFilé Salada EGG Bacon
Grupo de: Bauru
R$ 31,00	Lanches Quentes				
1040726		Nenhum ficheiro selecionadoFile Salada Bacon
Grupo de: Bauru
R$ 29,00	Lanches Quentes				
1040708		Nenhum ficheiro selecionadoFilé Salada EGG
Grupo de: Bauru
R$ 27,00	Lanches Quentes				
1040707		Nenhum ficheiro selecionadoFilé Salada
Grupo de: Bauru
R$ 25,00	Lanches Quentes				
1040706		Nenhum ficheiro selecionadoFrango Tudo
Grupo de: Bauru
R$ 25,00	Lanches Quentes				
1040705		Nenhum ficheiro selecionadoFrango Salada EGG Bacon
Grupo de: Bauru
R$ 24,00	Lanches Quentes				
1040704		Nenhum ficheiro selecionadoFrango Salada Bacon
Grupo de: Bauru
R$ 23,00	Lanches Quentes				
1040703		Nenhum ficheiro selecionadoFrango Salada EGG
Grupo de: Bauru
R$ 22,00	Lanches Quentes				
1040702		Nenhum ficheiro selecionadoFrango Salada
Grupo de: Bauru
R$ 21,00	Lanches Quentes				
1040701		Nenhum ficheiro selecionadoX Linguiça Tudo
Grupo de: Bauru
R$ 23,00	Lanches Quentes				
1040700		Nenhum ficheiro selecionadoX Linguiça EGG Bacon
Grupo de: Bauru
R$ 22,00	Lanches Quentes				
1040699		Nenhum ficheiro selecionadoX Linguiça Bacon
Grupo de: Bauru
R$ 21,00	Lanches Quentes				
1040698		Nenhum ficheiro selecionadoX Linguiça Salada EGG
Grupo de: Bauru
R$ 20,00	Lanches Quentes				
1040697		Nenhum ficheiro selecionadoX Linguiça Salada
Grupo de: Bauru
R$ 19,00	Lanches Quentes				
1040696		Nenhum ficheiro selecionadoCopa Lombo Tudo
Grupo de: Bauru
R$ 25,00	Lanches Quentes				
1040695		Nenhum ficheiro selecionadoCopa Lombo Salada Bacon EGG
Grupo de: Bauru
R$ 23,00	Lanches Quentes				
1040694		Nenhum ficheiro selecionadoCopa Lombo Salada Bacon
Grupo de: Bauru
R$ 22,00	Lanches Quentes				
1040693		Nenhum ficheiro selecionadoCopa Lombo Salada EGG
Grupo de: Bauru
R$ 21,00	Lanches Quentes				
1040692		Nenhum ficheiro selecionadoCopa Lombo Salada
Grupo de: Bauru
R$ 20,00	Lanches Quentes				
1040691		Nenhum ficheiro selecionadoX Tudo
Grupo de: Bauru
R$ 22,00	Lanches Quentes				
1040690		Nenhum ficheiro selecionadoX Salada EGG Bacon
Grupo de: Bauru
R$ 21,00	Lanches Quentes				
1040673		Nenhum ficheiro selecionadoX Salada Bacon
Grupo de: Bauru
R$ 20,00	Lanches Quentes				
1040671		Nenhum ficheiro selecionadoX Salada EGG
Grupo de: Bauru
R$ 19,00	Lanches Quentes				
1040670		Nenhum ficheiro selecionadoX Salada
Grupo de: Bauru
R$ 18,00	Lanches Quentes				
1040669		Nenhum ficheiro selecionadoAmericano
Grupo de: Bauru
R$ 18,00	Lanches Quentes				
1040668		Nenhum ficheiro selecionadoMisto	R$ 12,00	Lanches Quentes				
1040667		Nenhum ficheiro selecionadoBauru
Compartilhando Grupos/Opções
R$ 15,00	Lanches Quentes				
1040666		Nenhum ficheiro selecionadoAçai	R$ 18,00*	Sobremesas				
1040665		Nenhum ficheiro selecionadoSalada de Frutas	R$ 15,00*	Sobremesas				
1040664		Nenhum ficheiro selecionadoEscolha sua tapioca doce	R$ 25,00*	Tapiocas				
1040636		Nenhum ficheiro selecionadoEmpadas	R$ 8,00	Salgados				
1040615		Nenhum ficheiro selecionadoPizzas	R$ 8,00*	Salgados				
1040614		Nenhum ficheiro selecionadoSalgados Assados	R$ 6,50*	Salgados				
1040613		Nenhum ficheiro selecionadoLanche Natural	R$ 10,00	Lanches Naturais				
1039576		Nenhum ficheiro selecionadoSucos Funcionais (Detox)	R$ 15,00	Sucos Detox (Funcionais)				
1039550		Nenhum ficheiro selecionadoVitaminas 500 ml	R$ 15,00	Vitaminas				
1039542		Nenhum ficheiro selecionadoSuco 500 ml
Grupo de: Adicionais
R$ 12,00	Sucos				
1039437		Nenhum ficheiro selecionadoMarmitex Executiva (2 Carne)
Grupo de: Escolha sua Carne; Escolha sua Guarnição; Preferências
R$ 30,00	Marmitex				
1039436		Nenhum ficheiro selecionadoMarmitex Executiva (1 Carne)
Grupo de: Escolha sua Carne; Escolha sua Guarnição; Preferências
R$ 27,00	Marmitex				
1039435		Nenhum ficheiro selecionadoMarmitex M (2 Carne)
Grupo de: Escolha sua Carne; Escolha sua Guarnição; Preferências
R$ 27,90	Marmitex				
1039424		Nenhum ficheiro selecionadoMarmitex M (1 Carne)
Grupo de: Escolha sua Carne; Escolha sua Guarnição; Preferências
R$ 22,90	Marmitex				
1039416		Nenhum ficheiro selecionadoMarmitex P (2 Carne)
Grupo de: Escolha sua Carne; Escolha sua Guarnição; Preferências
R$ 23,90	Marmitex				
1039415		Nenhum ficheiro selecionadoMarmitex P (1 Carne)
Grupo de: Preferências
R$ 18,90	Marmitex`;

async function run() {
  const lines = rawData.split('\n');
  const items = [];
  
  // Extrair itens validos
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // As linhas seguem o formato:
    // ID \t \t Titulo \t Valor \t Categoria
    // O titulo as vezes esta quebrado em multiplas linhas.
    // Vamos usar um Regex para encontrar o inicio de uma linha de produto.
    const match = line.match(/^(\d{6,8})\s+/);
    if (match) {
      // Nova entrada
      items.push({ raw: line, nextLines: [] });
    } else if (items.length > 0) {
      // Linha adicional do produto anterior (descrição/grupo)
      items[items.length - 1].nextLines.push(line);
    }
  }

  // Obter categorias atuais
  const catsSnapshot = await db.collection('categories').where('ownerId', '==', OWNER_ID).get();
  const categoryMap = {};
  catsSnapshot.forEach(doc => {
    categoryMap[doc.data().name.toLowerCase()] = doc.id;
  });

  console.log(`[Seed] Encontramos ${items.length} itens a processar.`);
  console.log(`[Seed] Categorias existentes: ${Object.keys(categoryMap).length}`);

  let countItems = 0;
  let countCats = 0;

  for (const itemObj of items) {
    const raw = itemObj.raw;
    // Tenta quebrar por tabulações
    const parts = raw.split('\t');
    
    let titlePart = '';
    let pricePart = '';
    let categoryPart = '';

    // Encontrar onde está o "R$"
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].includes('R$') || parts[i].match(/R\$\s*\d+/)) {
        pricePart = parts[i];
        if (i > 0) titlePart = parts[i - 1];
        if (i < parts.length - 1) categoryPart = parts[i + 1];
        break;
      }
    }

    // Se nao achou, pode ser porque a tabulacao falhou
    if (!pricePart) {
      // Extrai usando regex
      const priceMatch = raw.match(/R\$\s*(\d+,\d+|\d+)(\*?)/);
      if (priceMatch) {
        pricePart = priceMatch[0];
        const splitStr = raw.split(pricePart);
        titlePart = splitStr[0];
        categoryPart = splitStr[1] ? splitStr[1].trim().split('\t')[0] : '';
      }
    }

    if (!titlePart) continue;

    // Limpar o titulo
    let name = titlePart.replace(/^\d+\s+/, '').replace('Nenhum ficheiro selecionado', '').trim();
    // Preco
    let priceNum = 0;
    if (pricePart) {
      const pMatch = pricePart.match(/(\d+),(\d+)/);
      if (pMatch) {
        priceNum = parseFloat(`${pMatch[1]}.${pMatch[2]}`);
      } else {
         const pMatch2 = pricePart.match(/(\d+)/);
         if (pMatch2) priceNum = parseFloat(pMatch2[1]);
      }
    }

    // Categoria
    let catName = categoryPart ? categoryPart.trim() : 'Gerais';
    if (!catName) catName = 'Gerais';

    // Cria categoria se não existir
    const catKey = catName.toLowerCase();
    let categoryId = categoryMap[catKey];
    if (!categoryId) {
      const newCatRef = db.collection('categories').doc();
      await newCatRef.set({
        id: newCatRef.id,
        name: catName,
        ownerId: OWNER_ID,
        displayOrder: 0,
        description: ""
      });
      categoryId = newCatRef.id;
      categoryMap[catKey] = categoryId;
      countCats++;
      console.log(`Nova categoria criada: ${catName}`);
    }

    // Adiciona ao firebase
    const newItemRef = db.collection('menuItems').doc();
    
    // Junta descricoes
    let description = itemObj.nextLines.join(' | ').trim();

    await newItemRef.set({
      id: newItemRef.id,
      name,
      description,
      price: priceNum,
      categoryId,
      ownerId: OWNER_ID,
      imageUrl: "",
      isAvailable: true,
      isRecommended: false,
      addonIds: []
    });

    countItems++;
  }

  console.log(`[Seed] Finalizado com sucesso. Foram importados ${countItems} produtos e criadas ${countCats} categorias.`);
}

run().catch(console.error);
