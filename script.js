const bibleProducts = Object.freeze([
  {
    id: "biblia-letra-gigante-harpa",
    slug: "biblia-letra-gigante-harpa",
    nome: "Bíblia Sagrada Letra Gigante com Harpa",
    categoria: "Bíblias",
    categoriaSlug: "biblias",
    imagem: "assets/products/biblia-letra-gigante-harpa.svg",
    descricao: "Letra gigante e Harpa Cristã reunidas para leitura confortável, culto e devoção.",
    perfil: "Entrada e alto giro",
    preco: null,
    estoque: null,
    destaque: true,
    maisVendido: false
  },
  {
    id: "biblia-feminina",
    slug: "biblia-feminina",
    nome: "Bíblia Sagrada Feminina Letra Grande ou Gigante",
    categoria: "Bíblias Femininas",
    categoriaSlug: "biblias-femininas",
    imagem: "assets/products/biblia-feminina.svg",
    descricao: "Edição pensada para leitura diária, devoção pessoal e ocasiões de presente.",
    perfil: "Presente e uso pessoal",
    preco: null,
    estoque: null,
    destaque: true,
    maisVendido: false
  },
  {
    id: "biblia-masculina",
    slug: "biblia-masculina",
    nome: "Bíblia Sagrada Masculina Letra Gigante",
    categoria: "Bíblias Masculinas",
    categoriaSlug: "biblias-masculinas",
    imagem: "assets/products/biblia-masculina.svg",
    descricao: "Letra gigante e apresentação sóbria para leitura pessoal ou presente.",
    perfil: "Uso pessoal e presente",
    preco: null,
    estoque: null,
    destaque: true,
    maisVendido: false
  },
  {
    id: "biblia-nvi-slim",
    slug: "biblia-nvi-slim",
    nome: "Bíblia NVI Slim Luxo",
    categoria: "Bíblias",
    categoriaSlug: "biblias",
    imagem: "assets/products/biblia-nvi-slim.svg",
    descricao: "Edição slim em tradução NVI, com visual contemporâneo e formato prático.",
    perfil: "Jovem e moderna",
    preco: null,
    estoque: null,
    destaque: true,
    maisVendido: false
  },
  {
    id: "biblia-estudo-pentecostal",
    slug: "biblia-estudo-pentecostal",
    nome: "Bíblia de Estudo Pentecostal",
    categoria: "Bíblias de Estudo",
    categoriaSlug: "biblias-de-estudo",
    imagem: "assets/products/biblia-estudo-pentecostal.svg",
    descricao: "Conteúdo de estudo voltado à tradição pentecostal, liderança e ministério.",
    perfil: "Estudo, liderança e ministério",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: true
  },
  {
    id: "biblia-pregador",
    slug: "biblia-pregador",
    nome: "Bíblia do Pregador ou Pregadora",
    categoria: "Bíblias Ministeriais",
    categoriaSlug: "biblias-ministeriais",
    imagem: "assets/products/biblia-pregador.svg",
    descricao: "Apoio para preparação de mensagens, pregação e rotina ministerial.",
    perfil: "Pastores, pregadores e líderes",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: true
  },
  {
    id: "biblia-naa-estudo",
    slug: "biblia-naa-estudo",
    nome: "Bíblia de Estudo NAA",
    categoria: "Bíblias de Estudo",
    categoriaSlug: "biblias-de-estudo",
    imagem: "assets/products/biblia-naa-estudo.svg",
    descricao: "Recursos de estudo aliados à clareza da tradução Nova Almeida Atualizada.",
    perfil: "Estudo e aprofundamento",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: true
  },
  {
    id: "biblia-king-james-estudo",
    slug: "biblia-king-james-estudo",
    nome: "Bíblia King James de Estudo",
    categoria: "Bíblias de Estudo",
    categoriaSlug: "biblias-de-estudo",
    imagem: "assets/products/biblia-king-james-estudo.svg",
    descricao: "Edição de estudo na tradução King James para leitura aprofundada.",
    perfil: "Estudo e leitura aprofundada",
    preco: null,
    estoque: null,
    destaque: false,
    maisVendido: true
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

const createProductCard = (product) => `
  <article class="catalog-product-card" id="${product.slug}" data-category="${product.categoriaSlug}">
    <div class="catalog-product-image">
      <img src="${product.imagem}" alt="Imagem ilustrativa de ${product.nome}" loading="lazy" />
      <span>${product.perfil}</span>
    </div>
    <div class="catalog-product-content">
      <small>${product.categoria}</small>
      <h3>${product.nome}</h3>
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

renderProducts("#featured-products", bibleProducts.filter((product) => product.destaque).slice(0, 4));
renderProducts("#popular-products", bibleProducts.filter((product) => product.maisVendido).slice(0, 4));
renderProducts("#children-products", bibleProducts.filter((product) => product.infantil).slice(0, 4));

const catalogGrid = document.querySelector("#catalog-products");
const resultCount = document.querySelector("#catalog-result-count");
const filterButtons = [...document.querySelectorAll(".catalog-filter")];

const setCatalogFilter = (filter = "todas", query = "") => {
  if (!catalogGrid) return;

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filteredProducts = bibleProducts.filter((product) => {
    const matchesCategory = filter === "todas" || product.categoriaSlug === filter;
    const searchText = [product.nome, product.categoria, product.descricao, product.perfil]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return matchesCategory && (!normalizedQuery || searchText.includes(normalizedQuery));
  });

  catalogGrid.innerHTML = filteredProducts.length
    ? filteredProducts.map(createProductCard).join("")
    : '<div class="catalog-empty"><strong>Nenhum item publicado nesta categoria.</strong><span>O catálogo está em expansão. Consulte novamente em breve.</span></div>';

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
const requestedCategory = catalogParams.get("categoria") || "todas";
const requestedQuery = catalogParams.get("q") || "";

if (catalogGrid) {
  const knownFilters = new Set(["todas", ...filterButtons.map((button) => button.dataset.filter)]);
  setCatalogFilter(knownFilters.has(requestedCategory) ? requestedCategory : "todas", requestedQuery);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setCatalogFilter(button.dataset.filter, requestedQuery);
    history.replaceState(null, "", button.dataset.filter === "todas"
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
      setCatalogFilter("todas", query);
      history.replaceState(null, "", `?q=${encodeURIComponent(query)}#catalogo`);
      document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `catalogo-biblias.html?q=${encodeURIComponent(query)}#catalogo`;
    }
  });
});

const productDialogElement = document.querySelector("#product-dialog");

const openProductDialog = (slug) => {
  const product = bibleProducts.find((item) => item.slug === slug);
  if (!product || !productDialogElement) return;

  const image = productDialogElement.querySelector("#product-dialog-image");
  image.src = product.imagem;
  image.alt = `Imagem ilustrativa de ${product.nome}`;
  productDialogElement.querySelector("#product-dialog-category").textContent = product.categoria;
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
  if (bibleProducts.some((product) => product.slug === productSlug)) {
    window.addEventListener("load", () => openProductDialog(productSlug), { once: true });
  }
}
