# Food360 - Gestão Inteligente para Cozinhas Industriais e Delivery

O **Food360** é uma plataforma SaaS B2B completa desenvolvida para transformar a gestão de cozinhas, restaurantes e indústrias de alimentos. A plataforma foca na precisão do controle de custos (CMV), automação de processos, rastreabilidade de insumos e inteligência artificial para otimização da produção.

Com uma arquitetura robusta *Multi-Tenant* (cada cliente possui um banco de dados isolado no Firebase) e integração avançada com a IA do Google (Gemini), o Food360 unifica e simplifica todos os módulos da cadeia produtiva de alimentos.

---

## Estrutura de Módulos e Funcionalidades

### 📊 1. Dashboard
O centro de controle gerencial. Fornece uma visão panorâmica e em tempo real sobre a saúde financeira e operacional da cozinha.
- **Métricas Chave**: CMV (Custo da Mercadoria Vendida) real e projetado, margens de lucro, itens mais vendidos e curva ABC.
- **Alertas Inteligentes**: Avisos automáticos sobre estoque baixo, fornecedores com alterações bruscas de preços ou fichas técnicas desatualizadas.

### 🍳 2. Receitas
Módulo para visualização rápida, gerenciamento e histórico de preparações consolidadas.
- **Aba de Listagem**: Busca ágil de todas as receitas ativas na base de dados.
- **Gestão de Versões**: Controle do histórico de alterações para padronização.
- **Relatório de Rentabilidade**: Indicadores automáticos de quanto cada receita está contribuindo para a rentabilidade da operação.

### 📦 3. Produtos (SKU)
Gestão dos itens finais que serão efetivamente vendidos ao cliente (os SKUs).
- **Conexão com Receitas**: Associa uma Receita ou Ficha Técnica a um SKU específico de venda.
- **Aba de Embalagens**: Atribui os custos exatos de embalagens, laços e selos ao produto.
- **Aba de Precificação**: Define o Preço de Venda (Markup) baseado em Custos Diretos (Insumos + Embalagens) e Indiretos (Impostos, Taxas de Delivery, Mão de Obra).

### 📋 4. Ficha Técnica
**O coração do sistema.** É o construtor dinâmico de preparações, dotado de engenharia de cardápio avançada.
- **Aba de Dados Técnicos**: Definição de rendimentos, peso porção, custos base, e classificação.
- **Aba de Ingredientes e Processos (Drag & Drop)**: Permite desenhar o fluxo de produção (ex: descongelar > limpar > cozinhar > porcionar). O sistema calcula as perdas térmicas e de limpeza automaticamente a cada etapa (Fator de Correção e Fator de Cocção).
- **Aba de Inteligência Artificial**: Acesso ao "Galo", o assistente I.A. especializado em culinária, que ajuda a criar métodos de preparo, extrair ingredientes de textos ou fotos, e sugerir otimizações de rendimento.
- **Conexão em Cascata**: Permite inserir *Sub-preparos* (outras fichas técnicas) dentro de uma Ficha Técnica principal. Quando a matriz é alterada, todas as fichas dependentes são atualizadas automaticamente.

### 👨‍🍳 5. POP's (Procedimentos Operacionais Padrão)
Garante a qualidade e padronização absoluta das preparações na cozinha.
- **Edição Passo a Passo**: Vincula equipamentos necessários (ex: "Forno Combinado") e EPIs.
- **Roteiros**: Texto detalhado com o tempo estimado de cada etapa para balizar o custo da mão de obra.
- **Mídia**: Inserção de fotos de referência para o resultado final desejado pela cozinha.

### 🏭 6. Ordem de Produção (OP)
Módulo que traduz a demanda comercial em ações práticas para a cozinha.
- **Aba de Solicitações**: Seleção de quais SKUs ou Receitas precisam ser produzidos e em qual quantidade.
- **Explosão de Materiais**: Calcula automaticamente a quantidade de insumos brutos que precisarão ser retirados do estoque (considerando as perdas registradas na Ficha Técnica).
- **Aba de Rendimentos**: Controle real vs planejado, alimentando o histórico de perdas da cozinha.

### 📅 7. Programação
Planejamento da agenda da brigada de cozinha.
- **Visão Calendário/Gantt**: Aloca as Ordens de Produção em dias, turnos ou praças (ex: Praça Fria, Grelha, Confeitaria).
- **Distribuição de Tarefas**: Atribui processos de preparo para manipuladores específicos, evitando gargalos e otimizando o uso dos equipamentos.

### 🥩 8. Insumos
O banco de dados da matéria-prima bruta.
- **Gestão Nutricional (TACO)**: Mais de 597 alimentos nativos pré-cadastrados, além de cálculo automático de macro e micronutrientes.
- **Gestão de Custos e Fatores Técnicos**: Definição de Fator de Correção padrão, Fator de Cocção padrão, custo por KG/Litro, e densidade.

### 📁 9. Categorias
Estrutura organizacional flexível.
- Criação de árvores de categorias e subcategorias (ex: Carnes > Bovinos > Cortes Nobres) para organizar insumos, receitas, processos e produtos, facilitando o filtro de relatórios no Dashboard.

### 🚚 10. Fornecedores e Serviços
Gestão da cadeia de suprimentos.
- Cadastro completo de fornecedores, dias de entrega e pedido mínimo.
- **Histórico de Preços**: Rastreia a variação de preços cobrada por cada fornecedor ao longo do tempo, auxiliando o setor de compras.

### 👥 11. Clientes
Para cozinhas que fornecem para outras empresas (B2B), franquias ou eventos.
- Cadastro de CNPJ/CPF, rotas de entrega e condições especiais de faturamento.

### 🧬 12. Tabela Nutricional
Geração automatizada de rótulos legais.
- Puxa a composição (TACO) de todos os insumos da Ficha Técnica e gera automaticamente a tabela nutricional padrão ANVISA (VD%, kcal, carboidratos, sódio, alérgenos).
- Geração de PDF pronto para a gráfica de embalagens.

### 🤖 13. Configurações da I.A.
Personalização do comportamento da inteligência artificial dentro da conta do usuário.
- Controle de Persona (Tom de voz, agressividade no controle de perdas).
- Customização do modelo Gemini (ex: Gemini 3.1 Pro para tarefas difíceis, Flash para extração rápida).
- Gerenciamento do histórico e limites de tokens/uso diário.

---

## A Conexão e o Fluxo Final ♻️

A verdadeira mágica do Food360 acontece na forma como estes módulos se interligam:

1. A **Compra de Insumos** atualiza o custo no módulo de **Fornecedores** e reflete no módulo de **Insumos**.
2. Os **Insumos**, com seus custos atualizados, alimentam a **Ficha Técnica**, que calcula o custo do preparo baseando-se em Fatores de Correção/Cocção.
3. A Ficha Técnica (com os Procedimentos de **POP's**) é ligada a um **Produto (SKU)**, que adiciona a embalagem e o custo indireto para gerar o Markup e o preço de venda exato.
4. O gestor emite uma **Ordem de Produção** desse SKU. O sistema gera a "Explosão de Materiais", debitando do estoque.
5. O Chef aloca a Ordem na **Programação** para a equipe executar de acordo com o POP e registra o rendimento final na Ordem.
6. A variação entre o rendimento real (Ordem de Produção) e o planejado (Ficha Técnica) retroalimenta as inteligências do **Dashboard**, entregando o **CMV Exato e o Lucro Líquido final**.

Tudo isso, desde a injeção inicial dos dados de fábrica até o login multi-tenant, funciona de forma totalmente autônoma e segura no servidor e cliente.
