// A composição é confiável e compartilhada pela vitrine e pelo servidor.
// O kit reúne os preços avulsos vigentes com R$ 2,00 de desconto adicional.
export const casaKits = [
  {
    slug: 'kit-casa-fone-carregador',
    name: 'Kit Fone Bluetooth + Carregador USB-C',
    description: '1 fone Bluetooth preto com estojo e visor de bateria + 1 carregador rápido USB-C KAPBOM KA-5005 branco. Ganhe mais R$ 2,00 de desconto sobre a soma das ofertas individuais. Cabo vendido separadamente.',
    active: true,
    pricing_mode: 'sum_current_prices',
    discount_percent: 0,
    discount_amount: 2,
    components: [
      { slug: 'casa-fone-bluetooth-visor-bateria', quantity: 1 },
      { slug: 'casa-carregador-kapbom-ka-5005', quantity: 1 }
    ]
  }
];
