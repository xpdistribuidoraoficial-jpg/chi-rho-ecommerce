export const COMPANY = Object.freeze({
  brandName: 'CHI RHO',
  legalName: 'P S PERINI CHI RHO CASA E LIVROS',
  cnpj: '42.300.391/0001-00',
  taxId: '42300391000100',
  responsible: 'Paulo Perini',
  phone: '+5521996241324',
  phoneDisplay: '(21) 99624-1324',
  address: Object.freeze({
    streetAddress: 'Rua Bento Siqueira, 668, LT 6, CS 7',
    addressLocality: 'São João de Meriti',
    addressRegion: 'RJ',
    postalCode: '25525-660',
    addressCountry: 'BR'
  })
});

export const COMPANY_ADDRESS_DISPLAY = `${COMPANY.address.streetAddress} — ${COMPANY.address.addressLocality}/${COMPANY.address.addressRegion} — CEP ${COMPANY.address.postalCode}`;
