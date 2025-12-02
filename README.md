# Galeria de Fotos

Uma aplicação web para gerenciamento e visualização de fotos de eventos.

## 🚀 Deploy

### Desenvolvimento
```bash
docker compose up --build
```

### Produção

1. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite o .env com suas configurações
   ```

2. **Configure o MinIO Public URL:**
   ```bash
   # Para produção, defina:
   MINIO_PUBLIC_URL=https://minio-galeria.pinuslab.dev
   ```

3. **Deploy:**
   ```bash
   docker compose -f docker-compose.yml up --build -d
   ```

## 🔧 Configuração

### MinIO URLs

A aplicação usa duas URLs diferentes para o MinIO:
- `MINIO_ENDPOINT`: Para comunicação interna entre containers (ex: `minio`)
- `MINIO_PUBLIC_URL`: Para acesso do navegador (ex: `https://minio-galeria.pinuslab.dev`)

### Banco de Dados

As tabelas são criadas automaticamente no primeiro deploy. Se precisar recriar:
```bash
docker compose exec app npx tsx scripts/create-tables.ts
```

## 📁 Estrutura

- `app/`: Páginas Next.js
- `lib/`: Utilitários e configurações
- `scripts/`: Scripts de manutenção
- `components/`: Componentes React