
export const themes = [
  // Gradients
  {
    id: 'ocean',
    label: 'Ocean Breeze',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #163146 0%, #1e90ff 100%)',
    },
    primary: '#163146',
    accent: '#1e90ff',
    textColor: 'text-white',
  },
  {
    id: 'sunset',
    label: 'Golden Hour',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #FF4E50 0%, #F9D423 100%)',
    },
    primary: '#FF4E50',
    accent: '#F9D423',
    textColor: 'text-white',
  },
  {
    id: 'lavender',
    label: 'Lavender Dream',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #834d9b 0%, #d04ed6 100%)',
    },
    primary: '#834d9b',
    accent: '#d04ed6',
    textColor: 'text-white',
  },
  {
    id: 'midnight',
    label: 'Midnight City',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    },
    primary: '#232526',
    accent: '#414345',
    textColor: 'text-white',
  },
  {
    id: 'emerald',
    label: 'Emerald City',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
    },
    primary: '#134E5E',
    accent: '#71B280',
    textColor: 'text-white',
  },

  // Abstract Patterns (CSS only for now)
  {
    id: 'geometric',
    label: 'Geometric',
    type: 'pattern',
    style: {
      backgroundColor: '#111',
      backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.05) 2px, transparent 2px), linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)',
      backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
      backgroundPosition: '-2px -2px, -2px -2px, -1px -1px, -1px -1px',
    },
    primary: '#111',
    accent: '#333',
    textColor: 'text-white',
  },
  {
    id: 'dots',
    label: 'Polka Dots',
    type: 'pattern',
    style: {
      backgroundColor: '#e5e5f7',
      backgroundImage: 'radial-gradient(#444cf7 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    },
    primary: '#444cf7',
    accent: '#e5e5f7',
    textColor: 'text-slate-800',
  },
  {
    id: 'rose',
    label: 'Rose Quartz',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #e55d87 0%, #5fc3e4 100%)',
    },
    primary: '#e55d87',
    accent: '#5fc3e4',
    textColor: 'text-white',
  },
  {
    id: 'indigo',
    label: 'Electric Indigo',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    primary: '#667eea',
    accent: '#764ba2',
    textColor: 'text-white',
  },
  {
    id: 'sand',
    label: 'Desert Sand',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #3e5151 0%, #decba4 100%)',
    },
    primary: '#3e5151',
    accent: '#decba4',
    textColor: 'text-white',
  },
  
  // Mesh Gradients
  {
    id: 'aurora',
    label: 'Aurora',
    type: 'mesh',
    style: {
      background: 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)',
      backgroundColor: '#0f0f1a',
    },
    primary: '#1a1a2e',
    accent: '#e94560',
    textColor: 'text-white',
  },
  {
    id: 'candy',
    label: 'Cotton Candy',
    type: 'mesh',
    style: {
      background: 'radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0, transparent 50%)',
      backgroundColor: '#ffdee9',
    },
    primary: '#ff9a9e',
    accent: '#fad0c4',
    textColor: 'text-slate-800',
  },
]

export const getThemeById = (id) => themeMap[id] || themeMap.ocean

export const themeMap = themes.reduce((acc, theme) => {
  acc[theme.id] = theme
  return acc
}, {})
