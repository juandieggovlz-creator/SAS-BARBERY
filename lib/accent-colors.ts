// ──────────────────────────────────────────────────────────
//  BarberOS – Accent Color Palette (4 options, no black)
// ──────────────────────────────────────────────────────────

export interface AccentColor {
  id: string
  name: string
  hex: string
  r: number
  g: number
  b: number
  /** Texto legible sobre el fondo de acento (negro o blanco) */
  contrastText: string
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: 'amber',
    name: 'Dorado Luxury',
    hex: '#F59E0B',
    r: 245,
    g: 158,
    b: 11,
    contrastText: '#000000',
  },
  {
    id: 'blue',
    name: 'Azul Real',
    hex: '#2563EB',
    r: 37,
    g: 99,
    b: 235,
    contrastText: '#ffffff',
  },
  {
    id: 'green',
    name: 'Verde Esmeralda',
    hex: '#10B981',
    r: 16,
    g: 185,
    b: 129,
    contrastText: '#000000',
  },
  {
    id: 'red',
    name: 'Rojo Imperial',
    hex: '#EF4444',
    r: 239,
    g: 68,
    b: 68,
    contrastText: '#ffffff',
  },
]

export const DEFAULT_ACCENT = ACCENT_COLORS[0] // Dorado Luxury

export function getAccentById(id: string): AccentColor {
  return ACCENT_COLORS.find((c) => c.id === id) ?? DEFAULT_ACCENT
}

const HEX_ALIASES: Record<string, string> = {
  '#d4af37': '#F59E0B',
  '#16a34a': '#10B981',
  '#dc2626': '#EF4444',
  '#2563eb': '#2563EB',
}

export function getAccentByHex(hex: string): AccentColor {
  const normalized = HEX_ALIASES[hex.toLowerCase()] || hex
  return ACCENT_COLORS.find((c) => c.hex.toLowerCase() === normalized.toLowerCase()) ?? DEFAULT_ACCENT
}

