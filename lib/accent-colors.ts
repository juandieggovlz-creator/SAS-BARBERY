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
  const dark1   = `rgb(${Math.round(r * 0.82)},${Math.round(g * 0.82)},${Math.round(b * 0.82)})`  // amber-600
  const dark2   = `rgb(${Math.round(r * 0.67)},${Math.round(g * 0.67)},${Math.round(b * 0.67)})`  // amber-700
  const light1  = `rgba(${r},${g},${b},0.10)` // amber-50
  const light2  = `rgba(${r},${g},${b},0.20)` // amber-100 / border
  const op15    = `rgba(${r},${g},${b},0.15)` // /15
  const op30    = `rgba(${r},${g},${b},0.30)` // /30
  const op60    = `rgba(${r},${g},${b},0.60)` // glow
  const contrast = c.contrastText

  return `
/* ── BarberOS Accent Color Override ── */
:root {
  --accent: ${main};
  --accent-dark: ${dark1};
  --accent-darker: ${dark2};
  --accent-light: ${light1};
  --accent-lighter: ${light2};
  --accent-op15: ${op15};
  --accent-op30: ${op30};
  --accent-op60: ${op60};
  --accent-contrast: ${contrast};
  --sidebar-active-bg: ${main};
  --sidebar-active-text: ${contrast};
}
html.dark {
  --accent: ${main};
  --accent-dark: ${dark1};
  --accent-darker: ${dark2};
  --accent-light: ${light1};
  --accent-lighter: ${light2};
  --accent-op15: ${op15};
  --accent-op30: ${op30};
  --accent-op60: ${op60};
  --accent-contrast: ${contrast};
  --sidebar-active-bg: ${main};
  --sidebar-active-text: ${contrast};
}

/* ─── text ─── */
.text-amber-200,.dark .dark\\:text-amber-200{color:${main}!important}
.text-amber-300,.dark .dark\\:text-amber-300{color:${main}!important}
.text-amber-400,.dark .dark\\:text-amber-400{color:${main}!important}
.text-amber-500,.dark .dark\\:text-amber-500{color:${main}!important}
.text-amber-600,.dark .dark\\:text-amber-600{color:${dark1}!important}
.text-amber-700,.dark .dark\\:text-amber-700{color:${dark2}!important}
.text-amber-800,.dark .dark\\:text-amber-800{color:${dark2}!important}
.text-amber-900,.dark .dark\\:text-amber-900{color:${dark2}!important}
.group:hover .group-hover\\:text-amber-400,.group:hover .dark\\:group-hover\\:text-amber-400{color:${main}!important}
.group\\/client:hover .group-hover\\/client\\:text-amber-600{color:${main}!important}
.hover\\:text-amber-400:hover,.dark .dark\\:hover\\:text-amber-400:hover{color:${main}!important}
.hover\\:text-amber-600:hover{color:${dark1}!important}

/* ─── bg ─── */
.bg-amber-50,.dark .dark\\:bg-amber-50{background-color:${light1}!important}
.bg-amber-100,.dark .dark\\:bg-amber-100{background-color:${light2}!important}
.bg-amber-200,.dark .dark\\:bg-amber-200{background-color:${light2}!important}
.bg-amber-400,.dark .dark\\:bg-amber-400{background-color:${main}!important}
.bg-amber-500,.dark .dark\\:bg-amber-500{background-color:${main}!important}
.bg-amber-600,.dark .dark\\:bg-amber-600{background-color:${dark1}!important}

/* ─── bg opacity ─── */
.bg-amber-400\\/10,.dark .dark\\:bg-amber-400\\/10{background-color:${light1}!important}
.bg-amber-400\\/15,.dark .dark\\:bg-amber-400\\/15{background-color:${op15}!important}
.bg-amber-400\\/20,.dark .dark\\:bg-amber-400\\/20{background-color:${op30}!important}
.bg-amber-500\\/10,.dark .dark\\:bg-amber-500\\/10{background-color:${light1}!important}
.bg-amber-500\\/15,.dark .dark\\:bg-amber-500\\/15{background-color:${op15}!important}
.bg-amber-500\\/20,.dark .dark\\:bg-amber-500\\/20{background-color:${op30}!important}
.dark .dark\\:bg-amber-950\\/30,.dark .dark\\:bg-amber-950\\/40{background-color:${op15}!important}

/* ─── contrast on solid bg ─── */
.bg-amber-400.text-zinc-950,.bg-amber-500.text-zinc-950,
.dark .dark\\:bg-amber-400.dark\\:text-zinc-950,.dark .dark\\:bg-amber-500.dark\\:text-zinc-950,
.dark .dark\\:bg-amber-400 .dark\\:text-zinc-950,.dark .dark\\:bg-amber-500 .dark\\:text-zinc-950 {
  color: ${contrast}!important;
}

/* ─── border ─── */
.border-amber-100,.dark .dark\\:border-amber-100{border-color:${light2}!important}
.border-amber-200,.dark .dark\\:border-amber-200{border-color:${light2}!important}
.border-amber-300,.dark .dark\\:border-amber-300{border-color:${light2}!important}
.border-amber-400,.dark .dark\\:border-amber-400{border-color:${main}!important}
.border-amber-500,.dark .dark\\:border-amber-500{border-color:${main}!important}
.border-amber-400\\/30,.dark .dark\\:border-amber-400\\/30{border-color:${op30}!important}
.border-amber-400\\/40,.dark .dark\\:border-amber-400\\/40{border-color:${op30}!important}
.border-amber-400\\/60,.dark .dark\\:border-amber-400\\/60{border-color:${op30}!important}
.border-amber-500\\/30,.dark .dark\\:border-amber-500\\/30{border-color:${op30}!important}
.border-amber-500\\/40,.dark .dark\\:border-amber-500\\/40{border-color:${op30}!important}
.border-amber-500\\/50,.dark .dark\\:border-amber-500\\/50{border-color:${op30}!important}
.dark .dark\\:border-amber-900\\/40{border-color:${op30}!important}

/* ─── focus ─── */
.focus\\:border-amber-400:focus,.dark .dark\\:focus\\:border-amber-400:focus{border-color:${main}!important}
.focus-within\\:border-amber-400:focus-within,.dark .dark\\:focus-within\\:border-amber-400:focus-within{border-color:${main}!important}
.focus\\:ring-amber-400\\/20:focus,.dark .dark\\:focus\\:ring-amber-400\\/20:focus,.ring-amber-400\\/20{--tw-ring-color:${op30}!important}

/* ─── hover ─── */
.hover\\:bg-amber-300:hover,.dark .dark\\:hover\\:bg-amber-300:hover{background-color:${dark1}!important}
.hover\\:bg-amber-400:hover,.dark .dark\\:hover\\:bg-amber-400:hover{background-color:${dark1}!important}
.hover\\:bg-amber-500:hover,.dark .dark\\:hover\\:bg-amber-500:hover{background-color:${dark1}!important}
.hover\\:border-amber-400:hover,.dark .dark\\:hover\\:border-amber-400:hover{border-color:${main}!important}

/* ─── svg fill & stroke ─── */
.fill-amber-400,.dark .dark\\:fill-amber-400,.fill-amber-500,.dark .dark\\:fill-amber-500,
.fill-amber-600,.dark .dark\\:fill-amber-600,.fill-amber-700,.dark .dark\\:fill-amber-700{fill:${main}!important}
.stroke-amber-400,.dark .dark\\:stroke-amber-400,.stroke-amber-500,.dark .dark\\:stroke-amber-500{stroke:${main}!important}

/* ─── accent & shadow ─── */
.accent-amber-500,.accent-amber-600{accent-color:${main}!important}
.shadow-\\[0_0_8px_rgba\\(251\\,191\\,36\\,0\\.6\\)\\]{box-shadow:0 0 8px ${op60}!important}
.shadow-amber-500\\/20,.shadow-amber-400\\/30{box-shadow:0 4px 14px ${op30}!important}

/* ─── calendar overrides (react-big-calendar) ─── */
.rbc-now .rbc-button-link,
html.dark .rbc-now .rbc-button-link {
  background-color: ${main} !important;
  color: ${contrast} !important;
  box-shadow: 0 0 12px ${op30} !important;
}
.rbc-today {
  background-color: ${light1} !important;
}
html.dark .rbc-today {
  background-color: ${op15} !important;
}
.rbc-show-more,
html.dark .rbc-show-more {
  color: ${main} !important;
}
.rbc-current-time-indicator,
.rbc-current-time-indicator::before {
  background-color: ${main} !important;
}
`
}

