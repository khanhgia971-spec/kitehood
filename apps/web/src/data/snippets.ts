export type Snippet = { id: string; lang: string; title: string; code: string; tags: string[] };

export const SNIPPETS: Snippet[] = [
  { id: 'py-hello', lang: 'python', title: 'Hello + input', tags: ['basic'], code: 'name = input("Ten: ")\nprint(f"Xin chao, {name}!")\n' },
  { id: 'py-loop', lang: 'python', title: 'For loop 1..10', tags: ['loop'], code: 'for i in range(1, 11):\n    print(i)\n' },
  { id: 'py-list', lang: 'python', title: 'List comprehension', tags: ['list'], code: 'nums = [x*x for x in range(10)]\nprint(nums)\n' },
  { id: 'cpp-hello', lang: 'cpp', title: 'Hello C++', tags: ['basic'], code: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello C++" << endl;\n    return 0;\n}\n' },
  { id: 'cpp-sum', lang: 'cpp', title: 'Tong 1..n', tags: ['loop'], code: '#include <iostream>\nusing namespace std;\nint main() {\n    int n, s = 0;\n    cin >> n;\n    for (int i = 1; i <= n; i++) s += i;\n    cout << s << endl;\n    return 0;\n}\n' },
  { id: 'c-hello', lang: 'c', title: 'Hello C', tags: ['basic'], code: '#include <stdio.h>\nint main() {\n    printf("Hello C\\n");\n    return 0;\n}\n' },
  { id: 'java-hello', lang: 'java', title: 'Hello Java', tags: ['basic'], code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java");\n    }\n}\n' },
  { id: 'js-fetch', lang: 'javascript', title: 'Fetch JSON', tags: ['async'], code: 'async function load() {\n  const r = await fetch("https://httpbin.org/get");\n  const j = await r.json();\n  console.log(j);\n}\nload();\n' },
  { id: 'js-dom', lang: 'javascript', title: 'DOM click', tags: ['dom'], code: 'document.querySelector("button")?.addEventListener("click", () => {\n  alert("Clicked!");\n});\n' },
  { id: 'html-card', lang: 'html', title: 'Card UI', tags: ['ui'], code: '<div class="card">\n  <h2>Title</h2>\n  <p>Noi dung the card.</p>\n  <button>OK</button>\n</div>\n' },
  { id: 'go-hello', lang: 'go', title: 'Hello Go', tags: ['basic'], code: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello Go")\n}\n' },
  { id: 'rs-hello', lang: 'rust', title: 'Hello Rust', tags: ['basic'], code: 'fn main() {\n    println!("Hello Rust");\n}\n' },
  { id: 'sql-select', lang: 'sql', title: 'SELECT basic', tags: ['sql'], code: 'SELECT id, name FROM users WHERE active = 1 ORDER BY name;\n' },
  { id: 'bash-loop', lang: 'bash', title: 'Bash loop', tags: ['shell'], code: 'for i in 1 2 3 4 5; do\n  echo "item $i"\ndone\n' },
  { id: 'py-func', lang: 'python', title: 'Function + type', tags: ['func'], code: 'def add(a: int, b: int) -> int:\n    return a + b\n\nprint(add(2, 3))\n' },
,

  { id: 'c-array', lang: 'c', title: 'Mang + for', tags: ['array'], code: '#include <stdio.h>\nint main() {\n    int a[5] = {1,2,3,4,5};\n    for (int i = 0; i < 5; i++) printf(\"%d \", a[i]);\n    printf(\"\\n\");\n    return 0;\n}\n' },
  { id: 'cpp-vector', lang: 'cpp', title: 'vector + sort', tags: ['stl'], code: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    vector<int> v = {3,1,4,1,5};\n    sort(v.begin(), v.end());\n    for (int x : v) cout << x << \" \";\n    cout << endl;\n    return 0;\n}\n' },
  { id: 'cpp-io', lang: 'cpp', title: 'Nhap xuat co ban', tags: ['io'], code: '#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    cin >> n;\n    cout << \"n = \" << n << endl;\n    return 0;\n}\n' },
  { id: 'py-dict', lang: 'python', title: 'Dict dem tan suat', tags: ['dict'], code: 'from collections import Counter\ns = \"hello\"\nprint(Counter(s))\n' },
  { id: 'java-scanner', lang: 'java', title: 'Scanner input', tags: ['io'], code: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(n * 2);\n    }\n}\n' },
  { id: 'js-map', lang: 'javascript', title: 'Array map/filter', tags: ['array'], code: 'const a = [1,2,3,4,5];\nconsole.log(a.map(x => x*x).filter(x => x > 10));\n' },
];
