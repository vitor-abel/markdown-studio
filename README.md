# Markdown Studio

Markdown Studio é um editor de Markdown com interface inspirada no VS Code: editor à esquerda e visualização em tempo real à direita.

## Estrutura

```
markdown-studio/
├── index.html      # estrutura da página
├── css/
│   └── style.css   # estilos e temas claro/escuro
└── js/
    └── app.js      # lógica do editor
```

## Como usar

Abra o `index.html` no navegador. É preciso estar online na primeira abertura, porque as bibliotecas
**marked** (conversão de Markdown) e **DOMPurify** (sanitização do HTML) são carregadas por CDN.

Para funcionar offline, baixe `marked.min.js` e `purify.min.js`, coloque-os em uma pasta `js/lib/`
e troque as duas tags `<script src="https://cdnjs...">` do `index.html` pelos caminhos locais.

## Atalhos

| Atalho | Ação |
| --- | --- |
| Ctrl+B | Negrito |
| Ctrl+I | Itálico |
| Ctrl+K | Link |
| Ctrl+S | Salvar no navegador |
| Tab | Recuar |
