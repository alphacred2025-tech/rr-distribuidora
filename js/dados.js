// ============================================================
// dados.js — RR Distribuidora
// Dados centrais: produtos, itens e helpers
// ============================================================

const WHATSAPP_NUMBER = '5581996206567';

// ─── Composição real das cestas (Simples e Completa) ──────────
// Baseado na lista oficial de itens por peso (1kg–11kg).
// Itens "kg/pct" escalam com o peso da cesta; itens unitários e o
// kit de limpeza são fixos (óleo dobra a partir da cesta de 11kg).

function itensBaseSimples(kg) {
  return [
    { nome: `Feijão ${kg}kg`,        categoria: 'alimento' },
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
  { id: 100, nome: 'Cesta Popular',      peso: null, preco: 100.00, categoria: 'especial', descricao: 'Cesta acessível com os produtos mais essenciais para o dia a dia.' },
  { id: 101, nome: 'Cesta Diferenciada', peso: null, preco: 260.00, categoria: 'especial', descricao: 'Cesta especial com produtos diferenciados e maior variedade.' },
  { id: 102, nome: 'Cesta Montada',      peso: null, preco: 390.00, categoria: 'especial', descricao: 'Cesta montada com critério, qualidade em cada item escolhido.' },
  { id: 103, nome: 'Cesta Top RR',       peso: null, preco: 410.00, categoria: 'especial', descricao: 'Nossa cesta premium. O máximo em qualidade e variedade da RR.' },
];

// ─── Itens disponíveis para personalização (cestas "Outras Opções") ──
// Mantido para as cestas especiais (100–103), que ainda não têm
// composição real definida.

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

// ─── Itens pré-selecionados das cestas especiais (100–103) ───
// As cestas Simples/Completa (1–22) já trazem sua composição real
// em CESTAS[].itens — esta tabela só cobre "Outras Opções".

const ITENS_POR_PESO = {
  especial: {
    100: ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'macarrao'],
    101: ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'detergente'],
    102: ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'amaciante', 'detergente', 'papel', 'creme', 'sabonete'],
    103: ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'amaciante', 'detergente', 'papel', 'creme', 'sabonete'],
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
