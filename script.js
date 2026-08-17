const catalogProducts = Object.freeze([
  {
    id: "biblia-naa-mulher-floral",
    slug: "biblia-naa-mulher-floral",
    nome: "Bíblia Sagrada NAA para Mulher — Capa Floral",
    categoria: "Bíblias Femininas",
    categoriaSlug: "biblias-femininas",
    imagem: "assets/products/biblia-naa-mulher-floral-normalized.webp",
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
    imagem: "assets/products/biblia-letra-extragigante-indice-preta-normalized.webp",
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
    imagem: "assets/products/biblia-letra-gigante-indice-couro-preta-normalized.webp",
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
    imagem: "assets/products/biblia-ara-mulher-branca-normalized.webp",
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
    imagem: "assets/products/biblia-arc-harpa-normalized.webp",
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
    imagem: "assets/products/biblia-pregador-pentecostal-normalized.webp",
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
    imagem: "assets/products/minha-primeira-biblia-meninos.webp",
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
    imagem: "assets/products/minha-primeira-biblia-meninas.webp",
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
    imagem: "assets/products/minha-primeira-biblia-palavras-ilustradas.webp",
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
    imagem: "assets/products/biblia-da-garotada.webp",
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
    imagem: "assets/products/minha-primeira-biblia-ilustrada.webp",
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
    imagem: "assets/products/livro-ate-que-nada-mais-importe.webp",
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
    imagem: "assets/products/livro-cartas-de-um-diabo.webp",
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
    imagem: "assets/products/livro-cristianismo-puro-e-simples.webp",
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
    imagem: "assets/products/livro-uma-vida-com-propositos.webp",
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
    imagem: "assets/products/livro-manso-e-humilde.webp",
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
    imagem: "assets/products/livro-o-deus-que-destroi-sonhos.webp",
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
    imagem: "assets/products/livro-oi-deus-sou-eu-de-novo.webp",
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
    imagem: "assets/products/livro-uma-mulher-segundo-coracao-de-deus.webp",
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
    imagem: "assets/products/livro-panorama-da-biblia.webp",
    descricao: "Visão geral dos livros bíblicos com recursos que apoiam a compreensão, o estudo e a leitura das Escrituras.",
    perfil: "Referência e estudo bíblico",
    autor: "CPAD",
    editora: "CPAD",
    ordemLivro: 6,
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
    imagem: "assets/products/livro-herois-da-fe.webp",
    descricao: "Biografias de homens e mulheres que marcaram a história cristã por sua fé, serviço e perseverança.",
    perfil: "Biografias e inspiração",
    autor: "Orlando Boyer",
    editora: "CPAD",
    ordemLivro: 1,
    maisVendidoLivro: true,
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
    imagem: "assets/products/livro-ego-transformado.webp",
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
    imagem: "assets/products/livro-uma-garota-segundo-coracao-de-deus.webp",
    descricao: "Leitura para garotas que desejam crescer na fé e aplicar princípios cristãos em sua rotina e seus relacionamentos.",
    perfil: "Garotas e crescimento cristão",
    autor: "Elizabeth George",
    editora: "CPAD",
    ordemLivro: 3,
    maisVendidoLivro: true,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "orando-a-palavra",
    slug: "orando-a-palavra",
    nome: "Orando a Palavra",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-orando-a-palavra.webp",
    descricao: "Uma seleção de ensinamentos sobre oração fundamentada nas Escrituras e na tradição cristã.",
    perfil: "Oração e vida cristã",
    autor: "C. H. Spurgeon, E. M. Bounds e R. A. Torrey",
    editora: "CPP",
    ordemLivro: 2,
    maisVendidoLivro: true,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "como-ter-o-coracao-de-maria-no-mundo-de-marta",
    slug: "como-ter-o-coracao-de-maria-no-mundo-de-marta",
    nome: "Como Ter o Coração de Maria no Mundo de Marta",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-como-coracao-maria-mundo-marta.webp",
    descricao: "Reflexões para conciliar responsabilidades, comunhão com Deus e uma vida espiritual intencional.",
    perfil: "Mulheres e vida cristã",
    autor: "Joanna Weaver",
    ordemLivro: 4,
    maisVendidoLivro: true,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "historia-dos-hebreus",
    slug: "historia-dos-hebreus",
    nome: "História dos Hebreus — Obra Completa",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-historia-dos-hebreus.webp",
    descricao: "Obra histórica de referência para compreender o povo hebreu e o contexto do mundo bíblico.",
    perfil: "História e referência",
    autor: "Flávio Josefo",
    ordemLivro: 5,
    maisVendidoLivro: true,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "pequena-enciclopedia-biblica",
    slug: "pequena-enciclopedia-biblica",
    nome: "Pequena Enciclopédia Bíblica",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-pequena-enciclopedia-biblica.webp",
    descricao: "Recurso de consulta para termos, personagens, lugares e temas relacionados às Escrituras.",
    perfil: "Referência bíblica",
    autor: "Orlando Boyer",
    editora: "CPAD",
    ordemLivro: 7,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "historia-eclesiastica",
    slug: "historia-eclesiastica",
    nome: "História Eclesiástica",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-historia-eclesiastica.webp",
    descricao: "Registro clássico sobre os primeiros séculos do cristianismo e a formação histórica da Igreja.",
    perfil: "História da Igreja",
    autor: "Eusébio de Cesareia",
    editora: "CPAD",
    ordemLivro: 8,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "declaracao-de-fe-atualizada",
    slug: "declaracao-de-fe-atualizada",
    nome: "Declaração de Fé — Atualizada",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-declaracao-fe-atualizada.webp",
    descricao: "Material de referência para estudo dos principais fundamentos doutrinários das Assembleias de Deus.",
    perfil: "Doutrina e formação",
    editora: "CPAD",
    ordemLivro: 9,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "cafe-com-as-mulheres-da-biblia",
    slug: "cafe-com-as-mulheres-da-biblia",
    nome: "Café com as Mulheres da Bíblia",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-cafe-mulheres-biblia.webp",
    descricao: "Leituras inspiradas em mulheres das Escrituras para reflexão, aprendizado e crescimento cristão.",
    perfil: "Mulheres e inspiração",
    autor: "Isabelle S. Alves",
    editora: "CPP",
    ordemLivro: 10,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "teologia-sistematica-herman-bavinck",
    slug: "teologia-sistematica-herman-bavinck",
    nome: "Teologia Sistemática — Volumes 1 e 2",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-teologia-sistematica-bavinck.webp",
    descricao: "Coleção para estudo aprofundado de doutrinas cristãs, revelação e conhecimento de Deus.",
    perfil: "Teologia sistemática",
    autor: "Herman Bavinck",
    editora: "Penkal",
    ordemLivro: 12,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "israel-gogue-e-o-anticristo",
    slug: "israel-gogue-e-o-anticristo",
    nome: "Israel, Gogue e o Anticristo",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-israel-gogue-anticristo.webp",
    descricao: "Estudo de temas escatológicos relacionados a Israel, às profecias e aos acontecimentos finais.",
    perfil: "Escatologia",
    autor: "Abraão de Almeida",
    editora: "CPAD",
    ordemLivro: 13,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "tempo-do-fim",
    slug: "tempo-do-fim",
    nome: "Tempo do Fim",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-tempo-do-fim.webp",
    descricao: "Uma introdução aos principais temas e interpretações relacionados à escatologia cristã.",
    perfil: "Escatologia e estudo",
    autor: "Juliano Fraga",
    editora: "CPAD",
    ordemLivro: 14,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "cafe-com-o-espirito-santo",
    slug: "cafe-com-o-espirito-santo",
    nome: "Café com o Espírito Santo",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-cafe-espirito-santo.webp",
    descricao: "Leituras para devoção, comunhão com Deus e fortalecimento da caminhada espiritual.",
    perfil: "Vida cristã e devoção",
    autor: "Charles Spurgeon",
    editora: "CPP",
    ordemLivro: 15,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "comentario-biblico-beacon-antigo-testamento",
    slug: "comentario-biblico-beacon-antigo-testamento",
    nome: "Comentário Bíblico Beacon — Antigo Testamento, 5 volumes",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-comentario-beacon.webp",
    descricao: "Coleção de comentários para estudo, ensino e preparação de mensagens sobre o Antigo Testamento.",
    perfil: "Comentário bíblico",
    editora: "CPAD",
    ordemLivro: 16,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "cute-jesus-and-disciples",
    slug: "cute-jesus-and-disciples",
    nome: "Cute Jesus & Disciples — Livro de Colorir",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-cute-jesus-disciples.webp",
    descricao: "Livro de atividades e colorir com temática cristã para momentos criativos em família.",
    perfil: "Infantil e atividades",
    editora: "CPP",
    ordemLivro: 17,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "os-presentes-do-espirito-santo",
    slug: "os-presentes-do-espirito-santo",
    nome: "Os Presentes do Espírito Santo",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-presentes-espirito-santo.webp",
    descricao: "Reflexões sobre os dons espirituais e sua importância para a vida e o serviço cristão.",
    perfil: "Espírito Santo e ministério",
    autor: "Charles Spurgeon e R. A. Torrey",
    editora: "Penkal",
    ordemLivro: 18,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "oracao-para-a-cura-emocional",
    slug: "oracao-para-a-cura-emocional",
    nome: "Oração para a Cura Emocional",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-oracao-cura-emocional.webp",
    descricao: "Uma leitura sobre oração, restauração interior e cuidado das emoções à luz da fé cristã.",
    perfil: "Oração e cuidado emocional",
    autor: "Charles Spurgeon",
    editora: "Penkal",
    ordemLivro: 19,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "conselhos-de-paulo-para-uma-vida-em-cristo",
    slug: "conselhos-de-paulo-para-uma-vida-em-cristo",
    nome: "Conselhos de Paulo para uma Vida em Cristo",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-conselhos-paulo-vida-cristo.webp",
    descricao: "Ensinamentos sobre maturidade, fé e práticas para uma vida cristã fundamentada nas cartas de Paulo.",
    perfil: "Vida cristã e formação",
    autor: "Charles Hodge",
    editora: "CPP",
    ordemLivro: 20,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "confissoes-santo-agostinho",
    slug: "confissoes-santo-agostinho",
    nome: "Confissões — Coleção volumes 1 e 2",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-confissoes-santo-agostinho.webp",
    descricao: "Clássico cristão sobre conversão, memória, graça e a busca por Deus.",
    perfil: "Clássico cristão e teologia",
    autor: "Santo Agostinho",
    editora: "CPP",
    ordemLivro: 21,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "comentario-exegetico-de-atos",
    slug: "comentario-exegetico-de-atos",
    nome: "Comentário Exegético de Atos — 4 volumes",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-comentario-exegetico-atos.webp",
    descricao: "Coleção de exegese aprofundada para pesquisa, ensino e preparação ministerial no livro de Atos.",
    perfil: "Exegese e ministério",
    autor: "Craig S. Keener",
    editora: "CPAD",
    ordemLivro: 22,
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: false,
    livroCristao: true
  },
  {
    id: "teologia-sistematica-stanley-horton",
    slug: "teologia-sistematica-stanley-horton",
    nome: "Teologia Sistemática — Uma Perspectiva Pentecostal",
    categoria: "Livros Cristãos",
    categoriaSlug: "livros-cristaos",
    imagem: "assets/products/livro-teologia-sistematica-stanley-horton.webp",
    descricao: "Obra de referência para o estudo organizado das doutrinas cristãs sob uma perspectiva pentecostal.",
    perfil: "Teologia sistemática",
    autor: "Stanley M. Horton",
    editora: "CPAD",
    ordemLivro: 23,
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
    imagens: [
      "assets/products/casa-balanca-digital-cozinha-10kg.webp",
      "assets/products/casa-balanca-digital-cozinha-10kg-frente.webp",
      "assets/products/casa-balanca-digital-cozinha-10kg-uso.webp"
    ],
    descricao: "Balança eletrônica branca com capacidade de até 10 kg, alta precisão e função tara para apoiar o preparo de receitas.",
    perfil: "Precisão no preparo",
    preco: 29.90,
    estoque: 5,
    testeCarrinho: true,
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
    imagens: [
      "assets/products/casa-bomba-eletrica-garrafa-agua.webp",
      "assets/products/casa-bomba-eletrica-garrafa-agua-frente.webp",
      "assets/products/casa-bomba-eletrica-garrafa-agua-detalhes.webp"
    ],
    descricao: "Bomba elétrica universal com recarga USB para servir água diretamente do garrafão com praticidade no dia a dia.",
    perfil: "Praticidade para o lar",
    marca: "Lotus",
    preco: 32.90,
    estoque: 5,
    testeCarrinho: true,
    destaque: false,
    maisVendido: false,
    casa: true
  }
]);

