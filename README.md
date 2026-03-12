# 📦 Sistema de Gestão de Estoque

Sistema web de gestão de estoque desenvolvido como **Projeto Integrador II** do curso de Computação — UNIVESP 2025.

Permite o cadastro e controle de **produtos, fornecedores, clientes, locais de estoque e movimentações** (entradas, saídas e transferências), com geração de relatórios em PDF e Excel.

---

## ✨ Funcionalidades

- **Cadastro completo**: Empresa, Fornecedores, Clientes, Produtos e Locais de Estoque
- **Movimentações**: Entrada, Saída e Transferência entre locais
- **Relatórios**: Exportação em PDF e Excel com filtros por período e tipo
- **Controle de acesso**: Usuários com perfis `admin` e `user`
- **Ativação/Inativação**: Clientes e fornecedores com movimentações não podem ser excluídos, mas podem ser inativados
- **Filtros de status**: Visualização de registros ativos, inativos ou todos
- **Acessibilidade**: Alto contraste, aumento de fonte, navegação por teclado, VLibras (Libras) e guia operacional interativo
- **Responsivo**: Layout adaptado para desktop e dispositivos móveis
- **Busca automática**: CEP (ViaCEP) e CNPJ (BrasilAPI) nos formulários

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.13 · Flask 2.2 · SQLAlchemy 2.0 |
| Banco de dados | PostgreSQL (Neon — serverless) |
| Frontend | Bootstrap 5.3 · Bootstrap Icons · JavaScript |
| Relatórios | ReportLab (PDF) · openpyxl (Excel) |
| Deploy | Vercel (serverless) |
| Acessibilidade | VLibras · WCAG 2.1 · eMAG |

---

## 🚀 Como executar localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

### 2. Criar e ativar ambiente virtual
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate
```

### 3. Instalar dependências
```bash
pip install -r requirements.txt
```

### 4. Configurar banco de dados (Neon)
1. Crie uma conta gratuita em [neon.tech](https://neon.tech)
2. Crie um novo projeto
3. Execute o schema do banco: `sql/schema_neon.sql` no **SQL Editor** do Neon

### 5. Configurar variáveis de ambiente
Copie o arquivo de exemplo e preencha com suas credenciais:
```bash
cp .env.example .env
```
```env
DATABASE_URL=postgresql+psycopg2://user:password@host.neon.tech/dbname?sslmode=require
SECRET_KEY=uma_chave_secreta_forte
```

### 6. Executar a aplicação
```bash
python app.py
```
Acesse em: [http://localhost:5000](http://localhost:5000)

### 7. Login inicial
| Usuário | Senha |
|---|---|
| `admin` | `admin` |

> ⚠️ **Altere a senha padrão do admin após o primeiro acesso.**

---

## 📁 Estrutura do projeto

```
├── app.py                  # Aplicação principal (Flask)
├── requirements.txt        # Dependências Python
├── vercel.json             # Configuração de deploy (Vercel)
├── .env.example            # Modelo de variáveis de ambiente
├── sql/
│   └── schema_neon.sql     # Schema do banco de dados
├── static/
│   ├── style.css           # Estilos
│   ├── script.js           # JavaScript
│   ├── favicon.svg         # Ícone do site
│   └── img/
│       └── logo.png        # Logotipo
├── templates/              # Templates HTML (Jinja2)
│   ├── base.html
│   ├── login.html
│   ├── empresa.html
│   ├── clientes.html
│   ├── fornecedores.html
│   ├── produtos.html
│   ├── locais.html
│   ├── movimentacoes.html
│   └── ...
└── RELATORIO_ACESSIBILIDADE.md
```

---

## ♿ Acessibilidade

O sistema segue diretrizes da **WCAG 2.1**, **eMAG** e legislação brasileira (LBI — Lei 13.146/2015). Detalhes completos em [`RELATORIO_ACESSIBILIDADE.md`](RELATORIO_ACESSIBILIDADE.md).

---

## 📄 Licença

Projeto acadêmico desenvolvido para fins educacionais — UNIVESP 2025.