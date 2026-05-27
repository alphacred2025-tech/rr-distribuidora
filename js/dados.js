// ============================================================
// dados.js — RR Distribuidora
// Dados centrais: produtos, itens e helpers
// ============================================================

const WHATSAPP_NUMBER = '5581996206567';

// ─── Catálogo de Cestas ──────────────────────────────────────

const CESTAS = [
  // ── CESTA SIMPLES (1kg–11kg) ─────────────────────────────
  { id: 1,  nome: 'Cesta Simples 1kg',  peso: '1kg',  preco: 133.00, categoria: 'simples',  descricao: 'Cesta básica essencial com os principais itens do dia a dia.' },
  { id: 2,  nome: 'Cesta Simples 2kg',  peso: '2kg',  preco: 145.00, categoria: 'simples',  descricao: 'Seleção equilibrada de produtos para complementar sua despensa.' },
  { id: 3,  nome: 'Cesta Simples 3kg',  peso: '3kg',  preco: 170.00, categoria: 'simples',  descricao: 'Variedade de itens essenciais para abastecer sua família.' },
  { id: 4,  nome: 'Cesta Simples 4kg',  peso: '4kg',  preco: 190.00, categoria: 'simples',  descricao: 'Cesta bem montada para consumo semanal.' },
  { id: 5,  nome: 'Cesta Simples 5kg',  peso: '5kg',  preco: 210.00, categoria: 'simples',  descricao: 'Perfeita para famílias de até 3 pessoas.' },
  { id: 6,  nome: 'Cesta Simples 6kg',  peso: '6kg',  preco: 230.00, categoria: 'simples',  descricao: 'Abastecimento completo para a quinzena.' },
  { id: 7,  nome: 'Cesta Simples 7kg',  peso: '7kg',  preco: 250.00, categoria: 'simples',  descricao: 'Cesta reforçada com itens de limpeza inclusos.' },
  { id: 8,  nome: 'Cesta Simples 8kg',  peso: '8kg',  preco: 270.00, categoria: 'simples',  descricao: 'Ideal para famílias de 4 a 5 pessoas.' },
  { id: 9,  nome: 'Cesta Simples 9kg',  peso: '9kg',  preco: 290.00, categoria: 'simples',  descricao: 'Ampla variedade de produtos para abastecer bem.' },
  { id: 10, nome: 'Cesta Simples 10kg', peso: '10kg', preco: 310.00, categoria: 'simples',  descricao: 'Abastecimento mensal completo para sua família.' },
  { id: 11, nome: 'Cesta Simples 11kg', peso: '11kg', preco: 325.00, categoria: 'simples',  descricao: 'Nossa cesta simples mais completa. Tudo que você precisa.' },

  // ── CESTA COMPLETA (1kg–11kg) ────────────────────────────
  { id: 12, nome: 'Cesta Completa 1kg',  peso: '1kg',  preco: 160.00, categoria: 'completa', descricao: 'Cesta completa com maior variedade de produtos selecionados.' },
  { id: 13, nome: 'Cesta Completa 2kg',  peso: '2kg',  preco: 180.00, categoria: 'completa', descricao: 'Mais itens, mais qualidade para o dia a dia da sua família.' },
  { id: 14, nome: 'Cesta Completa 3kg',  peso: '3kg',  preco: 205.00, categoria: 'completa', descricao: 'Cesta reforçada com produtos de primeira linha.' },
  { id: 15, nome: 'Cesta Completa 4kg',  peso: '4kg',  preco: 225.00, categoria: 'completa', descricao: 'Variedade premium para abastecer a semana toda.' },
  { id: 16, nome: 'Cesta Completa 5kg',  peso: '5kg',  preco: 250.00, categoria: 'completa', descricao: 'Ideal para famílias que valorizam qualidade e variedade.' },
  { id: 17, nome: 'Cesta Completa 6kg',  peso: '6kg',  preco: 265.00, categoria: 'completa', descricao: 'Cesta completa com produtos alimentícios e de higiene.' },
  { id: 18, nome: 'Cesta Completa 7kg',  peso: '7kg',  preco: 285.00, categoria: 'completa', descricao: 'Abastecimento quinzenal com o melhor em qualidade.' },
  { id: 19, nome: 'Cesta Completa 8kg',  peso: '8kg',  preco: 305.00, categoria: 'completa', descricao: 'Para famílias de 4 a 5 pessoas com mais exigência.' },
  { id: 20, nome: 'Cesta Completa 9kg',  peso: '9kg',  preco: 320.00, categoria: 'completa', descricao: 'Ampla seleção dos melhores produtos do mercado.' },
  { id: 21, nome: 'Cesta Completa 10kg', peso: '10kg', preco: 340.00, categoria: 'completa', descricao: 'Abastecimento mensal premium para toda a família.' },
  { id: 22, nome: 'Cesta Completa 11kg', peso: '11kg', preco: 360.00, categoria: 'completa', descricao: 'A cesta completa mais robusta da RR Distribuidora.' },

  // ── OUTRAS OPÇÕES ────────────────────────────────────────
  { id: 100, nome: 'Cesta Popular',      peso: null, preco: 100.00, categoria: 'especial', descricao: 'Cesta acessível com os produtos mais essenciais para o dia a dia.' },
  { id: 101, nome: 'Cesta Diferenciada', peso: null, preco: 260.00, categoria: 'especial', descricao: 'Cesta especial com produtos diferenciados e maior variedade.' },
  { id: 102, nome: 'Cesta Montada',      peso: null, preco: 390.00, categoria: 'especial', descricao: 'Cesta montada com critério, qualidade em cada item escolhido.' },
  { id: 103, nome: 'Cesta Top RR',       peso: null, preco: 410.00, categoria: 'especial', descricao: 'Nossa cesta premium. O máximo em qualidade e variedade da RR.' },
];