const inactiveCatalogSlugs = new Set([
  "ate-que-nada-mais-importe",
  "cartas-de-um-diabo-a-seu-aprendiz",
  "cristianismo-puro-e-simples",
  "uma-vida-com-propositos",
  "manso-e-humilde",
  "o-deus-que-destroi-sonhos",
  "oi-deus-sou-eu-de-novo",
  "uma-mulher-segundo-o-coracao-de-deus",
  "ego-transformado"
]);

const isProductActive = (product) => !inactiveCatalogSlugs.has(product.slug);

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
      ${product.maisVendidoLivro ? '<strong class="catalog-product-badge">Mais vendido</strong>' : ""}
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
renderProducts(
  "#featured-books",
  catalogProducts
    .filter((product) => product.maisVendidoLivro && isProductActive(product))
    .sort((first, second) => (first.ordemLivro ?? 999) - (second.ordemLivro ?? 999))
    .slice(0, 5)
);
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
    if (!isProductActive(product)) return false;
    const matchesCategory = filter === "todas"
      || (filter === "infantil" ? product.infantil : product.categoriaSlug === filter);
    const matchesCatalog = matchesCategory
      || (filter === "casa" && product.casa)
      || (filter === "fe" && faithCategorySlugs.has(product.categoriaSlug));
    const searchText = [product.nome, product.categoria, product.descricao, product.perfil, product.autor, product.editora, product.marca]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return matchesCatalog && (!normalizedQuery || searchText.includes(normalizedQuery));
  }).sort((first, second) => (first.ordemLivro ?? 999) - (second.ordemLivro ?? 999));

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
const productDialogQuantity = productDialogElement?.querySelector("#product-dialog-quantity");
const productDialogBookContent = productDialogElement?.querySelector("#product-dialog-book-content");
const productDialogSimpleContent = productDialogElement?.querySelector("#product-dialog-simple-content");
const productDialogPostcode = productDialogElement?.querySelector("#product-dialog-postcode");
const productDialogShippingButton = productDialogElement?.querySelector(".product-dialog-shipping-field button");
const productDialogShippingResults = document.createElement("div");
const productDialogShippingStatus = document.createElement("p");