export const accentInitScript = `(function(){try{var h=localStorage.getItem('accent-color');h=(h||'#F59E0B').toUpperCase();var a={'#D4AF37':'#F59E0B','#16A34A':'#10B981','#DC2626':'#EF4444'};h=a[h]||h;var c={'#F59E0B':{r:245,g:158,b:11,contrast:'#000000'},'#2563EB':{r:37,g:99,b:235,contrast:'#ffffff'},'#10B981':{r:16,g:185,b:129,contrast:'#000000'},'#EF4444':{r:239,g:68,b:68,contrast:'#ffffff'}}[h]||{'#F59E0B':{r:245,g:158,b:11,contrast:'#000000'}}['#F59E0B'];var r=c.r,g=c.g,b=c.b,m='rgb('+r+','+g+','+b+')',d1='rgb('+Math.round(r*.82)+','+Math.round(g*.82)+','+Math.round(b*.82)+')',d2='rgb('+Math.round(r*.67)+','+Math.round(g*.67)+','+Math.round(b*.67)+')',l1='rgba('+r+','+g+','+b+',.10)',l2='rgba('+r+','+g+','+b+',.20)',o15='rgba('+r+','+g+','+b+',.15)',o30='rgba('+r+','+g+','+b+',.30)',o60='rgba('+r+','+g+','+b+',.60)';var s=document.createElement('style');s.id='accent-override';s.textContent=':root{--accent:'+m+';--accent-dark:'+d1+';--accent-darker:'+d2+';--accent-light:'+l1+';--accent-lighter:'+l2+';--accent-op15:'+o15+';--accent-op30:'+o30+';--accent-op60:'+o60+';--accent-contrast:'+c.contrast+';--sidebar-active-bg:'+m+';--sidebar-active-text:'+c.contrast+';}html.dark{--sidebar-active-bg:'+m+';--sidebar-active-text:'+c.contrast+';--accent:'+m+';--accent-dark:'+d1+';--accent-darker:'+d2+';--accent-light:'+l1+';--accent-lighter:'+l2+';--accent-op15:'+o15+';--accent-op30:'+o30+';--accent-op60:'+o60+';--accent-contrast:'+c.contrast+';}.text-amber-200,.text-amber-300,.text-amber-400,.text-amber-500{color:'+m+'!important}.text-amber-600{color:'+d1+'!important}.text-amber-700,.text-amber-800,.text-amber-900{color:'+d2+'!important}.bg-amber-400,.bg-amber-500{background-color:'+m+'!important}.bg-amber-50{background-color:'+l1+'!important}.bg-amber-100{background-color:'+l2+'!important}.border-amber-400,.border-amber-500{border-color:'+m+'!important}.fill-amber-400,.fill-amber-500,.fill-amber-600{fill:'+m+'!important}.bg-amber-400.text-zinc-950,.bg-amber-500.text-zinc-950{color:'+c.contrast+'!important}.rbc-now .rbc-button-link,html.dark .rbc-now .rbc-button-link{background-color:'+m+'!important;color:'+c.contrast+'!important;box-shadow:0 0 12px '+o30+'!important;}.rbc-today{background-color:'+l1+'!important;}.dark .rbc-today,html.dark .rbc-today{background-color:'+o15+'!important;}.rbc-show-more,html.dark .rbc-show-more{color:'+m+'!important;}.rbc-current-time-indicator,.rbc-current-time-indicator::before{background-color:'+m+'!important;}';document.head.appendChild(s);if(document.documentElement){document.documentElement.style.setProperty('--accent',m);document.documentElement.style.setProperty('--accent-contrast',c.contrast);document.documentElement.style.setProperty('--accent-dark',d1);document.documentElement.style.setProperty('--accent-light',l1);document.documentElement.style.setProperty('--accent-lighter',l2);document.documentElement.style.setProperty('--accent-op15',o15);document.documentElement.style.setProperty('--accent-op30',o30);document.documentElement.style.setProperty('--accent-op60',o60);}}catch(e){}})();`


