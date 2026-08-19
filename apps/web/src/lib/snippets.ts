/**
 * Code snippets — Emmet-like & language helpers.
 */

export type Snippet = {
  id: string;
  prefix: string;
  language: string | string[];
  body: string;
  description: string;
};

export const SNIPPETS: Snippet[] = [
  {
    id: 'html5',
    prefix: '!',
    language: 'html',
    description: 'HTML5 boilerplate',
    body: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Document</title>
</head>
<body>
  $0
</body>
</html>
`,
  },
  {
    id: 'html-link-css',
    prefix: 'linkcss',
    language: 'html',
    description: 'Link stylesheet',
    body: `<link rel="stylesheet" href="\${1:styles.css}" />`,
  },
  {
    id: 'html-script',
    prefix: 'scriptsrc',
    language: 'html',
    description: 'Script src',
    body: `<script src="\${1:main.js}"></script>`,
  },
  {
    id: 'js-clg',
    prefix: 'clg',
    language: ['javascript', 'typescript', 'nodejs'],
    description: 'console.log',
    body: `console.log(\${1:value});`,
  },
  {
    id: 'js-fn',
    prefix: 'fn',
    language: ['javascript', 'typescript'],
    description: 'Function',
    body: `function \${1:name}(\${2:args}) {
  \${0}
}`,
  },
  {
    id: 'js-afn',
    prefix: 'afn',
    language: ['javascript', 'typescript'],
    description: 'Arrow function',
    body: `const \${1:name} = (\${2:args}) => {
  \${0}
};`,
  },
  {
    id: 'js-fetch',
    prefix: 'fetch',
    language: ['javascript', 'typescript'],
    description: 'Fetch API',
    body: `const res = await fetch('\${1:/api}');
const data = await res.json();
console.log(data);`,
  },
  {
    id: 'js-addEvent',
    prefix: 'ael',
    language: ['javascript', 'typescript'],
    description: 'addEventListener',
    body: `\${1:el}.addEventListener('\${2:click}', (\${3:e}) => {
  \${0}
});`,
  },
  {
    id: 'css-flex',
    prefix: 'flex',
    language: 'css',
    description: 'Flex center',
    body: `display: flex;
align-items: center;
justify-content: center;`,
  },
  {
    id: 'css-grid',
    prefix: 'grid',
    language: 'css',
    description: 'CSS Grid',
    body: `display: grid;
grid-template-columns: repeat(\${1:3}, 1fr);
gap: \${2:1rem};`,
  },
  {
    id: 'py-main',
    prefix: 'main',
    language: 'python',
    description: 'if __name__ == main',
    body: `def main():
    \${0:pass}

if __name__ == "__main__":
    main()
`,
  },
  {
    id: 'py-for',
    prefix: 'fori',
    language: 'python',
    description: 'for range',
    body: `for i in range(\${1:10}):
    \${0:print(i)}
`,
  },
  {
    id: 'java-main',
    prefix: 'main',
    language: 'java',
    description: 'Java main class',
    body: `public class \${1:Main} {
  public static void main(String[] args) {
    \${0:System.out.println("Hello");}
  }
}
`,
  },
  {
    id: 'cpp-main',
    prefix: 'main',
    language: 'cpp',
    description: 'C++ main',
    body: `#include <iostream>
using namespace std;

int main() {
  \${0:cout << "Hello" << endl;}
  return 0;
}
`,
  },
];

export function snippetsForLanguage(lang: string): Snippet[] {
  return SNIPPETS.filter((s) =>
    Array.isArray(s.language) ? s.language.includes(lang) : s.language === lang
  );
}

export function findSnippet(prefix: string, lang: string): Snippet | undefined {
  return snippetsForLanguage(lang).find((s) => s.prefix === prefix);
}