productDialogShippingResults.className = "shipping-options product-dialog-shipping-results";
productDialogShippingStatus.className = "shipping-status";
productDialogShippingStatus.setAttribute("aria-live", "polite");
productDialogPostcode?.setAttribute("data-postcode-input", "");
productDialogElement?.querySelector(".product-dialog-shipping")?.append(
  productDialogShippingStatus,
  productDialogShippingResults
);

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const formatPostcode = (value) => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

const formatCurrency = (value) => Number(value).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const formatDeliveryTime = (value) => {
  const deliveryTime = String(value || "").trim();
  if (!deliveryTime) return "Prazo a confirmar";
  if (/dia/i.test(deliveryTime)) return deliveryTime;
  return `${deliveryTime} ${deliveryTime === "1" ? "dia útil" : "dias úteis"}`;
};

const requestShippingQuote = async (cep, itens) => {
  const normalizedCep = onlyDigits(cep);
  if (normalizedCep.length !== 8) throw new Error("Informe um CEP válido com 8 números.");

  let response;
  try {
    response = await fetch("/api/frete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep: normalizedCep, itens })
    });
  } catch {
    throw new Error("Não foi possível conectar ao cálculo de frete. Tente novamente.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Não foi possível calcular o frete.");
  return data;
};

const renderShippingServices = (container, services, { selectable = false, onSelect } = {}) => {
  container.replaceChildren();

  services.forEach((service, index) => {
    const option = document.createElement(selectable ? "label" : "article");
    option.className = "shipping-option";

    if (selectable) {
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "test-cart-shipping";
      input.value = String(index);
      input.addEventListener("change", () => onSelect?.(service, option));
      option.appendChild(input);
    }

    const copy = document.createElement("span");
    const title = document.createElement("strong");
    const deadline = document.createElement("small");
    const price = document.createElement("b");

    title.textContent = [service.carrier, service.description].filter(Boolean).join(" • ");
    deadline.textContent = formatDeliveryTime(service.deliveryTime);
    price.textContent = formatCurrency(service.price);
    copy.append(title, deadline);
    option.append(copy, price);
    container.appendChild(option);
  });
};

