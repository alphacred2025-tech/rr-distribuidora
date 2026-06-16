// ============================================================
// dados.js — RR Distribuidora
// Dados centrais: produtos, itens e helpers
// ============================================================

const WHATSAPP_NUMBER = '5581996206567';

// ─── Composição real das cestas (Simples e Completa) ──────────
// Baseado na lista oficial de itens por peso (1kg–11kg), conforme
// catálogo fornecido. Arroz/açúcar/macarrão/flocão escalam igual ao
// peso da cesta; o feijão NÃO escala 1:1 (ver tabela abaixo — segue
// a quantidade real informada, sem regra linear). Itens unitários e
// o kit de limpeza são fixos (óleo dobra a partir da cesta de 11kg).
// 2kg ainda não tem referência exata — usa o mesmo valor de 1kg.

const FEIJAO_POR_KG = { 1:1, 2:1, 3:3, 4:3, 5:4, 6:6, 7:6, 8:7, 9:8, 10:10, 11:10 };

function itensBaseSimples(kg) {
  return [
    { nome: `Feijão ${FEIJAO_POR_KG[kg]}kg`, categoria: 'alimento' },
    { nome: `Arroz ${kg}kg`,         categoria: 'alimento' },
    { nome: `Açúcar ${kg}kg`,        categoria: 'alimento' },
    { nome: `Macarrão ${kg}pct`,     categoria: 'alimento' },
    { nome: `Flocão ${kg}pct`,       categoria: 'alimento' },
    { nome: 'Farinha 1kg',           categoria: 'alimento' },
    { nome: 'Sal 1kg',               categoria: 'alimento' },
    { nome: kg >= 11 ? '2 Óleo' : '1 Óleo', categoria: 'alimento' },
    { nome: '1 Refrigerante',        categoria: 'alimento' },
    { nome: '1 Vinagre',             categoria: 'alimento' },
    { nome: '1 Leite Integral',      categoria: 'alimento' },
    { nome: '1 Sardinha',            categoria: 'alimento' },
    { nome: '1 Bolacha',             categoria: 'alimento' },
    { nome: '1 Café',                categoria: 'alimento' },
    { nome: '1 Margarina',           categoria: 'alimento' },
    { nome: '1 Sabão em Pó',         categoria: 'limpeza'  },
    { nome: '1 Sabão em Barra',      categoria: 'limpeza'  },
    { nome: '1 Água Sanitária',      categoria: 'limpeza'  },
    { nome: '1 Esponja de Prato',    categoria: 'limpeza'  },
    { nome: '1 Pct Papel Higiênico', categoria: 'limpeza'  },
    { nome: '1 Creme Dental',        categoria: 'higiene'  },
    { nome: '1 Sabonete',            categoria: 'higiene'  },
    { nome: '1 Bombril',             categoria: 'limpeza'  },
    { nome: '1 Detergente',          categoria: 'limpeza'  },
  ];
}

function itensBaseCompleta(kg) {
  return [
    ...itensBaseSimples(kg),
    { nome: '1 Miojo',              categoria: 'alimento' },
    { nome: '1 Extrato',            categoria: 'alimento' },
    { nome: '1 Kisuco',             categoria: 'alimento' },
    { nome: '1 Knoor',              categoria: 'alimento' },
    { nome: '1 Biscoito',           categoria: 'alimento' },
    { nome: '1 Doce',               categoria: 'alimento' },
    { nome: '1 Mortadela',          categoria: 'alimento' },
    { nome: '1 Salsicha Enlatada',  categoria: 'alimento' },
    { nome: '1 Pct de Charque',     categoria: 'alimento' },
  ];
}

// ─── Catálogo de Cestas ──────────────────────────────────────

