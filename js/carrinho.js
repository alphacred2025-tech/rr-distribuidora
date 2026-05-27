// ============================================================
// carrinho.js — RR Distribuidora
// Gerenciamento do carrinho via localStorage
// ============================================================

const STORAGE_KEY = 'rr_cart';

/**
 * Retorna o carrinho atual do localStorage.
 * @returns {Array} Array de itens do carrinho
 */
function getCart() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Erro ao ler carrinho:', e);
    return [];
  }
}

/**
 * Salva o carrinho no localStorage.
 * @param {Array} cart
 */
function saveCart(cart) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error('Erro ao salvar carrinho:', e);
  }
}

/**
 * Adiciona um item ao carrinho.
 * @param {object} cesta - Objeto da cesta
 * @param {string[]} itensSelecionados - Array com nomes/IDs dos itens selecionados
 * @param {number} quantidade - Quantidade
 */
function addToCart(cesta, itensSelecionados, quantidade) {
  const cart = getCart();
  const novoItem = {
    id: Date.now(), // ID único para o item do carrinho
    cestaId: cesta.id,
    nome: cesta.nome,
    peso: cesta.peso,
    preco: cesta.preco,
    itens: itensSelecionados,
    quantidade: parseInt(quantidade) || 1,
  };
  cart.push(novoItem);
  saveCart(cart);
  updateCartBadge();
  return novoItem;
}

/**
 * Remove um item do carrinho pelo índice.
 * @param {number} index - Índice do item no array do carrinho
 */
function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  updateCartBadge();
}

/**
 * Atualiza a quantidade de um item no carrinho.
 * @param {number} index
 * @param {number} novaQuantidade
 */
function updateQuantidade(index, novaQuantidade) {
  const cart = getCart();
  if (cart[index]) {
    cart[index].quantidade = Math.max(1, parseInt(novaQuantidade) || 1);
    saveCart(cart);
    updateCartBadge();
  }
}

/**
 * Limpa completamente o carrinho.
 */
function clearCart() {
  localStorage.removeItem(STORAGE_KEY);
  updateCartBadge();
}

/**
 * Retorna o total do carrinho.
 * @returns {number}
 */
function getTotal() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

/**
 * Retorna o número total de itens (considerando quantidades).
 * @returns {number}
 */
function getCartCount() {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantidade, 0);
}

/**
 * Atualiza o badge de contagem do carrinho no header.
 */
function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = getCartCount();
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

// Inicializa o badge ao carregar qualquer página
document.addEventListener('DOMContentLoaded', updateCartBadge);