export function buildAccentCSS(c: AccentColor): string {
  const { r, g, b } = c
  const main    = `rgb(${r},${g},${b})`
  const dark1   = `rgb(${Math.round(r * 0.82)},${Math.round(g * 0.82)},${Math.round(b * 0.82)})`
  const dark2   = `rgb(${Math.round(r * 0.67)},${Math.round(g * 0.67)},${Math.round(b * 0.67)})`
  const light1  = `rgba(${r},${g},${b},0.10)`
  const light2  = `rgba(${r},${g},${b},0.20)`
  const op15    = `rgba(${r},${g},${b},0.15)`
  const op30    = `rgba(${r},${g},${b},0.30)`
  const op60    = `rgba(${r},${g},${b},0.60)`
  const contrast = c.contrastText

  // IMPORTANT: ALL overrides are SCOPED to [data-panel="owner"] so they never
  // bleed into the marketing landing, login, or public booking pages.
  // CSS vars are also scoped — the landing/login use hardcoded Tailwind classes
  // and the globals.css :root defaults (amber), not these dynamic vars.
  const S = '[data-panel="owner"]' // scope selector

  return `
/* ── BarberOS Accent Color Override (fully panel-scoped) ── */
${S} {
  --accent: ${main};
  --accent-dark: ${dark1};
  --accent-darker: ${dark2};
  --accent-light: ${light1};
  --accent-lighter: ${light2};
  --accent-op15: ${op15};
  --accent-op30: ${op30};
  --accent-op60: ${op60};
  --accent-contrast: ${contrast};
  --accent-hover: ${dark1};
  --sidebar-active-bg: ${main};
  --sidebar-active-text: ${contrast};
}
html.dark ${S} {
  --accent: ${main};
  --accent-dark: ${dark1};
  --accent-darker: ${dark2};
  --accent-light: ${light1};
  --accent-lighter: ${light2};
  --accent-op15: ${op15};
  --accent-op30: ${op30};
  --accent-op60: ${op60};
  --accent-contrast: ${contrast};
  --accent-hover: ${dark1};
  --sidebar-active-bg: ${main};
  --sidebar-active-text: ${contrast};
}

/* ─── text ─── */
${S} .text-amber-200,${S} .dark .dark\\:text-amber-200{color:${main}!important}
${S} .text-amber-300,${S} .dark .dark\\:text-amber-300{color:${main}!important}
${S} .text-amber-400,${S} .dark .dark\\:text-amber-400{color:${main}!important}
${S} .text-amber-500,${S} .dark .dark\\:text-amber-500{color:${main}!important}
${S} .text-amber-600,${S} .dark .dark\\:text-amber-600{color:${dark1}!important}
${S} .text-amber-700,${S} .dark .dark\\:text-amber-700{color:${dark2}!important}
${S} .text-amber-800,${S} .dark .dark\\:text-amber-800{color:${dark2}!important}
${S} .text-amber-900,${S} .dark .dark\\:text-amber-900{color:${dark2}!important}
${S} .group:hover .group-hover\\:text-amber-400,${S} .group:hover .dark\\:group-hover\\:text-amber-400{color:${main}!important}
${S} .group\\/client:hover .group-hover\\/client\\:text-amber-600{color:${main}!important}
${S} .hover\\:text-amber-400:hover,${S} .dark .dark\\:hover\\:text-amber-400:hover{color:${main}!important}
${S} .hover\\:text-amber-600:hover{color:${dark1}!important}

/* ─── bg ─── */
${S} .bg-amber-50,${S} .dark .dark\\:bg-amber-50{background-color:${light1}!important}
${S} .bg-amber-100,${S} .dark .dark\\:bg-amber-100{background-color:${light2}!important}
${S} .bg-amber-200,${S} .dark .dark\\:bg-amber-200{background-color:${light2}!important}
${S} .bg-amber-400,${S} .dark .dark\\:bg-amber-400{background-color:${main}!important}
${S} .bg-amber-500,${S} .dark .dark\\:bg-amber-500{background-color:${main}!important}
${S} .bg-amber-600,${S} .dark .dark\\:bg-amber-600{background-color:${dark1}!important}

/* ─── bg opacity ─── */
${S} .bg-amber-400\\/10,${S} .dark .dark\\:bg-amber-400\\/10{background-color:${light1}!important}
${S} .bg-amber-400\\/15,${S} .dark .dark\\:bg-amber-400\\/15{background-color:${op15}!important}
${S} .bg-amber-400\\/20,${S} .dark .dark\\:bg-amber-400\\/20{background-color:${op30}!important}
${S} .bg-amber-500\\/10,${S} .dark .dark\\:bg-amber-500\\/10{background-color:${light1}!important}
${S} .bg-amber-500\\/15,${S} .dark .dark\\:bg-amber-500\\/15{background-color:${op15}!important}
${S} .bg-amber-500\\/20,${S} .dark .dark\\:bg-amber-500\\/20{background-color:${op30}!important}
${S} .dark .dark\\:bg-amber-950\\/30,${S} .dark .dark\\:bg-amber-950\\/40{background-color:${op15}!important}

/* ─── contrast on solid bg ─── */
${S} .bg-amber-400.text-zinc-950,${S} .bg-amber-500.text-zinc-950,
${S} .dark .dark\\:bg-amber-400.dark\\:text-zinc-950,${S} .dark .dark\\:bg-amber-500.dark\\:text-zinc-950,
${S} .dark .dark\\:bg-amber-400 .dark\\:text-zinc-950,${S} .dark .dark\\:bg-amber-500 .dark\\:text-zinc-950 {
  color: ${contrast}!important;
}

/* ─── border ─── */
${S} .border-amber-100,${S} .dark .dark\\:border-amber-100{border-color:${light2}!important}
${S} .border-amber-200,${S} .dark .dark\\:border-amber-200{border-color:${light2}!important}
${S} .border-amber-300,${S} .dark .dark\\:border-amber-300{border-color:${light2}!important}
${S} .border-amber-400,${S} .dark .dark\\:border-amber-400{border-color:${main}!important}
${S} .border-amber-500,${S} .dark .dark\\:border-amber-500{border-color:${main}!important}
${S} .border-amber-400\\/30,${S} .dark .dark\\:border-amber-400\\/30{border-color:${op30}!important}
${S} .border-amber-400\\/40,${S} .dark .dark\\:border-amber-400\\/40{border-color:${op30}!important}
${S} .border-amber-400\\/60,${S} .dark .dark\\:border-amber-400\\/60{border-color:${op30}!important}
${S} .border-amber-500\\/30,${S} .dark .dark\\:border-amber-500\\/30{border-color:${op30}!important}
${S} .border-amber-500\\/40,${S} .dark .dark\\:border-amber-500\\/40{border-color:${op30}!important}
${S} .border-amber-500\\/50,${S} .dark .dark\\:border-amber-500\\/50{border-color:${op30}!important}
${S} .dark .dark\\:border-amber-900\\/40{border-color:${op30}!important}

/* ─── focus ─── */
${S} .focus\\:border-amber-400:focus,${S} .dark .dark\\:focus\\:border-amber-400:focus{border-color:${main}!important}
${S} .focus-within\\:border-amber-400:focus-within,${S} .dark .dark\\:focus-within\\:border-amber-400:focus-within{border-color:${main}!important}
${S} .focus\\:ring-amber-400\\/20:focus,${S} .dark .dark\\:focus\\:ring-amber-400\\/20:focus,${S} .ring-amber-400\\/20{--tw-ring-color:${op30}!important}

/* ─── hover ─── */
${S} .hover\\:bg-amber-300:hover,${S} .dark .dark\\:hover\\:bg-amber-300:hover{background-color:${dark1}!important}
${S} .hover\\:bg-amber-400:hover,${S} .dark .dark\\:hover\\:bg-amber-400:hover{background-color:${dark1}!important}
${S} .hover\\:bg-amber-500:hover,${S} .dark .dark\\:hover\\:bg-amber-500:hover{background-color:${dark1}!important}
${S} .hover\\:border-amber-400:hover,${S} .dark .dark\\:hover\\:border-amber-400:hover{border-color:${main}!important}

/* ─── svg fill & stroke ─── */
${S} .fill-amber-400,${S} .dark .dark\\:fill-amber-400,${S} .fill-amber-500,${S} .dark .dark\\:fill-amber-500,
${S} .fill-amber-600,${S} .dark .dark\\:fill-amber-600,${S} .fill-amber-700,${S} .dark .dark\\:fill-amber-700{fill:${main}!important}
${S} .stroke-amber-400,${S} .dark .dark\\:stroke-amber-400,${S} .stroke-amber-500,${S} .dark .dark\\:stroke-amber-500{stroke:${main}!important}

/* ─── accent & shadow ─── */
${S} .accent-amber-500,${S} .accent-amber-600{accent-color:${main}!important}
${S} .shadow-\\[0_0_8px_rgba\\(251\\,191\\,36\\,0\\.6\\)\\]{box-shadow:0 0 8px ${op60}!important}
${S} .shadow-amber-500\\/20,${S} .shadow-amber-400\\/30{box-shadow:0 4px 14px ${op30}!important}

/* ─── calendar overrides (react-big-calendar, inside panel only) ─── */
${S} .rbc-now .rbc-button-link,
html.dark ${S} .rbc-now .rbc-button-link {
  background-color: ${main} !important;
  color: ${contrast} !important;
  box-shadow: 0 0 12px ${op30} !important;
}
${S} .rbc-today {
  background-color: ${light1} !important;
}
html.dark ${S} .rbc-today {
  background-color: ${op15} !important;
}
${S} .rbc-show-more,
html.dark ${S} .rbc-show-more {
  color: ${main} !important;
}
${S} .rbc-current-time-indicator,
${S} .rbc-current-time-indicator::before {
  background-color: ${main} !important;
}
`
}