const calculateProductShipping = async () => {
  const slug = productDialogElement?.dataset.productSlug;
  const quantity = Number(productDialogQuantity?.textContent) || 1;
  if (!slug || !productDialogPostcode || !productDialogShippingButton) return;

  productDialogShippingButton.disabled = true;
  productDialogShippingStatus.textContent = "Consultando preços e prazos na Frenet…";
  productDialogShippingResults.replaceChildren();

  try {
    const quote = await requestShippingQuote(productDialogPostcode.value, [{ slug, quantity }]);
    productDialogShippingStatus.textContent = `${quote.services.length} ${quote.services.length === 1 ? "opção encontrada" : "opções encontradas"}.`;
    renderShippingServices(productDialogShippingResults, quote.services);
  } catch (error) {
    productDialogShippingStatus.textContent = error.message;
  } finally {
    productDialogShippingButton.disabled = false;
  }
};

const setProductDialogGallery = (product) => {
  const media = productDialogElement?.querySelector(".product-dialog-media");
  const mainImage = productDialogElement?.querySelector("#product-dialog-image");
  if (!media || !mainImage) return;

  media.querySelector(".product-dialog-thumbnails")?.remove();
  const images = Array.isArray(product.imagens) && product.imagens.length
    ? product.imagens
    : [product.imagem];

  mainImage.src = images[0];
  mainImage.alt = product.nome;
  if (images.length < 2) return;

  const thumbnails = document.createElement("div");
  thumbnails.className = "product-dialog-thumbnails";
  thumbnails.setAttribute("aria-label", `Fotos de ${product.nome}`);

  images.forEach((imageSource, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === 0 ? "is-active" : "";
    button.dataset.galleryImage = imageSource;
    button.setAttribute("aria-label", `Ver foto ${index + 1} de ${images.length}`);
    button.setAttribute("aria-pressed", String(index === 0));

    const thumbnail = document.createElement("img");
    thumbnail.src = imageSource;
    thumbnail.alt = "";
    thumbnail.loading = "lazy";
    button.appendChild(thumbnail);
    thumbnails.appendChild(button);
  });

  media.appendChild(thumbnails);
};

const setProductDialogText = (selector, value, fallback) => {
  const element = productDialogElement?.querySelector(selector);
  if (element) element.textContent = value || fallback;
};

const setProductDialogDetails = (product) => {
  const details = [
    product.autor ? { label: "Autor", value: product.autor } : null,
    product.editora ? { label: "Editora", value: product.editora } : null,
    product.marca ? { label: "Marca", value: product.marca } : null,
    { label: "Categoria", value: product.categoria },
    { label: "Indicação", value: product.perfil }
  ].filter(Boolean).slice(0, 4);

  productDialogElement?.querySelectorAll("[data-product-detail]").forEach((element, index) => {
    const detail = details[index];
    element.hidden = !detail;
    if (!detail) return;
    element.querySelector("[data-product-detail-label]").textContent = detail.label;
    element.querySelector("[data-product-detail-value]").textContent = detail.value;
  });
};

