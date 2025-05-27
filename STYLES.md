# 🎨 Sistema de Estilos - Mercado Mágico

## Tecnologias de Estilo

### **Tailwind CSS**
- Framework CSS utility-first
- Configuração customizada em `tailwind.config.ts`
- Classes responsivas e modernas

### **CSS Global**
- Arquivo: `src/app/globals.css`
- Variáveis CSS customizadas
- Suporte a modo escuro
- Utilitários personalizados

## Paleta de Cores

### **Cores Principais**
```css
--primary: 222.2 47.4% 11.2%        /* Azul escuro */
--secondary: 210 40% 96%             /* Cinza claro */
--background: 0 0% 100%              /* Branco */
--foreground: 222.2 84% 4.9%         /* Preto */
```

### **Gradientes**
- **Azul → Roxo**: `from-blue-600 to-purple-600`
- **Roxo → Rosa**: `from-purple-500 to-pink-600`
- **Background**: `from-slate-50 via-blue-50 to-indigo-100`

## Efeitos Visuais

### **Glassmorphism**
```css
.glass-card {
  @apply bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg;
}
```

### **Hover Effects**
- `hover:shadow-xl`
- `hover:-translate-y-1`
- `hover:scale-105`
- `transition-all duration-300`

### **Backdrop Blur**
- `backdrop-blur-sm` - Blur sutil
- `backdrop-blur-md` - Blur médio
- `backdrop-blur-lg` - Blur forte

## Componentes de Design

### **Cards**
- Background: `bg-white/60`
- Bordas: `border border-white/20`
- Sombras: `shadow-lg hover:shadow-xl`
- Cantos: `rounded-2xl`

### **Botões**
- **Primário**: Gradiente azul-roxo
- **Secundário**: Outline com glassmorphism
- **Ghost**: Transparente com hover

### **Tipografia**
- **Títulos**: `font-extrabold` com gradientes
- **Subtítulos**: `font-bold text-slate-900`
- **Texto**: `text-slate-600` para descrições

## Responsividade

### **Breakpoints**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1400px

### **Grid System**
- Mobile: 1 coluna
- Tablet: 2 colunas
- Desktop: 3+ colunas

## Animações

### **Keyframes Customizados**
```css
@keyframes accordion-down {
  from { height: 0 }
  to { height: var(--radix-accordion-content-height) }
}
```

### **Transições**
- `transition-all duration-300`
- `transition-colors`
- `transition-transform`

## Utilitários Personalizados

### **Gradiente de Texto**
```css
.gradient-text {
  @apply bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent;
}
```

### **Background Gradiente**
```css
.gradient-bg {
  @apply bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100;
}
```

## Modo Escuro

### **Variáveis Dark Mode**
```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... outras variáveis */
}
```

### **Ativação**
- Classe: `dark`
- Toggle automático baseado em preferência do sistema

## Estrutura de Arquivos

```
src/
├── app/
│   └── globals.css          # CSS global e variáveis
├── components/
│   └── ui/                  # Componentes base
└── styles/                  # (futuro) Estilos específicos
```

## Boas Práticas

### **Nomenclatura**
- Use classes semânticas do Tailwind
- Prefira utilitários a CSS customizado
- Mantenha consistência nos espaçamentos

### **Performance**
- Purge automático do Tailwind
- Classes condicionais otimizadas
- Lazy loading de estilos

### **Manutenibilidade**
- Variáveis CSS para temas
- Componentes reutilizáveis
- Documentação atualizada

## Exemplos de Uso

### **Card com Glassmorphism**
```jsx
<div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
  {/* Conteúdo */}
</div>
```

### **Botão com Gradiente**
```jsx
<button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg shadow-lg transition-all duration-300">
  Clique aqui
</button>
```

### **Texto com Gradiente**
```jsx
<h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
  Título Gradiente
</h1>
``` 