export const accentInitScript = `(function(){try{var h=localStorage.getItem('accent-color');h=(h||'#F59E0B').toUpperCase();var a={'#D4AF37':'#F59E0B','#16A34A':'#10B981','#DC2626':'#EF4444'};h=a[h]||h;var c={'#F59E0B':{r:245,g:158,b:11,contrast:'#000000'},'#2563EB':{r:37,g:99,b:235,contrast:'#ffffff'},'#10B981':{r:16,g:185,b:129,contrast:'#000000'},'#EF4444':{r:239,g:68,b:68,contrast:'#ffffff'}}[h]||{'#F59E0B':{r:245,g:158,b:11,contrast:'#000000'}}['#F59E0B'];var r=c.r,g=c.g,b=c.b,m='rgb('+r+','+g+','+b+')',d1='rgb('+Math.round(r*.82)+','+Math.round(g*.82)+','+Math.round(b*.82)+')',d2='rgb('+Math.round(r*.67)+','+Math.round(g*.67)+','+Math.round(b*.67)+')',l1='rgba('+r+','+g+','+b+',.10)',l2='rgba('+r+','+g+','+b+',.20)',o15='rgba('+r+','+g+','+b+',.15)',o30='rgba('+r+','+g+','+b+',.30)',o60='rgba('+r+','+g+','+b+',.60)';var s=document.createElement('style');s.id='accent-override';s.textContent=':root{--accent:'+m+';--accent-dark:'+d1+';--accent-darker:'+d2+';--accent-light:'+l1+';--accent-lighter:'+l2+';--accent-op15:'+o15+';--accent-op30:'+o30+';--accent-op60:'+o60+';--accent-contrast:'+c.contrast+';--sidebar-active-bg:'+m+';--sidebar-active-text:'+c.contrast+';}html.dark{--sidebar-active-bg:'+m+';--sidebar-active-text:'+c.contrast+';--accent:'+m+';--accent-dark:'+d1+';--accent-darker:'+d2+';--accent-light:'+l1+';--accent-lighter:'+l2+';--accent-op15:'+o15+';--accent-op30:'+o30+';--accent-op60:'+o60+';--accent-contrast:'+c.contrast+';}.text-amber-200,.text-amber-300,.text-amber-400,.text-amber-500{color:'+m+'!important}.text-amber-600{color:'+d1+'!important}.text-amber-700,.text-amber-800,.text-amber-900{color:'+d2+'!important}.bg-amber-400,.bg-amber-500{background-color:'+m+'!important}.bg-amber-50{background-color:'+l1+'!important}.bg-amber-100{background-color:'+l2+'!important}.border-amber-400,.border-amber-500{border-color:'+m+'!important}.fill-amber-400,.fill-amber-500,.fill-amber-600{fill:'+m+'!important}.bg-amber-400.text-zinc-950,.bg-amber-500.text-zinc-950{color:'+c.contrast+'!important}.rbc-now .rbc-button-link,html.dark .rbc-now .rbc-button-link{background-color:'+m+'!important;color:'+c.contrast+'!important;box-shadow:0 0 12px '+o30+'!important;}.rbc-today{background-color:'+l1+'!important;}.dark .rbc-today,html.dark .rbc-today{background-color:'+o15+'!important;}.rbc-show-more,html.dark .rbc-show-more{color:'+m+'!important;}.rbc-current-time-indicator,.rbc-current-time-indicator::before{background-color:'+m+'!important;}';document.head.appendChild(s);if(document.documentElement){document.documentElement.style.setProperty('--accent',m);document.documentElement.style.setProperty('--accent-contrast',c.contrast);document.documentElement.style.setProperty('--accent-dark',d1);document.documentElement.style.setProperty('--accent-light',l1);document.documentElement.style.setProperty('--accent-lighter',l2);document.documentElement.style.setProperty('--accent-op15',o15);document.documentElement.style.setProperty('--accent-op30',o30);document.documentElement.style.setProperty('--accent-op60',o60);}}catch(e){}})();`