const CESTAS = [
  // ── CESTA SIMPLES (1kg–11kg) ─────────────────────────────
  { id: 1,  nome: 'Cesta Simples 1kg',  peso: '1kg',  preco: 133.00, categoria: 'simples',  descricao: 'Cesta básica essencial com os principais itens do dia a dia.', itens: itensBaseSimples(1) },
  { id: 2,  nome: 'Cesta Simples 2kg',  peso: '2kg',  preco: 145.00, categoria: 'simples',  descricao: 'Seleção equilibrada de produtos para complementar sua despensa.', itens: itensBaseSimples(2) },
  { id: 3,  nome: 'Cesta Simples 3kg',  peso: '3kg',  preco: 170.00, categoria: 'simples',  descricao: 'Variedade de itens essenciais para abastecer sua família.', itens: itensBaseSimples(3) },
  { id: 4,  nome: 'Cesta Simples 4kg',  peso: '4kg',  preco: 190.00, categoria: 'simples',  descricao: 'Cesta bem montada para consumo semanal.', itens: itensBaseSimples(4) },
  { id: 5,  nome: 'Cesta Simples 5kg',  peso: '5kg',  preco: 210.00, categoria: 'simples',  descricao: 'Perfeita para famílias de até 3 pessoas.', itens: itensBaseSimples(5) },
  { id: 6,  nome: 'Cesta Simples 6kg',  peso: '6kg',  preco: 230.00, categoria: 'simples',  descricao: 'Abastecimento completo para a quinzena.', itens: itensBaseSimples(6) },
  { id: 7,  nome: 'Cesta Simples 7kg',  peso: '7kg',  preco: 250.00, categoria: 'simples',  descricao: 'Cesta reforçada com itens de limpeza inclusos.', itens: itensBaseSimples(7) },
  { id: 8,  nome: 'Cesta Simples 8kg',  peso: '8kg',  preco: 270.00, categoria: 'simples',  descricao: 'Ideal para famílias de 4 a 5 pessoas.', itens: itensBaseSimples(8) },
  { id: 9,  nome: 'Cesta Simples 9kg',  peso: '9kg',  preco: 290.00, categoria: 'simples',  descricao: 'Ampla variedade de produtos para abastecer bem.', itens: itensBaseSimples(9) },
  { id: 10, nome: 'Cesta Simples 10kg', peso: '10kg', preco: 310.00, categoria: 'simples',  descricao: 'Abastecimento mensal completo para sua família.', itens: itensBaseSimples(10) },
  { id: 11, nome: 'Cesta Simples 11kg', peso: '11kg', preco: 325.00, categoria: 'simples',  descricao: 'Nossa cesta simples mais completa. Tudo que você precisa.', itens: itensBaseSimples(11) },

  // ── CESTA COMPLETA (1kg–11kg) ────────────────────────────
  { id: 12, nome: 'Cesta Completa 1kg',  peso: '1kg',  preco: 160.00, categoria: 'completa', descricao: 'Cesta completa com maior variedade de produtos selecionados.', itens: itensBaseCompleta(1) },
  { id: 13, nome: 'Cesta Completa 2kg',  peso: '2kg',  preco: 180.00, categoria: 'completa', descricao: 'Mais itens, mais qualidade para o dia a dia da sua família.', itens: itensBaseCompleta(2) },
  { id: 14, nome: 'Cesta Completa 3kg',  peso: '3kg',  preco: 205.00, categoria: 'completa', descricao: 'Cesta reforçada com produtos de primeira linha.', itens: itensBaseCompleta(3) },
  { id: 15, nome: 'Cesta Completa 4kg',  peso: '4kg',  preco: 225.00, categoria: 'completa', descricao: 'Variedade premium para abastecer a semana toda.', itens: itensBaseCompleta(4) },
  { id: 16, nome: 'Cesta Completa 5kg',  peso: '5kg',  preco: 250.00, categoria: 'completa', descricao: 'Ideal para famílias que valorizam qualidade e variedade.', itens: itensBaseCompleta(5) },
  { id: 17, nome: 'Cesta Completa 6kg',  peso: '6kg',  preco: 265.00, categoria: 'completa', descricao: 'Cesta completa com produtos alimentícios e de higiene.', itens: itensBaseCompleta(6) },
  { id: 18, nome: 'Cesta Completa 7kg',  peso: '7kg',  preco: 285.00, categoria: 'completa', descricao: 'Abastecimento quinzenal com o melhor em qualidade.', itens: itensBaseCompleta(7) },
  { id: 19, nome: 'Cesta Completa 8kg',  peso: '8kg',  preco: 305.00, categoria: 'completa', descricao: 'Para famílias de 4 a 5 pessoas com mais exigência.', itens: itensBaseCompleta(8) },
  { id: 20, nome: 'Cesta Completa 9kg',  peso: '9kg',  preco: 320.00, categoria: 'completa', descricao: 'Ampla seleção dos melhores produtos do mercado.', itens: itensBaseCompleta(9) },
  { id: 21, nome: 'Cesta Completa 10kg', peso: '10kg', preco: 340.00, categoria: 'completa', descricao: 'Abastecimento mensal premium para toda a família.', itens: itensBaseCompleta(10) },
  { id: 22, nome: 'Cesta Completa 11kg', peso: '11kg', preco: 360.00, categoria: 'completa', descricao: 'A cesta completa mais robusta da RR Distribuidora.', itens: itensBaseCompleta(11) },

  // ── OUTRAS OPÇÕES ────────────────────────────────────────
  {
    id: 100, nome: 'Cesta Popular', peso: null, preco: 50.00, categoria: 'especial',
    descricao: 'Cesta acessível com os produtos mais essenciais para o dia a dia.',
    itens: [
      { nome: '1 Feijão',         categoria: 'alimento' },
      { nome: '1 Arroz',          categoria: 'alimento' },
      { nome: '1 Açúcar',         categoria: 'alimento' },
      { nome: '1 Sal',            categoria: 'alimento' },
      { nome: '1 Farinha',        categoria: 'alimento' },
      { nome: '1 Macarrão',       categoria: 'alimento' },
      { nome: '2 Flocão',         categoria: 'alimento' },
      { nome: '1 Bolacha Coquinho', categoria: 'alimento' },
      { nome: '1 Vinagre',        categoria: 'alimento' },
      { nome: '1 Suco em Pó',     categoria: 'alimento' },
      { nome: '1 Biscoito',       categoria: 'alimento' },
    ],
  },
  {
    id: 101, nome: 'Cesta Diferenciada', peso: null, preco: 260.00, categoria: 'especial',
    descricao: 'Cesta especial com produtos diferenciados e maior variedade.',
    itens: [
      { nome: '2 Feijão Mulatinho', categoria: 'alimento' },
      { nome: '2 Feijão Preto',     categoria: 'alimento' },
      { nome: '4 Arroz',            categoria: 'alimento' },
      { nome: '3 Açúcar',           categoria: 'alimento' },
      { nome: '4 Macarrão',         categoria: 'alimento' },
      { nome: '8 Flocão',           categoria: 'alimento' },
      { nome: '1 Farinha',          categoria: 'alimento' },
      { nome: '1 Sal',              categoria: 'alimento' },
      { nome: '2 Óleos',            categoria: 'alimento' },
      { nome: '2 Leites',           categoria: 'alimento' },
      { nome: '2 Sardinhas',        categoria: 'alimento' },
      { nome: '2 Bolachas',         categoria: 'alimento' },
      { nome: '3 Cafés',            categoria: 'alimento' },
      { nome: '1 Vinagre',          categoria: 'alimento' },
      { nome: '2 Margarinas',       categoria: 'alimento' },
      { nome: '2 Molhos',           categoria: 'alimento' },
      { nome: '1 Mortadela',        categoria: 'alimento' },
      { nome: '2 Charques',         categoria: 'alimento' },
      { nome: '1 Sabão em Pó',           categoria: 'limpeza' },
      { nome: '1 Detergente',            categoria: 'limpeza' },
      { nome: '1 Água Sanitária',        categoria: 'limpeza' },
      { nome: '1 Pct de Papel Higiênico', categoria: 'limpeza' },
      { nome: '1 Bombril',               categoria: 'limpeza' },
      { nome: '1 Sabão em Barra',        categoria: 'limpeza' },
      { nome: '1 Esponja de Prato',      categoria: 'limpeza' },
      { nome: '1 Creme Dental',   categoria: 'higiene' },
      { nome: '1 Sabonete',       categoria: 'higiene' },
    ],
  },
  { id: 102, nome: 'Cesta Montada',      peso: null, preco: 390.00, categoria: 'especial', descricao: 'Cesta montada com critério, qualidade em cada item escolhido.' },
  {
    id: 103, nome: 'Cesta Top RR', peso: null, preco: 410.00, categoria: 'especial',
    descricao: 'Nossa cesta premium. O máximo em qualidade e variedade da RR.',
    itens: [
      { nome: '4kg Feijão Mulatinho', categoria: 'alimento' },
      { nome: '4kg Feijão Preto',     categoria: 'alimento' },
      { nome: '10kg Arroz',           categoria: 'alimento' },
      { nome: '5kg Açúcar',           categoria: 'alimento' },
      { nome: '10 Pct Macarrão',      categoria: 'alimento' },
      { nome: '10 Pct Flocão',        categoria: 'alimento' },
      { nome: '2kg Farinha',          categoria: 'alimento' },
      { nome: '1kg Sal',              categoria: 'alimento' },
      { nome: '4 Pct Charque',        categoria: 'alimento' },
      { nome: '3 Óleos',              categoria: 'alimento' },
      { nome: '2 Leite',              categoria: 'alimento' },
      { nome: '3 Sardinha',           categoria: 'alimento' },
      { nome: '2 Bolacha',            categoria: 'alimento' },
      { nome: '4 Café',               categoria: 'alimento' },
      { nome: '2 Margarina',          categoria: 'alimento' },
      { nome: '2 Doce',               categoria: 'alimento' },
      { nome: '2 Extrato',            categoria: 'alimento' },
      { nome: '2 Mortadela',          categoria: 'alimento' },
      { nome: '1 Sabão em Pó',            categoria: 'limpeza' },
      { nome: '1 Detergente',             categoria: 'limpeza' },
      { nome: '1 Água Sanitária',         categoria: 'limpeza' },
      { nome: '1 Pct Papel Higiênico',    categoria: 'limpeza' },
      { nome: '1 Bombril',                categoria: 'limpeza' },
      { nome: '1 Sabão em Barra',         categoria: 'limpeza' },
      { nome: '1 Esponja de Prato',       categoria: 'limpeza' },
      { nome: '1 Creme Dental',    categoria: 'higiene' },
      { nome: '1 Sabonete',        categoria: 'higiene' },
    ],
  },
  {
    id: 104, nome: 'Cesta Doação 40', peso: null, preco: 40.00, categoria: 'especial',
    descricao: 'Cesta de doação com itens essenciais.',
    itens: [
      { nome: '1 Feijão',  categoria: 'alimento' },
      { nome: '1 Açúcar',  categoria: 'alimento' },
      { nome: '1 Arroz',   categoria: 'alimento' },
      { nome: '1 Sal',     categoria: 'alimento' },
      { nome: '1 Farinha', categoria: 'alimento' },
      { nome: '2 Flocão',  categoria: 'alimento' },
      { nome: '1 Macarrão', categoria: 'alimento' },
      { nome: '1 Molho',   categoria: 'alimento' },
    ],
  },
  {
    id: 105, nome: 'Cesta Doação 60', peso: null, preco: 60.00, categoria: 'especial',
    descricao: 'Cesta de doação com maior variedade de itens essenciais.',
    itens: [
      { nome: '1 Feijão',         categoria: 'alimento' },
      { nome: '1 Arroz',          categoria: 'alimento' },
      { nome: '1 Açúcar',         categoria: 'alimento' },
      { nome: '2 Flocão',         categoria: 'alimento' },
      { nome: '2 Macarrão',       categoria: 'alimento' },
      { nome: '1 Sal',            categoria: 'alimento' },
      { nome: '1 Farinha',        categoria: 'alimento' },
      { nome: '1 Bolacha',        categoria: 'alimento' },
      { nome: '1 Café',           categoria: 'alimento' },
      { nome: '1 Sardinha',       categoria: 'alimento' },
      { nome: '1 Biscoito',       categoria: 'alimento' },
      { nome: '1 Molho Tomate',   categoria: 'alimento' },
      { nome: '1 Suco em Pó',     categoria: 'alimento' },
    ],
  },
];

