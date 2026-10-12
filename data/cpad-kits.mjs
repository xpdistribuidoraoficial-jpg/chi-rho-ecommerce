export const initialKits = [
  { slug: 'kit-cpad-leitura-crescimento', name: 'Kit Leitura e Crescimento',
    description: 'Panorama da Bíblia e Heróis da Fé: uma seleção para conhecer as Escrituras e crescer na caminhada cristã.',
    active: true, discount_percent: 30, components: [{ slug: 'panorama-da-biblia', quantity: 1 }, { slug: 'herois-da-fe', quantity: 1 }] },
  { slug: 'kit-cpad-estudo-palavra', name: 'Kit Estudo da Palavra',
    description: 'Bíblia de Estudo Pentecostal Preta, Luxo, Média e Comentário Bíblico Beacon — Antigo Testamento, 5 volumes.',
    active: true, discount_percent: 30, components: [{ slug: 'biblia-estudo-pentecostal', quantity: 1 }, { slug: 'comentario-biblico-beacon-antigo-testamento', quantity: 1 }] },
  { slug: 'kit-cpad-culto', name: 'Kit Culto', description: 'Bíblia CPAD sem Harpa incorporada e Harpa Cristã avulsa. Seleção em preparação.',
    active: false, discount_percent: 30, components: [{ slug: 'biblia-estudo-pentecostal', quantity: 1 }, { slug: 'harpa-crista-grande-luxo-preta', quantity: 1 }] }
];
