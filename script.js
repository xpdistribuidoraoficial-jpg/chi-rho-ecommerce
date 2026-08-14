const catalogProducts = Object.freeze([
  {
    id: "biblia-naa-mulher-floral",
    slug: "biblia-naa-mulher-floral",
    nome: "Bíblia Sagrada NAA para Mulher — Capa Floral",
    categoria: "Bíblias Femininas",
    categoriaSlug: "biblias-femininas",
    imagem: "assets/products/biblia-naa-mulher-floral.webp",
    descricao: "Edição feminina na tradução Nova Almeida Atualizada, com letra regular e capa dura floral.",
    perfil: "Feminina e presente",
    editora: "SBB",
    preco: null,
    estoque: null,
    destaque: true,
    maisVendido: false
  },
  {
    id: "biblia-letra-extragigante-indice-preta",
    slug: "biblia-letra-extragigante-indice-preta",
    nome: "Bíblia Sagrada Letra Extragigante com Índice",
    categoria: "Bíblias",
    categoriaSlug: "biblias",
    imagem: "assets/products/biblia-letra-extragigante-indice-preta.webp",
    descricao: "Letra extragigante, índice lateral e capa preta para uma leitura mais confortável e prática.",
    perfil: "Conforto de leitura",
    editora: "SBB",
    preco: null,
    estoque: null,
    destaque: true,
    maisVendido: true
  },
  {
    id: "biblia-media-letra-gigante-harpa",
    slug: "biblia-media-letra-gigante-harpa",
    nome: "Bíblia Sagrada Média Letra Gigante com Harpa Cristã",
    categoria: "Bíblias",
    categoriaSlug: "biblias",
    imagem: "assets/products/biblia-media-letra-gigante-harpa.webp",
    descricao: "Formato médio com letra gigante e Harpa Cristã, indicado para culto, leitura diária e devoção.",
    perfil: "Leitura e culto",
    preco: null,
    estoque: null,
    destaque: true,
    maisVendido: false
  },
  {
    id: "biblia-letra-gigante-indice-couro-preta",
    slug: "biblia-letra-gigante-indice-couro-preta",
    nome: "Bíblia Sagrada Letra Gigante com Índice — Capa Preta",
    categoria: "Bíblias",
    categoriaSlug: "biblias",
    imagem: "assets/products/biblia-letra-gigante-indice-couro-preta.webp",
    descricao: "Edição de letra gigante com índice digital e acabamento preto para leitura e uso frequente.",
    perfil: "Uso pessoal e presente",
    editora: "SBB",
    preco: null,
    estoque: null,
    destaque: true,
    maisVendido: false
  },
  {
    id: "biblia-ara-mulher-branca",
    slug: "biblia-ara-mulher-branca",
    nome: "Bíblia Sagrada ARA para Mulher — Letra Grande",
    categoria: "Bíblias Femininas",
    categoriaSlug: "biblias-femininas",
    imagem: "assets/products/biblia-ara-mulher-branca.webp",
    descricao: "Bíblia feminina na tradução Almeida Revista e Atualizada, com letra grande e capa branca.",
    perfil: "Leitura feminina e presente",
    editora: "SBB",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false
  },
  {
    id: "biblia-estudo-pentecostal",
    slug: "biblia-estudo-pentecostal",
    nome: "Bíblia de Estudo Pentecostal",
    categoria: "Bíblias de Estudo",
    categoriaSlug: "biblias-de-estudo",
    imagem: "assets/products/biblia-estudo-pentecostal-real.webp",
    descricao: "Conteúdo de estudo voltado à tradição pentecostal, liderança, ensino e vida ministerial.",
    perfil: "Estudo, liderança e ministério",
    editora: "CPAD",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: true
  },
  {
    id: "biblia-aplicacao-pessoal-nvt",
    slug: "biblia-aplicacao-pessoal-nvt",
    nome: "Bíblia de Estudo Aplicação Pessoal NVT",
    categoria: "Bíblias de Estudo",
    categoriaSlug: "biblias-de-estudo",
    imagem: "assets/products/biblia-aplicacao-pessoal-nvt.webp",
    descricao: "Edição de estudo com recursos de aplicação pessoal e texto na Nova Versão Transformadora.",
    perfil: "Vida cristã e aprofundamento",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: true
  },
  {
    id: "biblia-letra-gigante-indice-azul",
    slug: "biblia-letra-gigante-indice-azul",
    nome: "Bíblia Sagrada Letra Gigante com Índice — Azul",
    categoria: "Bíblias",
    categoriaSlug: "biblias",
    imagem: "assets/products/biblia-letra-gigante-indice-azul.webp",
    descricao: "Letra gigante, índice e acabamento azul em uma edição preparada para leitura confortável.",
    perfil: "Alto giro e presente",
    editora: "SBB",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: true
  },
  {
    id: "biblia-arc-harpa",
    slug: "biblia-arc-harpa",
    nome: "Bíblia Sagrada ARC com Harpa Cristã",
    categoria: "Bíblias",
    categoriaSlug: "biblias",
    imagem: "assets/products/biblia-arc-harpa.webp",
    descricao: "Texto na Almeida Revista e Corrigida acompanhado da Harpa Cristã para culto e devoção.",
    perfil: "Culto e leitura diária",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false
  },
  {
    id: "biblia-assembleia-de-deus-capa-luxo",
    slug: "biblia-assembleia-de-deus-capa-luxo",
    nome: "Bíblia Assembleia de Deus — Capa Luxo Preta",
    categoria: "Bíblias",
    categoriaSlug: "biblias",
    imagem: "assets/products/biblia-assembleia-de-deus-capa-luxo.webp",
    descricao: "Edição temática da Assembleia de Deus com acabamento preto e apresentação sóbria.",
    perfil: "Identidade e presente",
    editora: "CPAD",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false
  },
  {
    id: "biblia-estudo-cronologica",
    slug: "biblia-estudo-cronologica",
    nome: "Bíblia de Estudo Cronológica — Aplicação Pessoal",
    categoria: "Bíblias de Estudo",
    categoriaSlug: "biblias-de-estudo",
    imagem: "assets/products/biblia-estudo-cronologica.webp",
    descricao: "Recursos cronológicos e notas de aplicação pessoal para acompanhar a sequência histórica das Escrituras.",
    perfil: "Cronologia e estudo aprofundado",
    editora: "CPAD",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false
  },
  {
    id: "biblia-king-james-ultrafina-preta",
    slug: "biblia-king-james-ultrafina-preta",
    nome: "Bíblia King James 1611 Ultrafina — Preta",
    categoria: "Bíblias",
    categoriaSlug: "biblias",
    imagem: "assets/products/biblia-king-james-ultrafina-preta.webp",
    descricao: "Edição ultrafina da King James 1611, prática para transporte, leitura diária e presente.",
    perfil: "Jovem, moderna e portátil",
    editora: "BV Books",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: true
  },
  {
    id: "biblia-king-james-estudo-holman",
    slug: "biblia-king-james-estudo-holman",
    nome: "Bíblia King James de Estudo Holman",
    categoria: "Bíblias de Estudo",
    categoriaSlug: "biblias-de-estudo",
    imagem: "assets/products/biblia-king-james-estudo-holman.webp",
    descricao: "King James 1611 com recursos de estudo Holman para pesquisa, ensino e aprofundamento bíblico.",
    perfil: "Premium e teologia",
    editora: "BV Books",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: true
  },
  {
    id: "biblia-estudo-spurgeon",
    slug: "biblia-estudo-spurgeon",
    nome: "Bíblia de Estudo Spurgeon King James 1611",
    categoria: "Bíblias de Estudo",
    categoriaSlug: "biblias-de-estudo",
    imagem: "assets/products/biblia-estudo-spurgeon.webp",
    descricao: "Edição King James 1611 com recursos de Charles Spurgeon para estudo, sermões e reflexão.",
    perfil: "Pregação e aprofundamento",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false
  },
  {
    id: "biblia-pregador-pentecostal",
    slug: "biblia-pregador-pentecostal",
    nome: "Bíblia do Pregador Pentecostal com Índice",
    categoria: "Bíblias Ministeriais",
    categoriaSlug: "biblias-ministeriais",
    imagem: "assets/products/biblia-pregador-pentecostal.webp",
    descricao: "Recursos voltados à preparação de mensagens, pregação e rotina ministerial em edição com índice.",
    perfil: "Pastores, pregadores e líderes",
    editora: "SBB",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: true
  },
  {
    id: "biblia-estudo-defesa-da-fe",
    slug: "biblia-estudo-defesa-da-fe",
    nome: "Bíblia de Estudo em Defesa da Fé",
    categoria: "Bíblias de Estudo",
    categoriaSlug: "biblias-de-estudo",
    imagem: "assets/products/biblia-estudo-defesa-da-fe.webp",
    descricao: "Conteúdo de apologética cristã para estudo, ensino, liderança e defesa fundamentada da fé.",
    perfil: "Apologética e formação",
    editora: "CPAD",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false
  },
  {
    id: "minha-primeira-biblia-meninos",
    slug: "minha-primeira-biblia-meninos",
    nome: "Minha Primeira Bíblia — Meninos",
    categoria: "Bíblias Infantis",
    categoriaSlug: "biblias-infantis",
    imagem: "assets/products/minha-primeira-biblia-meninos.svg",
    descricao: "Edição infantil para apresentar histórias bíblicas em momentos de leitura compartilhada em família.",
    perfil: "Primeiro contato com a Bíblia",
    editora: "Ciranda Cultural",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    infantil: true
  },
  {
    id: "minha-primeira-biblia-meninas",
    slug: "minha-primeira-biblia-meninas",
    nome: "Minha Primeira Bíblia — Meninas",
    categoria: "Bíblias Infantis",
    categoriaSlug: "biblias-infantis",
    imagem: "assets/products/minha-primeira-biblia-meninas.svg",
    descricao: "Edição infantil para aproximar as crianças das histórias bíblicas com leitura acompanhada.",
    perfil: "Primeiro contato com a Bíblia",
    editora: "Ciranda Cultural",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    infantil: true
  },
  {
    id: "minha-primeira-biblia-palavras-ilustradas",
    slug: "minha-primeira-biblia-palavras-ilustradas",
    nome: "Minha Primeira Bíblia de Palavras Ilustradas",
    categoria: "Bíblias Infantis",
    categoriaSlug: "biblias-infantis",
    imagem: "assets/products/minha-primeira-biblia-palavras-ilustradas.svg",
    descricao: "Palavras e referências visuais para apoiar o contato inicial das crianças com narrativas bíblicas.",
    perfil: "Leitura visual em família",
    editora: "Ciranda Cultural",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    infantil: true
  },
  {
    id: "biblia-da-garotada",
    slug: "biblia-da-garotada",
    nome: "Bíblia da Garotada",
    categoria: "Bíblias Infantis",
    categoriaSlug: "biblias-infantis",
    imagem: "assets/products/biblia-da-garotada.svg",
    descricao: "Seleção de narrativas bíblicas apresentada para leitura infantil e momentos de aprendizado em família.",
    perfil: "Crianças e leitura em família",
    editora: "Todolivro",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    infantil: true
  },
  {
    id: "minha-primeira-biblia-ilustrada",
    slug: "minha-primeira-biblia-ilustrada",
    nome: "Minha Primeira Bíblia Ilustrada",
    categoria: "Bíblias Infantis",
    categoriaSlug: "biblias-infantis",
    imagem: "assets/products/minha-primeira-biblia-ilustrada.svg",
    descricao: "Histórias bíblicas ilustradas para leitura acompanhada e formação dos primeiros vínculos com a fé.",
    perfil: "Histórias bíblicas ilustradas",
    editora: "Ciranda Cultural",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    infantil: true
  },
  {
    id: "ate-que-nada-mais-importe",
    slug: "ate-que-nada-mais-importe",
    nome: "Até que Nada Mais Importe",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-ate-que-nada-mais-importe.svg",
    descricao: "Uma reflexão sobre viver uma fé centrada em Deus, além das aparências e do desempenho religioso.",
    perfil: "Vida cristã e propósito",
    autor: "Luciano Subirá",
    editora: "Hagnos",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "cartas-de-um-diabo-a-seu-aprendiz",
    slug: "cartas-de-um-diabo-a-seu-aprendiz",
    nome: "Cartas de um Diabo a Seu Aprendiz",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-cartas-de-um-diabo.svg",
    descricao: "Clássico de C. S. Lewis que explora tentações, escolhas e a vida espiritual por meio de uma narrativa singular.",
    perfil: "Clássico e reflexão",
    autor: "C. S. Lewis",
    editora: "Thomas Nelson Brasil",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "cristianismo-puro-e-simples",
    slug: "cristianismo-puro-e-simples",
    nome: "Cristianismo Puro e Simples",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-cristianismo-puro-e-simples.svg",
    descricao: "Uma apresentação clara dos fundamentos da fé cristã, escrita por um dos autores mais influentes do gênero.",
    perfil: "Fundamentos da fé",
    autor: "C. S. Lewis",
    editora: "Thomas Nelson Brasil",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "uma-vida-com-propositos",
    slug: "uma-vida-com-propositos",
    nome: "Uma Vida com Propósitos",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-uma-vida-com-propositos.svg",
    descricao: "Leitura orientada à descoberta de propósito, vocação e práticas para uma vida cristã intencional.",
    perfil: "Propósito e crescimento",
    autor: "Rick Warren",
    editora: "Vida",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "manso-e-humilde",
    slug: "manso-e-humilde",
    nome: "Manso e Humilde",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-manso-e-humilde.svg",
    descricao: "Uma leitura sobre o coração de Cristo e o acolhimento oferecido a pessoas cansadas e sobrecarregadas.",
    perfil: "Graça e vida espiritual",
    autor: "Dane Ortlund",
    editora: "Thomas Nelson Brasil",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "o-deus-que-destroi-sonhos",
    slug: "o-deus-que-destroi-sonhos",
    nome: "O Deus que Destrói Sonhos",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-o-deus-que-destroi-sonhos.svg",
    descricao: "Reflexões sobre discipulado, expectativas pessoais e a transformação de planos diante da vontade de Deus.",
    perfil: "Discipulado e transformação",
    autor: "Rodrigo Bibo",
    editora: "Thomas Nelson Brasil",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "oi-deus-sou-eu-de-novo",
    slug: "oi-deus-sou-eu-de-novo",
    nome: "Oi Deus, Sou Eu de Novo",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-oi-deus-sou-eu-de-novo.svg",
    descricao: "Leituras para momentos diários de oração, reflexão e renovação da caminhada com Deus.",
    perfil: "Devocional e oração",
    autor: "Deive Leonardo",
    editora: "Preach",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "uma-mulher-segundo-o-coracao-de-deus",
    slug: "uma-mulher-segundo-o-coracao-de-deus",
    nome: "Uma Mulher Segundo o Coração de Deus",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-uma-mulher-segundo-coracao-de-deus.svg",
    descricao: "Orientações para mulheres que desejam cultivar fé, relacionamentos e prioridades fundamentadas em princípios cristãos.",
    perfil: "Mulheres e vida cristã",
    autor: "Elizabeth George",
    editora: "Hagnos",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "panorama-da-biblia",
    slug: "panorama-da-biblia",
    nome: "Panorama da Bíblia",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-panorama-da-biblia.svg",
    descricao: "Visão geral dos livros bíblicos com recursos que apoiam a compreensão, o estudo e a leitura das Escrituras.",
    perfil: "Referência e estudo bíblico",
    autor: "CPAD",
    editora: "CPAD",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "herois-da-fe",
    slug: "herois-da-fe",
    nome: "Heróis da Fé",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-herois-da-fe.svg",
    descricao: "Biografias de homens e mulheres que marcaram a história cristã por sua fé, serviço e perseverança.",
    perfil: "Biografias e inspiração",
    autor: "Orlando Boyer",
    editora: "CPAD",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "ego-transformado",
    slug: "ego-transformado",
    nome: "Ego Transformado",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-ego-transformado.svg",
    descricao: "Uma abordagem breve sobre identidade, humildade e liberdade a partir do evangelho.",
    perfil: "Identidade e maturidade",
    autor: "Timothy Keller",
    editora: "Vida Nova",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "uma-garota-segundo-o-coracao-de-deus",
    slug: "uma-garota-segundo-o-coracao-de-deus",
    nome: "Uma Garota Segundo o Coração de Deus",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-uma-garota-segundo-coracao-de-deus.svg",
    descricao: "Leitura para garotas que desejam crescer na fé e aplicar princípios cristãos em sua rotina e seus relacionamentos.",
    perfil: "Garotas e crescimento cristão",
    autor: "Elizabeth George",
    editora: "CPAD",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "brinquedo-caminhao-bombeiro-resgate",
    slug: "brinquedo-caminhao-bombeiro-resgate",
    nome: "Caminhão de Bombeiro Resgate",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-caminhao-bombeiro-resgate.webp",
    descricao: "Caminhão de resgate com escada articulada para brincadeiras de ação, imaginação e faz de conta.",
    perfil: "Ação e imaginação",
    marca: "CS Imports",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: true,
    infantil: true,
    brinquedo: true
  },
  {
    id: "brinquedo-caminhao-bau-46cm",
    slug: "brinquedo-caminhao-bau-46cm",
    nome: "Caminhão Infantil Baú 46 cm",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-caminhao-bau-46cm.webp",
    descricao: "Caminhão de grande porte com baú e portas que abrem para ampliar as possibilidades da brincadeira.",
    perfil: "Transporte e faz de conta",
    marca: "Diverplas",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: true,
    infantil: true,
    brinquedo: true
  },
  {
    id: "brinquedo-caminhao-boi-4-bois",
    slug: "brinquedo-caminhao-boi-4-bois",
    nome: "Caminhão Boiadeiro com 4 Bois",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-caminhao-boi-4-bois.webp",
    descricao: "Miniatura de caminhão boiadeiro acompanhada de quatro animais para criar histórias e cenários rurais.",
    perfil: "Fazenda e imaginação",
    marca: "Diverplas",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: true,
    infantil: true,
    brinquedo: true
  },
  {
    id: "brinquedo-kit-caminhoes-basculantes",
    slug: "brinquedo-kit-caminhoes-basculantes",
    nome: "Kit com 3 Caminhões Basculantes",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-kit-caminhoes-basculantes.webp",
    descricao: "Conjunto com três caminhões basculantes para construir percursos, obras e brincadeiras compartilhadas.",
    perfil: "Construção e movimento",
    marca: "Diverplas",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: true,
    infantil: true,
    brinquedo: true
  },
  {
    id: "brinquedo-blocos-104-pecas",
    slug: "brinquedo-blocos-104-pecas",
    nome: "Balde de Blocos de Montar com 104 Peças",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-blocos-104-pecas.webp",
    descricao: "Blocos coloridos em balde para criar diferentes montagens e estimular criatividade e coordenação.",
    perfil: "Montagem e criatividade",
    marca: "Bloco Mania",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: false,
    infantil: true,
    brinquedo: true
  },
  {
    id: "brinquedo-caminhao-bombeiro-escada",
    slug: "brinquedo-caminhao-bombeiro-escada",
    nome: "Caminhão de Bombeiro com Escada Articulada",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-caminhao-bombeiro-escada.webp",
    descricao: "Veículo de bombeiro com escada móvel para missões de resgate e brincadeiras cheias de imaginação.",
    perfil: "Resgate e faz de conta",
    marca: "Diverplas",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: false,
    infantil: true,
    brinquedo: true
  },
  {
    id: "brinquedo-trator-pa-carregadeira",
    slug: "brinquedo-trator-pa-carregadeira",
    nome: "Trator Miniatura Pá Carregadeira",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-trator-pa-carregadeira.webp",
    descricao: "Trator articulado com pá carregadeira para criar obras, terrenos e novas aventuras.",
    perfil: "Construção e movimento",
    marca: "Diverplas",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: false,
    infantil: true,
    brinquedo: true
  },
  {
    id: "brinquedo-jeep-trilha",
    slug: "brinquedo-jeep-trilha",
    nome: "Caminhonete Jeep Trilha Off-Road",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-jeep-trilha.webp",
    descricao: "Jeep de trilha com visual aventureiro para percursos off-road e brincadeiras de exploração.",
    perfil: "Aventura e exploração",
    marca: "Diverplas",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: false,
    infantil: true,
    brinquedo: true
  },
  {
    id: "brinquedo-trator-grande-articulado",
    slug: "brinquedo-trator-grande-articulado",
    nome: "Trator Grande Articulado com Pá",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-trator-grande-articulado.webp",
    descricao: "Trator de grande porte com pá articulada e detalhes realistas para brincadeiras de campo e construção.",
    perfil: "Campo e construção",
    marca: "Diverplas",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: false,
    infantil: true,
    brinquedo: true
  },
  {
    id: "brinquedo-carreta-basculante-24cm",
    slug: "brinquedo-carreta-basculante-24cm",
    nome: "Carreta Basculante Articulada 24 cm",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-carreta-basculante-24cm.webp",
    descricao: "Carreta articulada com caçamba basculante para transportar cargas durante a brincadeira.",
    perfil: "Transporte e movimento",
    marca: "Diverplas",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: false,
    infantil: true,
    brinquedo: true
  },
  {
    id: "brinquedo-onibus-speed-bus",
    slug: "brinquedo-onibus-speed-bus",
    nome: "Ônibus Speed Bus",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-onibus-speed-bus.webp",
    descricao: "Ônibus com rodas livres e visual de viagem para criar trajetos, cidades e histórias.",
    perfil: "Cidade e faz de conta",
    marca: "Diverplas",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: false,
    infantil: true,
    brinquedo: true
  },
  {
    id: "brinquedo-kit-carretas-boiadeiro",
    slug: "brinquedo-kit-carretas-boiadeiro",
    nome: "Kit com 3 Carretas Boiadeiro e 12 Bois",
    categoria: "Brinquedos Infantis",
    categoriaSlug: "brinquedos-infantis",
    imagem: "assets/products/brinquedo-kit-carretas-boiadeiro.webp",
    descricao: "Conjunto de carretas boiadeiras com animais para brincadeiras em grupo e cenários de fazenda.",
    perfil: "Fazenda e brincadeira compartilhada",
    marca: "Diverplas",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: false,
    infantil: true,
    brinquedo: true
  },
  {
    id: "casa-balanca-digital-cozinha-10kg",
    slug: "casa-balanca-digital-cozinha-10kg",
    nome: "Balança Digital de Cozinha 10 kg",
    categoria: "Cozinha",
    categoriaSlug: "cozinha",
    imagem: "assets/products/casa-balanca-digital-cozinha-10kg.webp",
    descricao: "Balança eletrônica branca com capacidade de até 10 kg, alta precisão e função tara para apoiar o preparo de receitas.",
    perfil: "Precisão no preparo",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    casa: true
  },
  {
    id: "casa-bomba-eletrica-garrafa-agua",
    slug: "casa-bomba-eletrica-garrafa-agua",
    nome: "Bomba Elétrica USB para Garrafão de Água",
    categoria: "Utilidades Domésticas",
    categoriaSlug: "utilidades-domesticas",
    imagem: "assets/products/casa-bomba-eletrica-garrafa-agua.webp",
    descricao: "Bomba elétrica universal com recarga USB para servir água diretamente do garrafão com praticidade no dia a dia.",
    perfil: "Praticidade para o lar",
    marca: "Lotus",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    casa: true
  }
]);

