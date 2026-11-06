export interface AvatarPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'emirati' | 'formal';
  dataUrl: string;
}

const svgToDataUrl = (svg: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'emirati-ghutra-white',
    nameAr: 'زي إماراتي رسمي (غترة بيضاء وعقال)',
    nameEn: 'Emirati Formal (White Ghutra & Agal)',
    category: 'emirati',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
        <defs>
          <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e3a8a"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
          <linearGradient id="skin1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fed7aa"/>
            <stop offset="100%" stop-color="#fbcfe8"/>
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="64" fill="url(#bg1)"/>
        <!-- Body / Kandoora -->
        <path d="M28 128 C28 98 44 92 64 92 C84 92 100 98 100 128 Z" fill="#f8fafc"/>
        <path d="M64 92 L64 128" stroke="#cbd5e1" stroke-width="2"/>
        <!-- Neck -->
        <rect x="54" y="78" width="20" height="18" rx="4" fill="#fbcfe8"/>
        <!-- Head -->
        <ellipse cx="64" cy="58" rx="22" ry="26" fill="#fde047" opacity="0.1"/>
        <ellipse cx="64" cy="58" rx="20" ry="24" fill="#fed7aa"/>
        <!-- Ghutra Drape (White) -->
        <path d="M40 38 C32 48 30 70 32 98 C38 98 48 94 48 84 C48 74 44 60 44 46 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
        <path d="M88 38 C96 48 98 70 96 98 C90 98 80 94 80 84 C80 74 84 60 84 46 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
        <!-- Ghutra Top Head Cover -->
        <path d="M40 38 C40 22 52 16 64 16 C76 16 88 22 88 38 C88 44 80 46 64 46 C48 46 40 44 40 38 Z" fill="#ffffff"/>
        <!-- Agal (Black Dual Ring) -->
        <ellipse cx="64" cy="27" rx="24" ry="6" fill="none" stroke="#18181b" stroke-width="4.5"/>
        <ellipse cx="64" cy="31" rx="24" ry="6" fill="none" stroke="#27272a" stroke-width="3.5"/>
        <ellipse cx="64" cy="33" rx="22" ry="4" fill="none" stroke="#09090b" stroke-width="2"/>
        <!-- Face Features -->
        <circle cx="56" cy="54" r="2.5" fill="#1e293b"/>
        <circle cx="72" cy="54" r="2.5" fill="#1e293b"/>
        <!-- Beard / Neat Trim -->
        <path d="M50 56 C50 74 56 80 64 80 C72 80 78 74 78 56 C76 66 72 70 64 70 C56 70 52 66 50 56 Z" fill="#334155" opacity="0.8"/>
        <!-- Smile -->
        <path d="M59 64 Q64 68 69 64" stroke="#475569" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    id: 'emirati-shemagh-red',
    nameAr: 'زي إماراتي رسمي (شماغ أحمر وعقال)',
    nameEn: 'Emirati Formal (Red Shemagh & Agal)',
    category: 'emirati',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
        <defs>
          <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#334155"/>
          </linearGradient>
          <pattern id="shemaghPattern" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#ffffff"/>
            <path d="M0 0 L3 3 M3 3 L6 6 M6 0 L3 3 M3 3 L0 6" stroke="#dc2626" stroke-width="1.2"/>
          </pattern>
        </defs>
        <rect width="128" height="128" rx="64" fill="url(#bg2)"/>
        <!-- Body / Kandoora -->
        <path d="M26 128 C26 98 42 92 64 92 C86 92 102 98 102 128 Z" fill="#f8fafc"/>
        <rect x="54" y="78" width="20" height="18" rx="4" fill="#fed7aa"/>
        <!-- Head -->
        <ellipse cx="64" cy="58" rx="20" ry="24" fill="#fed7aa"/>
        <!-- Shemagh Drape Sides -->
        <path d="M38 36 C30 46 28 72 32 102 C38 102 48 96 48 86 C48 76 44 60 44 46 Z" fill="url(#shemaghPattern)" stroke="#b91c1c" stroke-width="1"/>
        <path d="M90 36 C98 46 100 72 96 102 C90 102 80 96 80 86 C80 76 84 60 84 46 Z" fill="url(#shemaghPattern)" stroke="#b91c1c" stroke-width="1"/>
        <!-- Shemagh Top -->
        <path d="M38 36 C38 20 50 14 64 14 C78 14 90 20 90 36 C90 42 80 44 64 44 C48 44 38 42 38 36 Z" fill="url(#shemaghPattern)"/>
        <!-- Agal -->
        <ellipse cx="64" cy="26" rx="25" ry="6" fill="none" stroke="#0f172a" stroke-width="5"/>
        <ellipse cx="64" cy="30" rx="25" ry="6" fill="none" stroke="#27272a" stroke-width="3.5"/>
        <!-- Face Features -->
        <circle cx="56" cy="54" r="2.5" fill="#1e293b"/>
        <circle cx="72" cy="54" r="2.5" fill="#1e293b"/>
        <!-- Mustache -->
        <path d="M54 64 Q64 68 74 64 Q64 61 54 64 Z" fill="#1e293b"/>
      </svg>
    `)
  },
  {
    id: 'emirati-shayla-female',
    nameAr: 'سيدة أعمال (شيلة وعباية رسمية)',
    nameEn: 'Business Leader (Shayla & Abaya)',
    category: 'emirati',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
        <defs>
          <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4338ca"/>
            <stop offset="100%" stop-color="#6366f1"/>
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="64" fill="url(#bg3)"/>
        <!-- Abaya Body -->
        <path d="M28 128 C28 96 44 88 64 88 C84 88 100 96 100 128 Z" fill="#0f172a"/>
        <!-- Gold Trim line on Abaya -->
        <path d="M64 88 L64 128" stroke="#f59e0b" stroke-width="2.5"/>
        <rect x="54" y="74" width="20" height="16" rx="4" fill="#fed7aa"/>
        <!-- Face Oval -->
        <ellipse cx="64" cy="58" rx="19" ry="23" fill="#fed7aa"/>
        <!-- Shayla Headwrap (Black with delicate navy shading) -->
        <path d="M36 34 C36 16 50 12 64 12 C78 12 92 16 92 34 C92 56 86 86 86 98 C78 98 74 88 74 76 C74 58 78 40 76 34 C74 28 66 26 64 26 C62 26 54 28 52 34 C50 40 54 58 54 76 C54 88 50 98 42 98 C42 86 36 56 36 34 Z" fill="#09090b"/>
        <!-- Face Eyes & Smile -->
        <ellipse cx="56" cy="53" rx="2.5" ry="2" fill="#0f172a"/>
        <ellipse cx="72" cy="53" rx="2.5" ry="2" fill="#0f172a"/>
        <path d="M52 48 Q56 46 60 48" stroke="#0f172a" stroke-width="1.5" fill="none"/>
        <path d="M68 48 Q72 46 76 48" stroke="#0f172a" stroke-width="1.5" fill="none"/>
        <path d="M59 66 Q64 70 69 66" stroke="#be185d" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    id: 'formal-suit-male-navy',
    nameAr: 'بدلة رسمية كحلية مع ربطة عنق',
    nameEn: 'Navy Executive Suit & Tie',
    category: 'formal',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
        <defs>
          <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#047857"/>
            <stop offset="100%" stop-color="#10b981"/>
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="64" fill="url(#bg4)"/>
        <!-- Suit Coat -->
        <path d="M26 128 C26 96 42 88 64 88 C86 88 102 96 102 128 Z" fill="#1e293b"/>
        <!-- White Shirt V -->
        <polygon points="64,88 50,128 78,128" fill="#ffffff"/>
        <!-- Tie -->
        <polygon points="64,90 61,96 64,120 67,96" fill="#2563eb"/>
        <!-- Suit Lapels -->
        <polygon points="42,88 56,128 46,128" fill="#0f172a"/>
        <polygon points="86,88 72,128 82,128" fill="#0f172a"/>
        <rect x="54" y="74" width="20" height="16" rx="4" fill="#fed7aa"/>
        <!-- Hair -->
        <path d="M42 42 C42 22 52 14 64 14 C76 14 86 22 86 42 C86 44 84 46 82 42 C78 26 50 26 46 42 Z" fill="#1e293b"/>
        <!-- Face -->
        <ellipse cx="64" cy="54" rx="19" ry="22" fill="#fed7aa"/>
        <!-- Eyes & Smile -->
        <circle cx="56" cy="51" r="2.2" fill="#0f172a"/>
        <circle cx="72" cy="51" r="2.2" fill="#0f172a"/>
        <path d="M59 62 Q64 66 69 62" stroke="#475569" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    id: 'formal-suit-female-leader',
    nameAr: 'بدلة تنفيذية رسمية مع قميص أنيق',
    nameEn: 'Executive Leader Suit',
    category: 'formal',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
        <defs>
          <linearGradient id="bg5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6d28d9"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="64" fill="url(#bg5)"/>
        <!-- Suit Jacket -->
        <path d="M26 128 C26 96 42 88 64 88 C86 88 102 96 102 128 Z" fill="#312e81"/>
        <!-- Inner Silk Blouse -->
        <polygon points="64,88 52,128 76,128" fill="#f8fafc"/>
        <rect x="54" y="74" width="20" height="16" rx="4" fill="#fed7aa"/>
        <!-- Hair Styled -->
        <path d="M38 48 C38 24 50 16 64 16 C78 16 90 24 90 48 C90 68 86 82 84 94 C76 86 76 68 76 56 C76 32 52 32 52 56 C52 68 52 86 44 94 C42 82 38 68 38 48 Z" fill="#451a03"/>
        <!-- Face -->
        <ellipse cx="64" cy="54" rx="18" ry="21" fill="#fed7aa"/>
        <circle cx="57" cy="51" r="2.2" fill="#1e293b"/>
        <circle cx="71" cy="51" r="2.2" fill="#1e293b"/>
        <path d="M60 63 Q64 66 68 63" stroke="#9f1239" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    id: 'formal-charcoal-executive',
    nameAr: 'بدلة فحمية مع قميص أبيض وربطة عنق عنابية',
    nameEn: 'Charcoal Suit & Burgundy Tie',
    category: 'formal',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
        <defs>
          <linearGradient id="bg6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#38bdf8"/>
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="64" fill="url(#bg6)"/>
        <!-- Suit Coat -->
        <path d="M26 128 C26 96 42 88 64 88 C86 88 102 96 102 128 Z" fill="#334155"/>
        <polygon points="64,88 50,128 78,128" fill="#ffffff"/>
        <!-- Burgundy Tie -->
        <polygon points="64,90 61,96 64,122 67,96" fill="#991b1b"/>
        <rect x="54" y="74" width="20" height="16" rx="4" fill="#fed7aa"/>
        <!-- Short Neat Hair -->
        <path d="M44 38 C44 20 52 14 64 14 C76 14 84 20 84 38 C84 42 82 44 80 40 C76 26 52 26 48 40 Z" fill="#0f172a"/>
        <ellipse cx="64" cy="54" rx="19" ry="22" fill="#fed7aa"/>
        <circle cx="56" cy="51" r="2.2" fill="#0f172a"/>
        <circle cx="72" cy="51" r="2.2" fill="#0f172a"/>
        <!-- Neat Glasses -->
        <rect x="50" y="47" width="11" height="8" rx="2" fill="none" stroke="#0284c7" stroke-width="1.5"/>
        <rect x="67" y="47" width="11" height="8" rx="2" fill="none" stroke="#0284c7" stroke-width="1.5"/>
        <line x1="61" y1="51" x2="67" y2="51" stroke="#0284c7" stroke-width="1.5"/>
        <path d="M59 64 Q64 68 69 64" stroke="#475569" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `)
  }
];
