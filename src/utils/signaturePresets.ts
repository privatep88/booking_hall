export interface SignaturePreset {
  id: string;
  nameAr: string;
  nameEn: string;
  dataUrl: string;
}

const svgToDataUrl = (svg: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

export const SIGNATURE_PRESETS: SignaturePreset[] = [
  {
    id: 'sig-preparer-khalid',
    nameAr: 'توقيع خطي إلكتروني (إعداد - كحلي)',
    nameEn: 'Calligraphic Signature (Navy Blue)',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120">
        <g fill="none" stroke="#1e3a8a" stroke-linecap="round" stroke-linejoin="round">
          <!-- Fluid signature swooshes -->
          <path d="M40 75 Q60 25 85 45 T115 80 Q130 95 150 50 Q165 20 185 60 Q205 90 230 40 T270 55" stroke-width="3"/>
          <path d="M55 60 C80 50 140 45 220 50 C250 52 285 58 295 62" stroke-width="2.5"/>
          <path d="M70 85 Q110 95 160 88 T240 78 Q270 72 290 85" stroke-width="1.8"/>
          <!-- Flourish loops and dots -->
          <circle cx="100" cy="35" r="2.5" fill="#1e3a8a"/>
          <circle cx="180" cy="32" r="2.5" fill="#1e3a8a"/>
          <path d="M225 35 Q235 25 245 32" stroke-width="2"/>
          <path d="M45 88 Q140 108 280 82" stroke-width="2.2" stroke-dasharray="320" stroke-dashoffset="0"/>
        </g>
      </svg>
    `)
  },
  {
    id: 'sig-approver-executive',
    nameAr: 'توقيع واعتماد رسمي مع خاتم (أزرق ملكي)',
    nameEn: 'Executive Approval with Stamp (Royal Blue)',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 130" width="340" height="130">
        <defs>
          <filter id="stampBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
        <!-- Official Round Stamp -->
        <g transform="translate(240, 65) rotate(-8)" filter="url(#stampBlur)" opacity="0.88">
          <circle cx="0" cy="0" r="46" fill="none" stroke="#1d4ed8" stroke-width="2.5" stroke-dasharray="5 2"/>
          <circle cx="0" cy="0" r="41" fill="none" stroke="#1d4ed8" stroke-width="1.2"/>
          <circle cx="0" cy="0" r="28" fill="none" stroke="#1d4ed8" stroke-width="1"/>
          <text x="0" y="-12" text-anchor="middle" font-size="8" font-family="sans-serif" font-weight="900" fill="#1d4ed8" letter-spacing="1">معتمد رسمي</text>
          <text x="0" y="3" text-anchor="middle" font-size="7.5" font-family="sans-serif" font-weight="bold" fill="#1d4ed8">SAAED APPROVED</text>
          <text x="0" y="16" text-anchor="middle" font-size="8" font-family="sans-serif" font-weight="bold" fill="#1d4ed8">الإدارة التنفيذية</text>
        </g>
        <!-- Executive Signature Strokes -->
        <g fill="none" stroke="#0f172a" stroke-linecap="round" stroke-linejoin="round">
          <path d="M30 65 Q50 30 75 45 T105 85 Q135 110 160 40 Q180 15 200 65 Q215 95 240 45 T285 60" stroke-width="3.2"/>
          <path d="M45 52 C95 40 170 38 255 46 Q280 49 295 55" stroke-width="2.5"/>
          <path d="M35 78 Q110 95 185 85 T275 75" stroke-width="2"/>
          <path d="M70 30 Q90 18 105 28" stroke-width="2"/>
          <circle cx="150" cy="28" r="2.8" fill="#0f172a"/>
          <path d="M25 85 Q130 110 295 80" stroke-width="2.8"/>
        </g>
      </svg>
    `)
  },
  {
    id: 'sig-gold-executive',
    nameAr: 'توقيع تنفيذي مذهب (عنابي وذهبي)',
    nameEn: 'Executive Gold & Burgundy Signature',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120">
        <g fill="none" stroke="#991b1b" stroke-linecap="round" stroke-linejoin="round">
          <path d="M35 70 Q60 20 85 45 Q110 70 135 35 Q155 10 180 55 Q200 90 225 35 T270 50" stroke-width="3"/>
          <path d="M50 55 C90 42 160 40 240 46" stroke-width="2.2"/>
          <path d="M40 82 Q125 102 265 76" stroke-width="2.5"/>
          <circle cx="125" cy="25" r="2.5" fill="#991b1b"/>
          <circle cx="170" cy="22" r="2.5" fill="#991b1b"/>
        </g>
      </svg>
    `)
  }
];

export const DEFAULT_EXECUTIVE_SIGNATURES = {
  preparer: {
    title: 'إدارة تقنية المعلومات والخدمات',
    name: 'خالد الهاشمي',
    roleTitle: 'رئيس قسم إدارة المرافق والأنظمة',
    signatureUrl: SIGNATURE_PRESETS[0].dataUrl,
    date: ''
  },
  approver: {
    title: 'الإدارة التنفيذية',
    name: 'سعادة المهندس / المدير التنفيذي',
    roleTitle: 'الرئيس التنفيذي للعمليات',
    signatureUrl: SIGNATURE_PRESETS[1].dataUrl,
    date: ''
  }
};