// ─── Itens disponíveis para personalização (cestas "Outras Opções") ──
// Mantido apenas para a Cesta Montada (id 102), que ainda não tem
// composição real definida. As demais cestas especiais já têm sua
// lista real em CESTAS[].itens.

const ITENS_DISPONIVEIS = [
  { id: 'arroz',        nome: 'Arroz 5kg',                   categoria: 'alimento' },
  { id: 'feijao',       nome: 'Feijão 1kg',                  categoria: 'alimento' },
  { id: 'acucar',       nome: 'Açúcar 2kg',                  categoria: 'alimento' },
  { id: 'sal',          nome: 'Sal 1kg',                     categoria: 'alimento' },
  { id: 'oleo',         nome: 'Óleo de Soja 900ml',          categoria: 'alimento' },
  { id: 'farinha',      nome: 'Farinha de Trigo 1kg',        categoria: 'alimento' },
  { id: 'macarrao',     nome: 'Macarrão 500g',               categoria: 'alimento' },
  { id: 'molho',        nome: 'Molho de Tomate 340g',        categoria: 'alimento' },
  { id: 'sardinha',     nome: 'Sardinha 125g',               categoria: 'alimento' },
  { id: 'cafe',         nome: 'Café 250g',                   categoria: 'alimento' },
  { id: 'biscoito',     nome: 'Biscoito Cream Cracker 400g', categoria: 'alimento' },
  { id: 'leite',        nome: 'Leite em Pó 400g',            categoria: 'alimento' },
  { id: 'achocolatado', nome: 'Achocolatado 400g',           categoria: 'alimento' },
  { id: 'sabao',        nome: 'Sabão em Pó 1kg',             categoria: 'limpeza'  },
  { id: 'amaciante',    nome: 'Amaciante 500ml',             categoria: 'limpeza'  },
  { id: 'detergente',   nome: 'Detergente 500ml',            categoria: 'limpeza'  },
  { id: 'papel',        nome: 'Papel Higiênico 4un',         categoria: 'limpeza'  },
  { id: 'creme',        nome: 'Creme Dental',                categoria: 'higiene'  },
  { id: 'sabonete',     nome: 'Sabonete',                    categoria: 'higiene'  },
];

// ─── Itens pré-selecionados da Cesta Montada (id 102) ────────
// Única cesta especial ainda sem composição real definida.

const ITENS_POR_PESO = {
  especial: {
    102: ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'amaciante', 'detergente', 'papel', 'creme', 'sabonete'],
  },
};

// ─── Helpers ─────────────────────────────────────────────────

function getCestaById(id) {
  return CESTAS.find(c => c.id === parseInt(id)) || null;
}

function getCestasByCategoria(categoria) {
  return CESTAS.filter(c => c.categoria === categoria);
}

// Retorna a lista de itens de uma cesta no formato { nome, categoria }.
// Cestas Simples/Completa (1–22) usam a composição real (cesta.itens).
// Cestas especiais (100–103) caem no catálogo genérico ITENS_DISPONIVEIS.
function getItensParaCesta(cestaId) {
  const cesta = getCestaById(cestaId);
  if (cesta && Array.isArray(cesta.itens)) return cesta.itens;

  const ids = (ITENS_POR_PESO.especial && ITENS_POR_PESO.especial[cestaId]) || [];
  return ids
    .map(id => ITENS_DISPONIVEIS.find(i => i.id === id))
    .filter(Boolean);
}

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