const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-row");

if (toggle && nav) {
  toggle.addEventListener("click", () => nav.classList.toggle("open"));
}

document.querySelectorAll(".nav-row a").forEach((link) => {
  link.addEventListener("click", () => nav?.classList.remove("open"));
});

const getProductStatus = (product) => {
  if (typeof product.preco === "number") {
    return product.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return "Preço em breve";
};

const getProductMeta = (product) =>
  [product.autor || product.marca, product.editora].filter(Boolean).join(" • ");

const createProductCard = (product) => `
  <article class="catalog-product-card" id="${product.slug}" data-category="${product.categoriaSlug}">
    <div class="catalog-product-image">
      <img src="${product.imagem}" alt="${product.nome}" loading="lazy" />
      <span>${product.perfil}</span>
    </div>
    <div class="catalog-product-content">
      <small>${product.categoria}</small>
      <h3>${product.nome}</h3>
      ${getProductMeta(product) ? `<span class="catalog-product-meta">${getProductMeta(product)}</span>` : ""}
      <p>${product.descricao}</p>
      <strong>${getProductStatus(product)}</strong>
      <button type="button" data-product-slug="${product.slug}">Ver produto</button>
    </div>
  </article>
`;

const renderProducts = (selector, products) => {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = products.map(createProductCard).join("");
};

renderProducts("#featured-products", catalogProducts.filter((product) => product.destaque).slice(0, 4));
renderProducts("#popular-products", catalogProducts.filter((product) => product.maisVendido).slice(0, 4));
renderProducts("#children-products", catalogProducts.filter((product) => product.infantil).slice(0, 4));
renderProducts("#toy-products", catalogProducts.filter((product) => product.destaqueInfantil).slice(0, 4));

const catalogGrid = document.querySelector("#catalog-products");
const resultCount = document.querySelector("#catalog-result-count");
const catalogTitle = document.querySelector("#catalog-title");
const filterButtons = [...document.querySelectorAll(".catalog-filter")];
const faithCategorySlugs = new Set([
  "biblias",
  "biblias-de-estudo",
  "biblias-femininas",
  "biblias-masculinas",
  "biblias-ministeriais",
  "biblias-infantis",
  "livros-cristaos"
]);

const setCatalogFilter = (filter = "todas", query = "") => {
  if (!catalogGrid) return;

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filteredProducts = catalogProducts.filter((product) => {
    const matchesCategory = filter === "todas"
      || (filter === "infantil" ? product.infantil : product.categoriaSlug === filter);
    const matchesCatalog = matchesCategory
      || (filter === "casa" && product.casa)
      || (filter === "fe" && faithCategorySlugs.has(product.categoriaSlug));
    const searchText = [product.nome, product.categoria, product.descricao, product.perfil, product.autor, product.editora, product.marca]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return matchesCatalog && (!normalizedQuery || searchText.includes(normalizedQuery));
  });

  catalogGrid.innerHTML = filteredProducts.length
    ? filteredProducts.map(createProductCard).join("")
    : '<div class="catalog-empty"><strong>Nenhum item publicado nesta categoria.</strong><span>O catálogo está em expansão. Consulte novamente em breve.</span></div>';

  if (catalogTitle) {
    const filterTitles = {
      todas: "Bíblias e livros cristãos",
      fe: "Bíblias e livros cristãos",
      biblias: "Bíblias",
      "biblias-de-estudo": "Bíblias de Estudo",
      "biblias-femininas": "Bíblias Femininas",
      "biblias-masculinas": "Bíblias Masculinas",
      "biblias-ministeriais": "Bíblias Ministeriais",
      "biblias-infantis": "Bíblias Infantis",
      infantil: "Infantil",
      "brinquedos-infantis": "Brinquedos Infantis",
      casa: "Casa",
      cozinha: "Cozinha",
      "utilidades-domesticas": "Utilidades Domésticas",
      "livros-cristaos": "Livros Cristãos"
    };
    catalogTitle.textContent = filterTitles[filter] || "Catálogo de Fé";
  }

  if (resultCount) {
    const total = filteredProducts.length;
    resultCount.textContent = `${total} ${total === 1 ? "produto selecionado" : "produtos selecionados"}`;
  }

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
};

const catalogParams = new URLSearchParams(window.location.search);
const defaultCatalogCategory = document.body.dataset.defaultCategory || "todas";
const requestedCategory = catalogParams.get("categoria") || defaultCatalogCategory;
const requestedQuery = catalogParams.get("q") || "";

if (catalogGrid) {
  const knownFilters = new Set(["todas", ...filterButtons.map((button) => button.dataset.filter)]);
  setCatalogFilter(knownFilters.has(requestedCategory) ? requestedCategory : defaultCatalogCategory, requestedQuery);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setCatalogFilter(button.dataset.filter, requestedQuery);
    history.replaceState(null, "", button.dataset.filter === "todas" || button.dataset.filter === defaultCatalogCategory
      ? "#catalogo"
      : `?categoria=${encodeURIComponent(button.dataset.filter)}#catalogo`);
  });
});

