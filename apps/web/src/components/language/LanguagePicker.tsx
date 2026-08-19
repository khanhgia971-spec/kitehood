import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { useFSStore } from '../../stores/fs';
import { useEditorStore } from '../../stores/editor';

/** Correct filename + monaco language + starter content for each lang id */
const LANG_META: Record<
  string,
  { file: string; language: string; content: string }
> = {
  html: {
    file: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Document</title>
</head>
<body>
  <h1>Xin chào KiteHood 🪁</h1>
</body>
</html>
`,
  },
  css: {
    file: 'styles.css',
    language: 'css',
    content: `/* styles.css */
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0a0a12;
  color: #e8e8f0;
}
`,
  },
  javascript: {
    file: 'main.js',
    language: 'javascript',
    content: `// main.js
console.log('Hello from JavaScript!');
`,
  },
  typescript: {
    file: 'main.ts',
    language: 'typescript',
    content: `// main.ts
const msg: string = 'Hello from TypeScript!';
console.log(msg);
`,
  },
  nodejs: {
    file: 'index.js',
    language: 'javascript',
    content: `// Node.js
console.log('Hello from Node.js!');
`,
  },
  python: {
    file: 'main.py',
    language: 'python',
    content: `# main.py
print('Hello from Python!')
`,
  },
  java: {
    file: 'Main.java',
    language: 'java',
    content: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello from Java!");
  }
}
`,
  },
  c: {
    file: 'main.c',
    language: 'c',
    content: `#include <stdio.h>
int main() {
  printf("Hello from C!\\n");
  return 0;
}
`,
  },
  cpp: {
    file: 'main.cpp',
    language: 'cpp',
    content: `#include <iostream>
int main() {
  std::cout << "Hello from C++!" << std::endl;
  return 0;
}
`,
  },
  csharp: {
    file: 'Program.cs',
    language: 'csharp',
    content: `using System;
class Program {
  static void Main() {
    Console.WriteLine("Hello from C#!");
  }
}
`,
  },
  go: {
    file: 'main.go',
    language: 'go',
    content: `package main
import "fmt"
func main() {
  fmt.Println("Hello from Go!")
}
`,
  },
  rust: {
    file: 'main.rs',
    language: 'rust',
    content: `fn main() {
  println!("Hello from Rust!");
}
`,
  },
  php: {
    file: 'index.php',
    language: 'php',
    content: `<?php
echo "Hello from PHP!\\n";
`,
  },
  ruby: {
    file: 'main.rb',
    language: 'ruby',
    content: `puts "Hello from Ruby!"
`,
  },
  swift: {
    file: 'main.swift',
    language: 'swift',
    content: `print("Hello from Swift!")
`,
  },
  kotlin: {
    file: 'Main.kt',
    language: 'kotlin',
    content: `fun main() {
  println("Hello from Kotlin!")
}
`,
  },
  lua: {
    file: 'main.lua',
    language: 'lua',
    content: `print("Hello from Lua!")
`,
  },
  sql: {
    file: 'query.sql',
    language: 'sql',
    content: `-- query.sql
SELECT 'Hello from SQL!' AS message;
`,
  },
  bash: {
    file: 'script.sh',
    language: 'shell',
    content: `#!/bin/bash
echo "Hello from Bash!"
`,
  },
  shell: {
    file: 'script.sh',
    language: 'shell',
    content: `#!/bin/sh
echo "Hello from Shell!"
`,
  },
  assembly: {
    file: 'main.asm',
    language: 'plaintext',
    content: `; Assembly (x86 NASM style)
section .data
  msg db "Hello", 10
section .text
  global _start
_start:
  ; write your code
`,
  },
  perl: {
    file: 'main.pl',
    language: 'perl',
    content: `print "Hello from Perl!\\n";
`,
  },
  r: {
    file: 'script.R',
    language: 'r',
    content: `print("Hello from R!")
`,
  },
  dart: {
    file: 'main.dart',
    language: 'dart',
    content: `void main() {
  print('Hello from Dart!');
}
`,
  },
  scala: {
    file: 'Main.scala',
    language: 'scala',
    content: `object Main {
  def main(args: Array[String]): Unit = {
    println("Hello from Scala!")
  }
}
`,
  },
  groovy: {
    file: 'Main.groovy',
    language: 'groovy',
    content: `println "Hello from Groovy!"
`,
  },
  haskell: {
    file: 'Main.hs',
    language: 'plaintext',
    content: `main = putStrLn "Hello from Haskell!"
`,
  },
  elixir: {
    file: 'main.exs',
    language: 'plaintext',
    content: `IO.puts "Hello from Elixir!"
`,
  },
  erlang: {
    file: 'main.erl',
    language: 'plaintext',
    content: `-module(main).
-export([start/0]).
start() -> io:format("Hello from Erlang!~n").
`,
  },
  clojure: {
    file: 'main.clj',
    language: 'plaintext',
    content: `(println "Hello from Clojure!")
`,
  },
  fsharp: {
    file: 'Program.fs',
    language: 'plaintext',
    content: `printfn "Hello from F#!"
`,
  },
  fortran: {
    file: 'main.f90',
    language: 'plaintext',
    content: `program hello
  print *, "Hello from Fortran!"
end program hello
`,
  },
  pascal: {
    file: 'main.pas',
    language: 'pascal',
    content: `program Hello;
begin
  writeln('Hello from Pascal!');
end.
`,
  },
  vb: {
    file: 'Program.vb',
    language: 'vb',
    content: `Module Program
  Sub Main()
    Console.WriteLine("Hello from VB.NET!")
  End Sub
End Module
`,
  },
  'objective-c': {
    file: 'main.m',
    language: 'objective-c',
    content: `#import <Foundation/Foundation.h>
int main() {
  @autoreleasepool {
    NSLog(@"Hello from Objective-C!");
  }
  return 0;
}
`,
  },
  julia: {
    file: 'main.jl',
    language: 'plaintext',
    content: `println("Hello from Julia!")
`,
  },
  zig: {
    file: 'main.zig',
    language: 'plaintext',
    content: `const std = @import("std");
pub fn main() void {
    std.debug.print("Hello from Zig!\\n", .{});
}
`,
  },
  nim: {
    file: 'main.nim',
    language: 'plaintext',
    content: `echo "Hello from Nim!"
`,
  },
  crystal: {
    file: 'main.cr',
    language: 'plaintext',
    content: `puts "Hello from Crystal!"
`,
  },
  coffeescript: {
    file: 'main.coffee',
    language: 'coffeescript',
    content: `console.log "Hello from CoffeeScript!"
`,
  },
  deno: {
    file: 'main.ts',
    language: 'typescript',
    content: `// Deno
console.log("Hello from Deno!");
`,
  },
  bun: {
    file: 'index.ts',
    language: 'typescript',
    content: `// Bun
console.log("Hello from Bun!");
`,
  },
  plaintext: {
    file: 'notes.txt',
    language: 'plaintext',
    content: '',
  },
  react: {
    file: 'App.jsx',
    language: 'javascript',
    content: `export default function App() {
  return <h1>Hello from React!</h1>;
}
`,
  },
  vue: {
    file: 'App.vue',
    language: 'html',
    content: `<template>
  <h1>Hello from Vue!</h1>
</template>
<script setup>
</script>
<style scoped>
</style>
`,
  },
  angular: {
    file: 'app.component.ts',
    language: 'typescript',
    content: `import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  template: '<h1>Hello from Angular!</h1>',
})
export class AppComponent {}
`,
  },
  svelte: {
    file: 'App.svelte',
    language: 'html',
    content: `<script>
  let name = 'Svelte';
</script>
<h1>Hello from {name}!</h1>
`,
  },
  tailwind: {
    file: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white p-8">
  <h1 class="text-3xl font-bold text-sky-400">Hello Tailwind!</h1>
</body>
</html>
`,
  },
  bootstrap: {
    file: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html>
<head>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="p-4">
  <h1 class="text-primary">Hello Bootstrap!</h1>
</body>
</html>
`,
  },
  jquery: {
    file: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html>
<head>
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</head>
<body>
  <h1 id="t">Hello jQuery!</h1>
  <script>$('#t').css('color', 'steelblue');</script>
</body>
</html>
`,
  },
  htmx: {
    file: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/htmx.org@2.0.0"></script>
</head>
<body>
  <button hx-get="/api/hello" hx-swap="outerHTML">Click me</button>
</body>
</html>
`,
  },
  threejs: {
    file: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html>
<body style="margin:0">
<canvas id="c"></canvas>
<script type="module">
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('c')});
renderer.setSize(innerWidth, innerHeight);
const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial());
scene.add(mesh); camera.position.z = 3;
(function animate(){ requestAnimationFrame(animate); mesh.rotation.y += 0.01; renderer.render(scene, camera); })();
</script>
</body>
</html>
`,
  },
  d3: {
    file: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html>
<head><script src="https://cdn.jsdelivr.net/npm/d3@7"></script></head>
<body>
<script>
d3.select('body').append('h1').text('Hello D3!').style('color', 'steelblue');
</script>
</body>
</html>
`,
  },
  chartjs: {
    file: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html>
<head><script src="https://cdn.jsdelivr.net/npm/chart.js"></script></head>
<body>
<canvas id="c" width="400" height="200"></canvas>
<script>
new Chart(document.getElementById('c'), {
  type: 'bar',
  data: { labels: ['A','B','C'], datasets: [{ label: 'Demo', data: [3,7,4] }] }
});
</script>
</body>
</html>
`,
  },
  mysql: {
    file: 'query.sql',
    language: 'sql',
    content: `-- MySQL
SELECT 'Hello from MySQL!' AS message;
`,
  },
  postgresql: {
    file: 'query.sql',
    language: 'sql',
    content: `-- PostgreSQL
SELECT 'Hello from PostgreSQL!' AS message;
`,
  },
  mongodb: {
    file: 'query.js',
    language: 'javascript',
    content: `// MongoDB shell style
db.users.find({ active: true })
`,
  },
  sqlite: {
    file: 'query.sql',
    language: 'sql',
    content: `-- SQLite
SELECT 'Hello from SQLite!' AS message;
`,
  },
  redis: {
    file: 'commands.txt',
    language: 'plaintext',
    content: `SET greeting "Hello from Redis!"
GET greeting
`,
  },
};

const LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍', group: 'Programming' },
  { id: 'java', name: 'Java', icon: '☕', group: 'Programming' },
  { id: 'c', name: 'C', icon: 'C', group: 'Programming' },
  { id: 'cpp', name: 'C++', icon: 'C++', group: 'Programming' },
  { id: 'javascript', name: 'JavaScript', icon: 'JS', group: 'Programming' },
  { id: 'typescript', name: 'TypeScript', icon: 'TS', group: 'Programming' },
  { id: 'nodejs', name: 'NodeJS', icon: '🟢', group: 'Programming' },
  { id: 'lua', name: 'Lua', icon: '🌙', group: 'Programming' },
  { id: 'php', name: 'PHP', icon: '🐘', group: 'Programming' },
  { id: 'csharp', name: 'C#', icon: '♯', group: 'Programming' },
  { id: 'go', name: 'Go', icon: '🐹', group: 'Programming' },
  { id: 'rust', name: 'Rust', icon: '🦀', group: 'Programming' },
  { id: 'ruby', name: 'Ruby', icon: '💎', group: 'Programming' },
  { id: 'swift', name: 'Swift', icon: '🐦', group: 'Programming' },
  { id: 'kotlin', name: 'Kotlin', icon: '🅺', group: 'Programming' },
  { id: 'sql', name: 'SQL', icon: '🗃️', group: 'Programming' },
  { id: 'bash', name: 'Bash', icon: '💻', group: 'Programming' },
  { id: 'shell', name: 'Shell', icon: '📟', group: 'Programming' },
  { id: 'assembly', name: 'Assembly', icon: '⚙️', group: 'Programming' },
  { id: 'perl', name: 'Perl', icon: '🐪', group: 'Programming' },
  { id: 'r', name: 'R', icon: '📊', group: 'Programming' },
  { id: 'dart', name: 'Dart', icon: '🎯', group: 'Programming' },
  { id: 'scala', name: 'Scala', icon: '🔴', group: 'Programming' },
  { id: 'groovy', name: 'Groovy', icon: '🎵', group: 'Programming' },
  { id: 'haskell', name: 'Haskell', icon: 'λ', group: 'Programming' },
  { id: 'elixir', name: 'Elixir', icon: '💧', group: 'Programming' },
  { id: 'erlang', name: 'Erlang', icon: '📞', group: 'Programming' },
  { id: 'clojure', name: 'Clojure', icon: 'λ', group: 'Programming' },
  { id: 'fsharp', name: 'F#', icon: 'F#', group: 'Programming' },
  { id: 'fortran', name: 'Fortran', icon: '𝔽', group: 'Programming' },
  { id: 'pascal', name: 'Pascal', icon: '📐', group: 'Programming' },
  { id: 'vb', name: 'VB.NET', icon: 'VB', group: 'Programming' },
  { id: 'objective-c', name: 'Objective-C', icon: '🍎', group: 'Programming' },
  { id: 'julia', name: 'Julia', icon: '🔬', group: 'Programming' },
  { id: 'zig', name: 'Zig', icon: '⚡', group: 'Programming' },
  { id: 'nim', name: 'Nim', icon: '👑', group: 'Programming' },
  { id: 'crystal', name: 'Crystal', icon: '💎', group: 'Programming' },
  { id: 'coffeescript', name: 'CoffeeScript', icon: '☕', group: 'Programming' },
  { id: 'deno', name: 'Deno', icon: '🦕', group: 'Programming' },
  { id: 'bun', name: 'Bun', icon: '🥟', group: 'Programming' },
  { id: 'plaintext', name: 'Text', icon: '📄', group: 'Programming' },
  { id: 'html', name: 'HTML', icon: '🌐', group: 'Web' },
  { id: 'css', name: 'CSS', icon: '🎨', group: 'Web' },
  { id: 'react', name: 'React', icon: '⚛️', group: 'Web' },
  { id: 'vue', name: 'Vue', icon: '💚', group: 'Web' },
  { id: 'angular', name: 'Angular', icon: '🅰️', group: 'Web' },
  { id: 'svelte', name: 'Svelte', icon: '🔥', group: 'Web' },
  { id: 'tailwind', name: 'Tailwind CSS', icon: '🌊', group: 'Web' },
  { id: 'bootstrap', name: 'Bootstrap', icon: '🅱️', group: 'Web' },
  { id: 'jquery', name: 'jQuery', icon: '💙', group: 'Web' },
  { id: 'htmx', name: 'HTMX', icon: '⚡', group: 'Web' },
  { id: 'threejs', name: 'Three.js', icon: '🎲', group: 'Web' },
  { id: 'd3', name: 'D3.js', icon: '📈', group: 'Web' },
  { id: 'chartjs', name: 'Chart.js', icon: '📊', group: 'Web' },
  { id: 'mysql', name: 'MySQL', icon: '🐬', group: 'Database' },
  { id: 'postgresql', name: 'PostgreSQL', icon: '🐘', group: 'Database' },
  { id: 'mongodb', name: 'MongoDB', icon: '🍃', group: 'Database' },
  { id: 'sqlite', name: 'SQLite', icon: '💿', group: 'Database' },
  { id: 'redis', name: 'Redis', icon: '🔴', group: 'Database' },
];

function uniqueFileName(desired: string, existingNames: string[]): string {
  if (!existingNames.includes(desired)) return desired;
  const dot = desired.lastIndexOf('.');
  const base = dot > 0 ? desired.slice(0, dot) : desired;
  const ext = dot > 0 ? desired.slice(dot) : '';
  let i = 2;
  while (existingNames.includes(`${base}${i}${ext}`)) i++;
  return `${base}${i}${ext}`;
}

export function LanguagePicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick?: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const createFile = useFSStore((s) => s.createFile);
  const nodes = useFSStore((s) => s.nodes);
  const openTab = useEditorStore((s) => s.openTab);

  const filtered = useMemo(() => {
    if (!q.trim()) return LANGUAGES;
    const lower = q.toLowerCase();
    return LANGUAGES.filter(
      (l) => l.name.toLowerCase().includes(lower) || l.id.includes(lower)
    );
  }, [q]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof LANGUAGES>();
    filtered.forEach((l) => {
      if (!map.has(l.group)) map.set(l.group, []);
      map.get(l.group)!.push(l);
    });
    return map;
  }, [filtered]);

  function pick(id: string) {
    // Change language of existing tab only
    if (onPick) {
      onPick(id);
      onClose();
      return;
    }

    // ALWAYS ADD a new file — never wipe existing tabs/project
    const meta = LANG_META[id] || {
      file: `${id}.txt`,
      language: 'plaintext',
      content: `// ${id}\n`,
    };
    const existing = Object.values(nodes).map((n) => n.name);
    const fileName = uniqueFileName(meta.file, existing);
    const fileId = createFile(fileName, null, meta.content, meta.language);
    openTab(fileId);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[6vh] bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-[780px] max-h-[85vh] mx-4 glass rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-[var(--border)]">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-semibold">Choose Language</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--hover)]">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search languages..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] outline-none focus:border-[var(--accent)] text-sm"
            />
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-2">
            Chọn language sẽ <strong>thêm file mới</strong> — không xóa tab đang mở.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {Array.from(groups.entries()).map(([group, langs]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
                {group}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {langs.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => pick(l.id)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--hover)] transition-all"
                  >
                    <span className="text-xl leading-none w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-sm font-bold">
                      {l.icon}
                    </span>
                    <span className="text-[11px] truncate w-full text-center">{l.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-[var(--text-secondary)] py-8">No language found</p>
          )}
        </div>
      </div>
    </div>
  );
}