const setBookDialogUrl = (slug) => {
  const url = new URL(window.location.href);
  if (slug) {
    url.searchParams.set("produto", slug);
  } else {
    url.searchParams.delete("produto");
  }
  history.replaceState(null, "", url);
};

const closeProductDialog = () => {
  productDialogElement?.close();
  if (new URLSearchParams(window.location.search).has("produto")) setBookDialogUrl(null);
};

const openProductDialog = (slug, { syncUrl = true } = {}) => {
  const product = catalogProducts.find((item) => item.slug === slug && isProductActive(item));
  if (!product || !productDialogElement) return;

  const image = productDialogElement.querySelector("#product-dialog-image");
  const isChristianBook = product.categoriaSlug === "livros-cristaos";
  const isBible = product.categoriaSlug.startsWith("biblias");
  const usesFullDialog = isChristianBook || isBible || product.brinquedo || product.casa;
  productDialogElement.dataset.category = product.categoriaSlug;
  productDialogElement.dataset.productSlug = product.slug;
  setProductDialogGallery(product);
  productDialogElement.querySelector("#product-dialog-category").textContent =
    [product.categoria, product.autor || product.marca, product.editora].filter(Boolean).join(" • ");
  productDialogElement.querySelector("#product-dialog-title").textContent = product.nome;
  productDialogElement.querySelector("#product-dialog-description").textContent = product.descricao;
  productDialogElement.querySelector("#product-dialog-status").textContent = getProductStatus(product);
  setProductDialogText("#product-dialog-simple-status", getProductStatus(product), "Preço em breve");
  setProductDialogText("#product-dialog-author", product.autor || product.marca, "Não informado");
  setProductDialogText("#product-dialog-publisher", product.editora, "Não informada");
  setProductDialogText("#product-dialog-detail-category", product.categoria, "Não informada");
  setProductDialogText("#product-dialog-profile", product.perfil, "Não informada");
  setProductDialogDetails(product);

  if (productDialogBookContent && productDialogSimpleContent) {
    productDialogBookContent.hidden = !usesFullDialog;
    productDialogSimpleContent.hidden = usesFullDialog;
  }

  const badge = productDialogElement.querySelector("#product-dialog-badge");
  if (badge) {
    const isBestSeller = product.maisVendidoLivro || product.maisVendido;
    badge.hidden = !isBestSeller;
    badge.textContent = isBestSeller ? "Mais vendido" : "";
  }

  const hasPrice = typeof product.preco === "number";
  const hasStock = typeof product.estoque === "number";
  const canUseTestCart = product.testeCarrinho === true && hasPrice && hasStock && product.estoque > 0;
  const availability = hasPrice && hasStock
    ? product.estoque > 0
      ? `${product.estoque} ${product.estoque === 1 ? "unidade disponível" : "unidades disponíveis"} em estoque.`
      : "Produto indisponível no momento."
    : hasPrice
      ? "Preço cadastrado. Disponibilidade ainda não informada."
      : hasStock
        ? "Disponibilidade cadastrada. Preço ainda não informado."
        : "Preço e disponibilidade ainda não cadastrados.";
  setProductDialogText("#product-dialog-availability", availability, "Consulte disponibilidade.");
  setProductDialogText(
    ".product-dialog-activation-note",
    canUseTestCart
      ? "Carrinho piloto e cálculo de frete pela Frenet ativos. O pagamento ainda não está disponível."
      : "A compra será liberada após o cadastro do preço, estoque, frete e checkout.",
    "Checkout em preparação."
  );

  if (productDialogQuantity) productDialogQuantity.textContent = "1";
  productDialogElement.querySelectorAll("[data-quantity-action]").forEach((button) => {
    button.disabled = !canUseTestCart;
  });
  const addCartButton = productDialogElement.querySelector("#product-dialog-add-cart");
  if (addCartButton) addCartButton.disabled = !canUseTestCart;
  const buyNowButton = productDialogElement.querySelector("#product-dialog-buy-now");
  if (buyNowButton) buyNowButton.disabled = true;
  if (productDialogPostcode) {
    productDialogPostcode.disabled = !canUseTestCart;
    productDialogPostcode.value = "";
  }
  if (productDialogShippingButton) productDialogShippingButton.disabled = !canUseTestCart;
  productDialogShippingStatus.textContent = canUseTestCart ? "Informe o CEP para consultar a Frenet." : "";
  productDialogShippingResults.replaceChildren();

  if (typeof productDialogElement.showModal === "function") {
    if (!productDialogElement.open) productDialogElement.showModal();
  } else {
    productDialogElement.setAttribute("open", "");
  }

  if (usesFullDialog && syncUrl) setBookDialogUrl(product.slug);
};

