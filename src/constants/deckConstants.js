export const CORES_DISPONIVEIS = [
  { nome: 'Azul', hex: '#0028B3', hue: 220 },
  { nome: 'Luz', hex: '#f1c40f', hue: 45 },
  { nome: 'Fogo', hex: '#e74c3c', hue: 0 },
  { nome: 'Água', hex: '#3498db', hue: 200 },
  { nome: 'Vento', hex: '#2ecc71', hue: 140 },
  { nome: 'Terra', hex: '#a0522d', hue: 30 },
  { nome: 'Divino', hex: '#ff8c00', hue: 30 },
];

export const FORMATOS_DECK = ['TCG', 'OCG', 'Goat'];

export const CARD_BACK_URL = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';

export const DECK_FORM_DEFAULT = {
  nome: '',
  descricao: '',
  formato: 'TCG',
  corTema: '#0028B3',
  capaCardId: null,
};
