import { kitListPrice } from '../data/cpad-kit-list-prices.mjs';

export const cents = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error('INVALID_PRICE');
  return Math.round(number * 100);
};
const quantity = (value) => {
  if (!Number.isInteger(value) || value < 1 || value > 99) throw new Error('INVALID_ITEMS');
  return value;
};
export function validateKit(kit, inventory) {
  const currentPriceKit = kit?.slug?.startsWith('kit-casa-')
    && kit.pricing_mode === 'sum_current_prices' && kit.discount_percent === 0
    && Number.isFinite(kit.discount_amount ?? 0) && (kit.discount_amount ?? 0) >= 0;
  const cpadKit = kit?.discount_percent === 30 && kit.pricing_mode === undefined;
  if (!kit || !/^[a-z0-9-]{3,100}$/.test(kit.slug) || typeof kit.name !== 'string' || kit.name.length > 120
    || (!currentPriceKit && !cpadKit) || !Array.isArray(kit.components) || kit.components.length < 2 || kit.components.length > 6
    || new Set(kit.components.map((item) => item.slug)).size !== kit.components.length) throw new Error('INVALID_KIT');
  kit.components.forEach((item) => {
    quantity(item.quantity);
    if (!inventory[item.slug]) throw new Error('KIT_COMPONENT_UNAVAILABLE');
  });
  return kit;
}
export function kitSummary(kit, inventory) {
  validateKit(kit, inventory);
  const sumCurrentPrices = kit.pricing_mode === 'sum_current_prices';
  const originalCents = kit.components.reduce((sum, item) => sum + cents(sumCurrentPrices
    ? inventory[item.slug].price : kitListPrice(item.slug)) * item.quantity, 0);
  if (originalCents <= 0) throw new Error('INVALID_PRICE');
  const priceCents = sumCurrentPrices ? originalCents - cents(kit.discount_amount ?? 0) : Math.round(originalCents * 70 / 100);
  if (priceCents <= 0) throw new Error('INVALID_DISCOUNT');
  const avulsoCents = kit.components.reduce((sum, item) => sum + cents(inventory[item.slug].price) * item.quantity, 0);
  if (priceCents > avulsoCents) throw new Error('KIT_PRICE_ABOVE_AVULSO');
  const stock = Math.min(...kit.components.map((item) => Math.floor(inventory[item.slug].stock / item.quantity)));
  return { original: originalCents / 100, price: priceCents / 100, discount: (originalCents - priceCents) / 100,
    stock: kit.active ? Math.max(0, stock) : 0 };
}
export function priceCart(cart, inventory, kits = []) {
  if (!Array.isArray(cart) || !cart.length || cart.length > 30) throw new Error('INVALID_ITEMS');
  const registry = new Map(kits.map((kit) => [kit.slug, kit]));
  const used = new Map(), annotations = new Map(), lines = [], snapshots = [];
  let subtotalCents = 0, discountCents = 0;
  let referenceSubtotalCents = 0, referenceDiscountCents = 0;
  const use = (slug, amount, annotation) => {
    const product = inventory[slug];
    if (!product || cents(product.price) <= 0) throw new Error('INVALID_ITEMS');
    used.set(slug, (used.get(slug) || 0) + amount);
    if (annotation) annotations.set(slug, [...new Set([...(annotations.get(slug) || []), annotation])]);
  };
  for (const line of cart) {
    const count = quantity(line?.quantity);
    const kit = registry.get(line?.slug);
    if (kit) {
      if (!kit.active) throw new Error('KIT_INACTIVE');
      const summary = kitSummary(kit, inventory);
      const avulsoCents = kit.components.reduce((sum, item) => sum + cents(inventory[item.slug].price) * item.quantity, 0);
      // O pedido guarda itens avulsos a preço vigente; o desconto financeiro deve conciliar com eles.
      // A vitrine mostra o benefício comercial sobre o preço cheio, registrado separadamente.
      subtotalCents += avulsoCents * count;
      discountCents += (avulsoCents - cents(summary.price)) * count;
      referenceSubtotalCents += cents(summary.original) * count;
      referenceDiscountCents += cents(summary.discount) * count;
      const components = kit.components.map((item) => {
        use(item.slug, item.quantity * count, `${kit.name} × ${count}`);
        return { slug: item.slug, name: inventory[item.slug].name, quantity: item.quantity,
          unit_price: inventory[item.slug].price };
      });
      snapshots.push({ slug: kit.slug, name: kit.name, quantity: count, discount_percent: kit.discount_percent,
        ...(kit.pricing_mode ? { pricing_mode: kit.pricing_mode, discount_amount: kit.discount_amount ?? 0 } : {}),
        original_unit_total: summary.original, unit_total: summary.price, components });
      lines.push({ slug: kit.slug, quantity: count, price: summary.price, original: summary.original, discount: summary.discount });
    } else {
      use(line?.slug, count);
      subtotalCents += cents(inventory[line.slug].price) * count;
      referenceSubtotalCents += cents(inventory[line.slug].price) * count;
      lines.push({ slug: line.slug, quantity: count, price: inventory[line.slug].price, original: inventory[line.slug].price, discount: 0 });
    }
  }
  if (used.size > 30) throw new Error('INVALID_ITEMS');
  const items = [...used].map(([slug, count]) => {
    const product = inventory[slug];
    if (!Number.isInteger(product.stock) || count > product.stock || count > 99) throw new Error('OUT_OF_STOCK');
    const notes = annotations.get(slug);
    return { slug, quantity: count, sku: product.sku, name: notes ? `${product.name} — ${notes.join('; ')}` : product.name,
      category: product.category, unit_price: cents(product.price) / 100 };
  });
  return { items, lines, kits: snapshots, subtotal: subtotalCents / 100, discount: discountCents / 100,
    totalProducts: (subtotalCents - discountCents) / 100,
    referenceSubtotal: referenceSubtotalCents / 100, referenceDiscount: referenceDiscountCents / 100 };
}
// Mercado Pago receives positive, cent-exact amounts. A line may contain several physical units.
export function paymentItems(items, discount = 0) {
  const amounts = items.map((item) => cents(item.unit_price) * quantity(Number(item.quantity)));
  const total = amounts.reduce((sum, value) => sum + value, 0), deduction = cents(discount);
  if (!total || deduction >= total) throw new Error('INVALID_DISCOUNT');
  if (!deduction) return items.map((item) => ({ id: item.sku, title: item.product_name || item.name,
    quantity: Number(item.quantity), unit_price: cents(item.unit_price) / 100, currency_id: 'BRL' }));
  const net = total - deduction;
  const allocated = amounts.map((amount, index) => ({ index, value: Math.floor(amount * net / total), fraction: amount * net % total }));
  const rest = net - allocated.reduce((sum, item) => sum + item.value, 0);
  [...allocated].sort((a, b) => b.fraction - a.fraction || a.index - b.index).slice(0, rest).forEach((item) => item.value++);
  if (allocated.some((item) => item.value < 1)) throw new Error('INVALID_DISCOUNT');
  return allocated.map(({ index, value }) => ({ id: items[index].sku,
    title: `${items[index].product_name || items[index].name} (${items[index].quantity} un.)`.slice(0, 120),
    quantity: 1, unit_price: value / 100, currency_id: 'BRL' }));
}