document.addEventListener("click", (event) => {
  const productButton = event.target.closest("[data-product-slug]");
  if (productButton && productButton !== productDialogElement) {
    openProductDialog(productButton.dataset.productSlug);
  }

  const galleryButton = event.target.closest("[data-gallery-image]");
  if (galleryButton && productDialogElement) {
    const mainImage = productDialogElement.querySelector("#product-dialog-image");
    if (mainImage) mainImage.src = galleryButton.dataset.galleryImage;
    productDialogElement.querySelectorAll("[data-gallery-image]").forEach((button) => {
      const isActive = button === galleryButton;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  if (event.target.closest("[data-close-dialog]")) {
    closeProductDialog();
  }

  const quantityAction = event.target.closest("[data-quantity-action]");
  if (quantityAction && productDialogQuantity && !quantityAction.disabled) {
    const currentQuantity = Number(productDialogQuantity.textContent) || 1;
    const currentProduct = catalogProducts.find((product) => product.slug === productDialogElement?.dataset.productSlug);
    const stockLimit = typeof currentProduct?.estoque === "number" ? currentProduct.estoque : 1;
    const nextQuantity = quantityAction.dataset.quantityAction === "increase"
      ? Math.min(stockLimit, currentQuantity + 1)
      : Math.max(1, currentQuantity - 1);
    productDialogQuantity.textContent = String(nextQuantity);
    productDialogShippingResults.replaceChildren();
    productDialogShippingStatus.textContent = "Quantidade alterada. Calcule o frete novamente.";
  }

  const productShippingCalculate = event.target.closest(".product-dialog-shipping-field button");
  if (productShippingCalculate && !productShippingCalculate.disabled) {
    calculateProductShipping();
  }

  if (event.target === productDialogElement) {
    closeProductDialog();
  }
});

productDialogPostcode?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !productDialogShippingButton?.disabled) {
    event.preventDefault();
    calculateProductShipping();
  }
});

productDialogElement?.addEventListener("close", () => {
  if (new URLSearchParams(window.location.search).has("produto")) setBookDialogUrl(null);
});

const TEST_CART_STORAGE_KEY = "chi-rho-test-cart-v1";
const TEST_CART_SHIPPING_STORAGE_KEY = "chi-rho-test-shipping-v1";

const loadTestCart = () => {
  try {
    const storedCart = JSON.parse(localStorage.getItem(TEST_CART_STORAGE_KEY) || "[]");
    return Array.isArray(storedCart)
      ? storedCart.filter((item) => typeof item?.slug === "string" && Number.isInteger(item?.quantity))
      : [];
  } catch {
    return [];
  }
};

let testCart = loadTestCart();

const loadTestCartShipping = () => {
  try {
    const storedShipping = JSON.parse(sessionStorage.getItem(TEST_CART_SHIPPING_STORAGE_KEY) || "null");
    const service = storedShipping?.service;
    if (
      onlyDigits(storedShipping?.cep).length === 8
      && typeof service?.carrier === "string"
      && typeof service?.description === "string"
      && Number.isFinite(service?.price)
    ) {
      return { cep: onlyDigits(storedShipping.cep), service };
    }
  } catch {
    // Uma nova cotação será solicitada caso a sessão não esteja disponível.
  }
  return null;
};

const testCartDialog = document.createElement("dialog");
testCartDialog.className = "test-cart-dialog";
testCartDialog.id = "test-cart-dialog";
testCartDialog.setAttribute("aria-labelledby", "test-cart-title");
testCartDialog.innerHTML = `
  <div class="test-cart-layout">
    <header class="test-cart-header">
      <div>
        <span>Carrinho piloto</span>
        <h2 id="test-cart-title">Seu carrinho</h2>
      </div>
      <button type="button" data-cart-close aria-label="Fechar carrinho">×</button>
    </header>
    <div class="test-cart-items" aria-live="polite"></div>
    <footer class="test-cart-footer">
      <section class="test-cart-shipping" aria-labelledby="test-cart-shipping-title">
        <label id="test-cart-shipping-title" for="test-cart-postcode">Calcule o frete</label>
        <div class="test-cart-shipping-field">
          <input id="test-cart-postcode" data-postcode-input inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000" />
          <button type="button" data-cart-shipping-calculate>Calcular</button>
        </div>
        <p class="shipping-status" data-cart-shipping-status aria-live="polite">Informe o CEP de entrega.</p>
        <div class="shipping-options test-cart-shipping-options"></div>
      </section>
      <div class="test-cart-summary">
        <div><span>Produtos</span><strong data-cart-subtotal>R$ 0,00</strong></div>
        <div><span>Frete</span><strong data-cart-shipping-price>Calcule pelo CEP</strong></div>
        <div class="test-cart-total"><span>Total</span><strong data-cart-total>R$ 0,00</strong></div>
      </div>
      <button class="btn btn-primary" type="button" data-cart-checkout disabled>Finalizar compra</button>
      <small>Frete calculado pela Frenet. O pagamento será configurado na próxima etapa.</small>
    </footer>
  </div>
`;
document.body.appendChild(testCartDialog);

const storedCartShipping = loadTestCartShipping();
let selectedCartShipping = storedCartShipping?.service || null;
let selectedCartPostcode = storedCartShipping?.cep || "";
let testCartSubtotal = 0;

const saveCartShipping = () => {
  if (!selectedCartShipping || !selectedCartPostcode) return;
  try {
    sessionStorage.setItem(TEST_CART_SHIPPING_STORAGE_KEY, JSON.stringify({
      cep: selectedCartPostcode,
      service: selectedCartShipping
    }));
  } catch {
    // O checkout permanece disponível durante a navegação atual.
  }
};

