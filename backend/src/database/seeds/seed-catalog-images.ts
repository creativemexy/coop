import { DataSource } from 'typeorm';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { BnplCatalogItem } from '../../modules/bnpl/entities/bnpl-catalog-item.entity';
import { BnplCatalogImage } from '../../modules/bnpl/entities/bnpl-catalog-image.entity';

const palette = [
  { bg: '#1a1a2e', fg: '#e94560', accent: '#0f3460' },
  { bg: '#16213e', fg: '#0f3460', accent: '#e94560' },
  { bg: '#0f3460', fg: '#e94560', accent: '#16213e' },
  { bg: '#533483', fg: '#e94560', accent: '#0f3460' },
  { bg: '#2d3436', fg: '#0984e3', accent: '#6c5ce7' },
  { bg: '#1e272e', fg: '#d2dae2', accent: '#0fbcf9' },
];

const icons: Record<string, string> = {
  'MacBook': `<path d="M5 5h20v12H5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 17L3 21h24l-2-4" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10" y="9" width="10" height="1" fill="currentColor"/><rect x="10" y="11" width="7" height="1" fill="currentColor"/>`,
  'iPhone': `<rect x="8" y="2" width="14" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="22" r="1.5" fill="currentColor"/><rect x="11" y="4" width="8" height="1" fill="currentColor"/>`,
  'Samsung': `<rect x="7" y="2" width="16" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="22" r="1.5" fill="currentColor"/><rect x="10" y="4" width="10" height="1" fill="currentColor"/>`,
  'Sony': `<ellipse cx="15" cy="15" rx="10" ry="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 15l4-3v6z" fill="currentColor"/><path d="M20 12l4 3-4 3z" fill="currentColor"/>`,
  'Dell': `<rect x="5" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 19L3 23h24l-2-4" fill="none" stroke="currentColor" stroke-width="2"/>`,
  'iPad': `<rect x="9" y="2" width="12" height="26" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="24" r="1" fill="currentColor"/>`,
};

function generateSvg(name: string, colorIdx: number): string {
  const colors = palette[colorIdx % palette.length];
  const icon = Object.entries(icons).find(([k]) => name.toLowerCase().includes(k.toLowerCase()))?.[1] ?? icons['iPhone'];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.bg}"/>
      <stop offset="100%" style="stop-color:${colors.accent}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  <g transform="translate(200,120)" color="${colors.fg}" stroke-linecap="round" stroke-linejoin="round">
    <g transform="scale(3) translate(-15,-13)">
      ${icon}
    </g>
  </g>
  <text x="200" y="220" font-family="system-ui,sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${name}</text>
  <text x="200" y="245" font-family="system-ui,sans-serif" font-size="13" fill="rgba(255,255,255,0.6)" text-anchor="middle">Coop BNPL</text>
  <g transform="translate(0,280)">
    <rect x="150" y="0" width="100" height="3" rx="1.5" fill="${colors.fg}" opacity="0.5"/>
  </g>
</svg>`;
}

export async function seedCatalogImages(dataSource: DataSource): Promise<void> {
  const catalogRepo = dataSource.getRepository(BnplCatalogItem);
  const imageRepo = dataSource.getRepository(BnplCatalogImage);

  const dir = join(process.cwd(), 'uploads', 'catalog-images');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const items = await catalogRepo.find({ where: { status: 'active' } });
  if (items.length === 0) {
    console.log('No catalog items found to seed images for');
    return;
  }

  let created = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const filename = `${slug}.svg`;
    const filePath = join(dir, filename);

    const svg = generateSvg(item.name, i);
    writeFileSync(filePath, svg, 'utf-8');

    const imageUrl = `/uploads/catalog-images/${filename}`;

    await catalogRepo.update(item.id, { imageUrl });

    const existing = await imageRepo.findOne({ where: { catalogItemId: item.id, url: imageUrl } });
    if (!existing) {
      await imageRepo.save(imageRepo.create({
        catalogItemId: item.id,
        url: imageUrl,
        sortOrder: 0,
      }));
    }

    created++;
    console.log(`  ${item.name} → ${imageUrl}`);
  }

  console.log(`\nSeeded ${created} catalog images`);
}
