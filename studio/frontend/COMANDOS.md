# DevForge V2 - Comandos Úteis

## 🚀 Desenvolvimento

```bash
# Iniciar dev server (porta 3000)
cd ~/devforge-v2/studio/frontend
npm run dev

# Ou usar script
./dev.sh
```

## 🏗️ Build

```bash
# Build para produção
npm run build

# Preview build
npm run preview

# Limpar build
rm -rf dist/
```

## 🧪 Testes & Linting

```bash
# ESLint
npm run lint

# Fix lint issues
npx eslint . --ext ts,tsx --fix

# Type check
npx tsc --noEmit
```

## 📦 Dependencies

```bash
# Instalar tudo
npm install

# Instalar nova dependency
npm install nome-package

# Instalar dev dependency
npm install -D nome-package

# Atualizar dependencies
npm update

# Audit vulnerabilities
npm audit
npm audit fix
```

## 🔍 Debug

```bash
# Ver info do projeto
npm list --depth=0

# Ver versões
node -v
npm -v

# Limpar cache npm
npm cache clean --force

# Reinstalar tudo
rm -rf node_modules package-lock.json
npm install
```

## 📊 Análise

```bash
# Bundle size analysis
npx vite-bundle-visualizer

# Ver bundle info
npm run build -- --mode analyze
```

## 🎨 Tailwind

```bash
# Gerar config completo
npx tailwindcss init --full

# Watch CSS (se necessário)
npx tailwindcss -i ./src/index.css -o ./dist/output.css --watch
```

## 🔧 Vite

```bash
# Limpar cache Vite
rm -rf node_modules/.vite

# Preview em rede local
npm run preview -- --host

# Build com sourcemaps
npm run build -- --sourcemap
```

## 📝 Git

```bash
# Init repo (se necessário)
git init
git add .
git commit -m "feat: setup DevForge V2 frontend"

# Create .gitignore (já existe)
echo "node_modules\ndist\n*.log" > .gitignore
```

## 🌐 Deploy

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy produção
vercel --prod
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Deploy produção
netlify deploy --prod
```

### Build settings
```
Build command: npm run build
Publish directory: dist
```

## 🐛 Troubleshooting

### Port já em uso
```bash
# Matar processo na porta 3000
lsof -ti:3000 | xargs kill -9

# Ou usar outra porta
PORT=3001 npm run dev
```

### Node modules corrompidos
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Build falha
```bash
# Limpar tudo e rebuild
rm -rf node_modules dist .vite package-lock.json
npm install
npm run build
```

### TypeScript errors
```bash
# Check tipos
npx tsc --noEmit

# Ver config
npx tsc --showConfig
```

## 📦 Adicionar Features

### Instalar Vitest (testes)
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Instalar React Query
```bash
npm install @tanstack/react-query
```

### Instalar Framer Motion (animações)
```bash
npm install framer-motion
```

### Instalar Axios (alternative a fetch)
```bash
npm install axios
```

## 🔄 Updates

```bash
# Check outdated packages
npm outdated

# Update interactivo
npx npm-check-updates -i

# Update all to latest
npx npm-check-updates -u
npm install
```

## 📱 Mobile Testing

```bash
# Serve em rede local
npm run dev -- --host

# Ver IP local
ifconfig | grep "inet " | grep -v 127.0.0.1

# Aceder de mobile: http://[SEU-IP]:3000
```

## 🎯 Quick Commands

```bash
# Dev + logs
npm run dev 2>&1 | tee dev.log

# Build + preview
npm run build && npm run preview

# Limpar + build
rm -rf dist node_modules/.vite && npm run build

# Install + dev
npm install && npm run dev
```

## 📊 Performance

```bash
# Lighthouse CLI
npm install -g lighthouse
lighthouse http://localhost:3000 --view

# Bundle analyzer
npm install -D rollup-plugin-visualizer
```

## 🔐 Env Variables

```bash
# Criar .env
cat > .env.local << EOF
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
EOF

# Usar em código
import.meta.env.VITE_API_URL
```

## 🚨 Pre-commit

```bash
# Instalar husky
npm install -D husky
npx husky init

# Add lint pre-commit
echo "npm run lint" > .husky/pre-commit
```

## 📖 Docs

```bash
# Gerar TypeDoc
npm install -D typedoc
npx typedoc --out docs src/

# Storybook (component docs)
npx sb init
npm run storybook
```

## ⚡ Performance Tips

```bash
# Enable React Fast Refresh
# (já ativado no vite.config.ts)

# Code splitting (lazy load)
const Dashboard = lazy(() => import('./pages/Dashboard'))

# Analyze bundle
npm run build -- --mode analyze
```