// ─── Itens disponíveis para personalização ───────────────────

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

// ─── Itens pré-selecionados por peso e categoria ─────────────
// 'simples' → itens básicos | 'completa' → maior variedade

const ITENS_POR_PESO = {
  simples: {
    1:  ['arroz', 'feijao', 'acucar'],
    2:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo'],
    3:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'macarrao', 'cafe'],
    4:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'cafe', 'detergente'],
    5:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'cafe', 'biscoito', 'detergente'],
    6:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'cafe', 'biscoito', 'leite', 'detergente', 'sabonete'],
    7:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'sabao', 'detergente', 'sabonete'],
    8:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'detergente', 'papel', 'sabonete'],
    9:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'amaciante', 'detergente', 'papel', 'sabonete'],
    10: ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'amaciante', 'detergente', 'papel', 'creme', 'sabonete'],
    11: ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'amaciante', 'detergente', 'papel', 'creme', 'sabonete'],
  },
  completa: {
    1:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo'],
    2:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'macarrao', 'cafe'],
    3:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'cafe', 'biscoito', 'detergente'],
    4:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'cafe', 'biscoito', 'leite', 'detergente', 'sabonete'],
    5:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'detergente', 'papel', 'sabonete'],
    6:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'detergente', 'papel', 'sabonete'],
    7:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'amaciante', 'detergente', 'papel', 'sabonete'],
    8:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'amaciante', 'detergente', 'papel', 'creme', 'sabonete'],
    9:  ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'amaciante', 'detergente', 'papel', 'creme', 'sabonete'],
    10: ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'amaciante', 'detergente', 'papel', 'creme', 'sabonete'],
    11: ['arroz', 'feijao', 'acucar', 'sal', 'oleo', 'farinha', 'macarrao', 'molho', 'sardinha', 'cafe', 'biscoito', 'leite', 'achocolatado', 'sabao', 'amaciante', 'detergente', 'papel', 'creme', 'sabonete'],
  },
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

function getItensParaCesta(cestaId) {
  const cesta = getCestaById(cestaId);
  if (!cesta) return [];
  const cat = cesta.categoria;
  const key = cat === 'especial' ? parseInt(cestaId) : parseInt(cesta.peso);
  return (ITENS_POR_PESO[cat] && ITENS_POR_PESO[cat][key]) || [];
}

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