const clearCartShipping = () => {
  selectedCartShipping = null;
  selectedCartPostcode = "";
  try {
    sessionStorage.removeItem(TEST_CART_SHIPPING_STORAGE_KEY);
  } catch {
    // A cotação continua sendo removida da memória desta página.
  }
};

const renderCartTotals = () => {
  const shippingPrice = selectedCartShipping?.price || 0;
  testCartDialog.querySelector("[data-cart-subtotal]").textContent = formatCurrency(testCartSubtotal);
  testCartDialog.querySelector("[data-cart-shipping-price]").textContent = selectedCartShipping
    ? formatCurrency(shippingPrice)
    : "Calcule pelo CEP";
  testCartDialog.querySelector("[data-cart-total]").textContent = formatCurrency(testCartSubtotal + shippingPrice);
  const checkoutButton = testCartDialog.querySelector("[data-cart-checkout]");
  if (checkoutButton) checkoutButton.disabled = testCartSubtotal <= 0 || !selectedCartShipping;
};

const resetCartShipping = (message = "Informe o CEP de entrega.") => {
  clearCartShipping();
  testCartDialog.querySelector(".test-cart-shipping-options").replaceChildren();
  testCartDialog.querySelector("[data-cart-shipping-status]").textContent = message;
  renderCartTotals();
};

const calculateCartShipping = async () => {
  const postcodeInput = testCartDialog.querySelector("#test-cart-postcode");
  const calculateButton = testCartDialog.querySelector("[data-cart-shipping-calculate]");
  const status = testCartDialog.querySelector("[data-cart-shipping-status]");
  const options = testCartDialog.querySelector(".test-cart-shipping-options");
  const itens = testCart.map((item) => ({ slug: item.slug, quantity: item.quantity }));

  if (itens.length === 0) {
    status.textContent = "Adicione um produto antes de calcular o frete.";
    return;
  }

  clearCartShipping();
  renderCartTotals();
  calculateButton.disabled = true;
  status.textContent = "Consultando preços e prazos na Frenet…";
  options.replaceChildren();

  try {
    const quote = await requestShippingQuote(postcodeInput.value, itens);
    status.textContent = "Escolha uma modalidade de entrega:";
    renderShippingServices(options, quote.services, {
      selectable: true,
      onSelect: (service, selectedOption) => {
        selectedCartShipping = service;
        selectedCartPostcode = onlyDigits(postcodeInput.value);
        saveCartShipping();
        options.querySelectorAll(".shipping-option").forEach((option) => {
          option.classList.toggle("is-selected", option === selectedOption);
        });
        renderCartTotals();
      }
    });
  } catch (error) {
    status.textContent = error.message;
  } finally {
    calculateButton.disabled = false;
  }
};

const saveTestCart = () => {
  try {
    localStorage.setItem(TEST_CART_STORAGE_KEY, JSON.stringify(testCart));
  } catch {
    // O carrinho continua funcionando nesta página mesmo sem armazenamento local.
  }
};

const getTestCartProduct = (slug) => catalogProducts.find((product) =>
  product.slug === slug
  && product.testeCarrinho === true
  && typeof product.preco === "number"
  && typeof product.estoque === "number"
);

const updateTestCartQuantity = (slug, requestedQuantity) => {
  const product = getTestCartProduct(slug);
  if (!product) return;

  const quantity = Math.max(0, Math.min(product.estoque, requestedQuantity));
  const existingItem = testCart.find((item) => item.slug === slug);

  if (quantity === 0) {
    testCart = testCart.filter((item) => item.slug !== slug);
  } else if (existingItem) {
    existingItem.quantity = quantity;
  } else {
    testCart.push({ slug, quantity });
  }

  saveTestCart();
  resetCartShipping("Carrinho alterado. Calcule o frete novamente.");
  renderTestCart();
};