document.querySelectorAll(".search").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = form.querySelector('input[type="search"]');
    const query = input?.value.trim();
    if (!query) return;

    if (catalogGrid) {
      setCatalogFilter(defaultCatalogCategory, query);
      history.replaceState(null, "", `?q=${encodeURIComponent(query)}#catalogo`);
      document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `catalogo-biblias.html?q=${encodeURIComponent(query)}#catalogo`;
    }
  });
});

const productDialogElement = document.querySelector("#product-dialog");

const openProductDialog = (slug) => {
  const product = catalogProducts.find((item) => item.slug === slug);
  if (!product || !productDialogElement) return;

  const image = productDialogElement.querySelector("#product-dialog-image");
  productDialogElement.dataset.category = product.categoriaSlug;
  image.src = product.imagem;
  image.alt = product.nome;
  productDialogElement.querySelector("#product-dialog-category").textContent =
    [product.categoria, product.autor || product.marca, product.editora].filter(Boolean).join(" • ");
  productDialogElement.querySelector("#product-dialog-title").textContent = product.nome;
  productDialogElement.querySelector("#product-dialog-description").textContent = product.descricao;
  productDialogElement.querySelector("#product-dialog-status").textContent = getProductStatus(product);

  if (typeof productDialogElement.showModal === "function") {
    productDialogElement.showModal();
  } else {
    productDialogElement.setAttribute("open", "");
  }
};

document.addEventListener("click", (event) => {
  const productButton = event.target.closest("[data-product-slug]");
  if (productButton) {
    openProductDialog(productButton.dataset.productSlug);
  }

  if (event.target.closest("[data-close-dialog]")) {
    productDialogElement?.close();
  }

  if (event.target === productDialogElement) {
    productDialogElement.close();
  }
});

if (window.location.hash.length > 1) {
  const productSlug = window.location.hash.slice(1);
  if (catalogProducts.some((product) => product.slug === productSlug)) {
    window.addEventListener("load", () => openProductDialog(productSlug), { once: true });
  }
}