const renderTestCart = () => {
  testCart = testCart
    .map((item) => {
      const product = getTestCartProduct(item.slug);
      if (!product) return null;
      return { slug: item.slug, quantity: Math.max(1, Math.min(product.estoque, item.quantity)) };
    })
    .filter(Boolean);

  const itemsElement = testCartDialog.querySelector(".test-cart-items");
  const validItems = testCart.map((item) => ({ ...item, product: getTestCartProduct(item.slug) }));
  const totalQuantity = validItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = validItems.reduce((total, item) => total + item.product.preco * item.quantity, 0);
  testCartSubtotal = subtotal;

  document.querySelectorAll('a[href$="#carrinho"]').forEach((link) => {
    let count = link.querySelector(".test-cart-count");
    if (!count) {
      count = document.createElement("strong");
      count.className = "test-cart-count";
      link.appendChild(count);
    }
    count.textContent = String(totalQuantity);
    count.hidden = totalQuantity === 0;
    link.setAttribute("aria-label", `Carrinho com ${totalQuantity} ${totalQuantity === 1 ? "item" : "itens"}`);
  });

  itemsElement.innerHTML = validItems.length
    ? validItems.map(({ product, quantity }) => `
      <article class="test-cart-item">
        <img src="${product.imagem}" alt="" />
        <div class="test-cart-item-copy">
          <small>${product.categoria}</small>
          <h3>${product.nome}</h3>
          <strong>${getProductStatus(product)}</strong>
          <div class="test-cart-item-controls" aria-label="Quantidade de ${product.nome}">
            <button type="button" data-cart-action="decrease" data-cart-slug="${product.slug}" aria-label="Diminuir quantidade">−</button>
            <output>${quantity}</output>
            <button type="button" data-cart-action="increase" data-cart-slug="${product.slug}" aria-label="Aumentar quantidade" ${quantity >= product.estoque ? "disabled" : ""}>+</button>
            <button class="test-cart-remove" type="button" data-cart-action="remove" data-cart-slug="${product.slug}">Remover</button>
          </div>
          <span>${product.estoque} unidades em estoque</span>
        </div>
      </article>
    `).join("")
    : '<div class="test-cart-empty"><strong>Seu carrinho está vazio.</strong><span>Adicione um dos itens de Casa disponíveis para o teste.</span></div>';

  const postcodeInput = testCartDialog.querySelector("#test-cart-postcode");
  const calculateButton = testCartDialog.querySelector("[data-cart-shipping-calculate]");
  const shippingStatus = testCartDialog.querySelector("[data-cart-shipping-status]");
  postcodeInput.disabled = validItems.length === 0;
  calculateButton.disabled = validItems.length === 0;
  if (validItems.length === 0) resetCartShipping("Adicione um produto antes de calcular o frete.");
  if (validItems.length > 0 && selectedCartShipping && selectedCartPostcode) {
    postcodeInput.value = formatPostcode(selectedCartPostcode);
    shippingStatus.textContent = `Frete selecionado: ${selectedCartShipping.carrier} • ${selectedCartShipping.description}.`;
  }
  renderCartTotals();
};

const openTestCart = () => {
  renderTestCart();
  if (typeof testCartDialog.showModal === "function") {
    if (!testCartDialog.open) testCartDialog.showModal();
  } else {
    testCartDialog.setAttribute("open", "");
  }
};

document.addEventListener("click", (event) => {
  const cartLink = event.target.closest('a[href$="#carrinho"]');
  if (cartLink) {
    event.preventDefault();
    openTestCart();
  }

  if (event.target.closest("[data-cart-close]")) testCartDialog.close();

  const addCartButton = event.target.closest("#product-dialog-add-cart");
  if (addCartButton && !addCartButton.disabled) {
    const slug = productDialogElement?.dataset.productSlug;
    const quantity = Number(productDialogQuantity?.textContent) || 1;
    const existingQuantity = testCart.find((item) => item.slug === slug)?.quantity || 0;
    if (slug) updateTestCartQuantity(slug, existingQuantity + quantity);
    closeProductDialog();
    openTestCart();
  }

  const cartAction = event.target.closest("[data-cart-action]");
  if (cartAction && !cartAction.disabled) {
    const slug = cartAction.dataset.cartSlug;
    const currentQuantity = testCart.find((item) => item.slug === slug)?.quantity || 0;
    const nextQuantity = cartAction.dataset.cartAction === "increase"
      ? currentQuantity + 1
      : cartAction.dataset.cartAction === "decrease"
        ? currentQuantity - 1
        : 0;
    updateTestCartQuantity(slug, nextQuantity);
  }

  const calculateShippingButton = event.target.closest("[data-cart-shipping-calculate]");
  if (calculateShippingButton && !calculateShippingButton.disabled) calculateCartShipping();

  const checkoutButton = event.target.closest("[data-cart-checkout]");
  if (checkoutButton && !checkoutButton.disabled) window.location.href = "checkout.html";

  if (event.target === testCartDialog) testCartDialog.close();
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-postcode-input]")) {
    event.target.value = formatPostcode(event.target.value);
    if (event.target.id === "test-cart-postcode" && selectedCartShipping) {
      resetCartShipping("CEP alterado. Calcule o frete novamente.");
    }
    if (event.target.id === "product-dialog-postcode" && productDialogShippingResults.childElementCount) {
      productDialogShippingResults.replaceChildren();
      productDialogShippingStatus.textContent = "CEP alterado. Calcule o frete novamente.";
    }
  }
});

testCartDialog.querySelector("#test-cart-postcode")?.addEventListener("keydown", (event) => {
  const calculateButton = testCartDialog.querySelector("[data-cart-shipping-calculate]");
  if (event.key === "Enter" && !calculateButton.disabled) {
    event.preventDefault();
    calculateCartShipping();
  }
});

renderTestCart();

const requestedProductSlug = new URLSearchParams(window.location.search).get("produto");
const legacyProductSlug = window.location.hash.length > 1 ? window.location.hash.slice(1) : "";
const initialProductSlug = requestedProductSlug || legacyProductSlug;
if (initialProductSlug && catalogProducts.some((product) => product.slug === initialProductSlug && isProductActive(product))) {
  window.addEventListener("load", () => openProductDialog(initialProductSlug, { syncUrl: false }), { once: true });
}
