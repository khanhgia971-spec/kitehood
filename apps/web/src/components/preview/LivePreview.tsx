import { useMemo, useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Monitor, Smartphone, Tablet, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { useFSStore } from '../../stores/fs';
import { usePreviewStore } from '../../stores/preview';
import { runRemoteCode } from '../../lib/codeRunner';
import { detectLangFromFile } from '../../lib/languages';
import { useEditorStore } from '../../stores/editor';

type FileEntry = {
  id: string;
  name: string;
  path: string;
  content?: string;
  language?: string;
};

function findFile(href: string, files: FileEntry[]): FileEntry | undefined {
  const raw = (href || '').trim();
  if (!raw || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(raw)) return undefined;
  if (raw.startsWith('#')) return undefined;

  const clean = raw
    .replace(/^\.\//, '')
    .replace(/^\//, '')
    .split('?')[0]
    .split('#')[0]
    .replace(/\\/g, '/');
  if (!clean) return undefined;
  const base = clean.split('/').pop() || clean;

  return (
    files.find((f) => f.path === clean) ||
    files.find((f) => f.path.endsWith('/' + clean)) ||
    files.find((f) => f.name === clean || f.name === base) ||
    files.find((f) => f.name.toLowerCase() === base.toLowerCase()) ||
    files.find((f) => f.path.toLowerCase().endsWith('/' + base.toLowerCase()))
  );
}

function isCssFile(f: FileEntry) {
  return (
    f.language === 'css' ||
    f.language === 'scss' ||
    f.language === 'less' ||
    /\.(css|scss|less)$/i.test(f.name)
  );
}

function isJsFile(f: FileEntry) {
  return (
    f.language === 'javascript' ||
    f.language === 'typescript' ||
    f.language === 'nodejs' ||
    f.language === 'jsx' ||
    f.language === 'tsx' ||
    /\.(js|mjs|cjs|jsx|ts|tsx)$/i.test(f.name)
  );
}

function isHtmlFile(f: FileEntry) {
  return f.language === 'html' || /\.html?$/i.test(f.name);
}

/**
 * Resolve local assets by INLINING (not data-URI).
 * data: scripts inside srcDoc are often blocked by browsers — inline works reliably.
 * External https:// links (Google Fonts, CDN) are left untouched.
 */
function resolveAssets(html: string, files: FileEntry[]): string {
  let out = html;

  // <link href="local.css"> → <style>...</style>  (keep external CDN/fonts)
  out = out.replace(
    /<link\b([^>]*)\bhref\s*=\s*["']([^"']+)["']([^>]*)\/?>/gi,
    (full, pre: string, href: string, post: string) => {
      if (/^(https?:|\/\/|data:)/i.test(href.trim())) return full; // external — keep
      const file = findFile(href, files);
      if (file && file.content != null && (isCssFile(file) || /\.css$/i.test(href))) {
        return `<style data-from="${file.path}">\n${file.content}\n</style>`;
      }
      return full;
    }
  );

  // <script src="local.js"></script> → <script>...</script>
  out = out.replace(
    /<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
    (full, pre: string, src: string, post: string) => {
      if (/^(https?:|\/\/|data:)/i.test(src.trim())) return full; // CDN — keep
      const file = findFile(src, files);
      if (file && file.content != null && (isJsFile(file) || /\.(js|mjs|cjs)$/i.test(src))) {
        let attrs = `${pre}${post}`.replace(/\s*src\s*=\s*["'][^"']*["']/i, '');
        // type=module often breaks inline in srcDoc — strip for local
        attrs = attrs.replace(/\s*type\s*=\s*["']module["']/i, '');
        return `<script${attrs} data-from="${file.path}">\n${file.content}\n<\/script>`;
      }
      return full;
    }
  );

  // Self-closing <script src="x.js" />
  out = out.replace(
    /<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*)\/>/gi,
    (full, pre: string, src: string, post: string) => {
      if (/^(https?:|\/\/|data:)/i.test(src.trim())) return full;
      const file = findFile(src, files);
      if (file && file.content != null && (isJsFile(file) || /\.js$/i.test(src))) {
        return `<script data-from="${file.path}">\n${file.content}\n<\/script>`;
      }
      return full;
    }
  );

  // Local anchors → stay inside preview via postMessage
  out = out.replace(
    /<a\b([^>]*)\bhref\s*=\s*["']([^"']+)["']([^>]*)>/gi,
    (full, pre: string, href: string, post: string) => {
      if (/^(https?:|mailto:|tel:|#|data:|javascript:)/i.test(href)) {
        if (/^https?:/i.test(href)) {
          return `<a${pre}href="${href}"${post} target="_blank" rel="noopener noreferrer">`;
        }
        return full;
      }
      return `<a${pre}href="#"${post} data-mhc-href="${href.replace(/"/g, '&quot;')}">`;
    }
  );

  const guard = `<script data-mhc-guard>
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest&&e.target.closest('a');
  if(!a)return;
  var local=a.getAttribute('data-mhc-href');
  if(local){
    e.preventDefault();
    e.stopPropagation();
    parent.postMessage({type:'mhc-nav',href:local},'*');
    return;
  }
  var h=a.getAttribute('href')||'';
  if(h && !/^(https?:|mailto:|tel:|#|javascript:)/i.test(h)){
    e.preventDefault();
  }
},true);
window.addEventListener('error',function(ev){
  try{parent.postMessage({type:'mhc-preview-error',message:String(ev.message||ev.error||'error')},'*');}catch(x){}
});
<\/script>`;

  if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, guard + '</body>');
  } else if (/<\/html>/i.test(out)) {
    out = out.replace(/<\/html>/i, guard + '</html>');
  } else {
    out = out + guard;
  }

  return out;
}

/** Build a full HTML document when user is editing CSS or JS only */
function wrapNonHtml(file: FileEntry, files: FileEntry[]): string {
  if (isCssFile(file)) {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CSS Preview · ${file.name}</title>
<style>
${file.content || ''}
</style>
</head>
<body>
  <main style="font-family:system-ui;padding:1.5rem;max-width:640px;margin:0 auto">
    <h1>CSS Preview</h1>
    <p>File <code>${file.name}</code> đang được áp dụng lên trang mẫu này.</p>
    <button type="button">Nút mẫu</button>
    <div class="card" style="margin-top:1rem;padding:1rem;border:1px solid #ccc;border-radius:8px">
      <p>Khối .card mẫu — thêm class trong CSS để xem hiệu ứng.</p>
    </div>
  </main>
</body>
</html>`;
  }

  if (isJsFile(file)) {
    // Prefer an existing HTML that already references this script
    const htmlThatRefs = files.find(
      (f) =>
        isHtmlFile(f) &&
        f.content &&
        (f.content.includes(file.name) || f.content.includes(file.path))
    );
    if (htmlThatRefs?.content) {
      return resolveAssets(htmlThatRefs.content, files);
    }
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>JS Preview · ${file.name}</title>
</head>
<body>
  <main style="font-family:system-ui;padding:1.5rem">
    <h1>JS Preview</h1>
    <p id="msg">Chạy <code>${file.name}</code>…</p>
    <pre id="out" style="background:#111;color:#0f0;padding:12px;border-radius:8px;min-height:80px"></pre>
  </main>
  <script>
(function(){
  var logs=[];
  var out=document.getElementById('out');
  var _log=console.log;
  console.log=function(){
    logs.push([].slice.call(arguments).map(String).join(' '));
    out.textContent=logs.join('\\n');
    _log.apply(console,arguments);
  };
  try {
${file.content || ''}
  } catch(e) {
    out.textContent='Error: '+e.message;
    out.style.color='#f66';
  }
})();
  <\/script>
</body>
</html>`;
  }

  // Plain text / other
  return `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem">
<pre style="white-space:pre-wrap">${(file.content || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre>
</body></html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function LivePreview() {
  const setOpen = usePreviewStore((s) => s.setOpen);
  const defaultFileId = usePreviewStore((s) => s.defaultFileId);
  const previewSourceId = usePreviewStore((s) => s.previewSourceId);
  const refreshToken = usePreviewStore((s) => s.refreshToken);
  const { nodes, getPath } = useFSStore();
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tabs = useEditorStore((s) => s.tabs);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'phone'>('desktop');
  const [key, setKey] = useState(0);
  const [pagePath, setPagePath] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remoteHtml, setRemoteHtml] = useState<string | null>(null);
  const [remoteBusy, setRemoteBusy] = useState(false);
  /** PERF: snapshot chi cap nhat khi bam Preview/Refresh — khong theo moi phim go */
  const [snapshotHtml, setSnapshotHtml] = useState<string>('');
  const [snapshotPath, setSnapshotPath] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const files: FileEntry[] = useMemo(() => {
    return Object.values(nodes)
      .filter((n) => n.type === 'file')
      .map((f) => ({
        id: f.id,
        name: f.name,
        path: getPath(f.id) || f.name,
        content: f.content,
        language: f.language,
      }));
  }, [nodes, getPath]);

  /**
   * Priority (Set default KHONG khoa preview khi doi tab):
   * 1) pagePath — dieu huong / click link trong preview (CSS/JS/HTML lien ket van chay)
   * 2) previewSourceId — file user bam nut Preview (doi tab + Preview = doi nguon)
   * 3) active tab neu la html/css/js (preview dang mo, user doi tab web)
   * 4) defaultFileId — chi khi chua chon preview nao (lan dau / sau F5)
   */
  const currentFile = useMemo(() => {
    if (pagePath) {
      return (
        findFile(pagePath, files) ||
        files.find((f) => f.path === pagePath || f.name === pagePath)
      );
    }

    if (previewSourceId) {
      const src = files.find((f) => f.id === previewSourceId);
      if (src) return src;
    }

    if (activeTabId) {
      const tab = tabs.find((t) => t.id === activeTabId);
      const fileId = tab?.fileId || activeTabId;
      const node = files.find((f) => f.id === fileId);
      if (node) return node; // moi ngon ngu — web hoac C/Python…
    }

    if (defaultFileId) {
      const def = files.find((f) => f.id === defaultFileId);
      if (def) return def;
    }

    return undefined;
  }, [files, pagePath, previewSourceId, activeTabId, tabs, defaultFileId]);

  const srcDoc = useMemo(() => {
    if (!currentFile) {
      return `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;color:#666;background:#fafafa">
        <h2 style="color:#333">Chưa có file để Preview</h2>
        <p>Mở tab HTML/CSS/JS rồi bấm nút <b>Preview</b>. Có thể <b>Set default</b> để lần sau tự ưu tiên file đó.</p>
        <p style="font-size:13px">Ví dụ liên kết local (sẽ được nhúng tự động):<br/>
        &lt;link rel="stylesheet" href="styles.css"&gt;<br/>
        &lt;script src="main.js"&gt;&lt;/script&gt;</p>
      </body></html>`;
    }

    if (isHtmlFile(currentFile) && currentFile.content) {
      return resolveAssets(currentFile.content, files);
    }

    // CSS / JS active tab → wrap
    if (isCssFile(currentFile) || isJsFile(currentFile)) {
      return wrapNonHtml(currentFile, files);
    }

    if (currentFile.content) {
      return resolveAssets(currentFile.content, files);
    }

    return `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;color:#666">
      <p>File <b>${currentFile.name}</b> đang trống.</p>
    </body></html>`;
  }, [currentFile, files, key]);


  // Non-web languages → run remote & show in Preview
  useEffect(() => {
    if (!currentFile) {
      setRemoteHtml(null);
      return;
    }
    if (isHtmlFile(currentFile) || isCssFile(currentFile) || isJsFile(currentFile)) {
      setRemoteHtml(null);
      return;
    }
    const lang =
      detectLangFromFile(currentFile.name, currentFile.language) ||
      currentFile.language ||
      'c';
    const code = currentFile.content || '';
    if (!code.trim()) {
      setRemoteHtml(`<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;background:#0f172a;color:#e2e8f0">
        <h2>File trống</h2><p>${currentFile.name}</p></body></html>`);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
    setRemoteBusy(true);
    setRemoteHtml(`<!DOCTYPE html><html><body style="font-family:ui-monospace,monospace;padding:1.5rem;background:#0f172a;color:#94a3b8">
      <p>Đang chạy <b style="color:#38bdf8">${lang}</b> · ${currentFile.name}…</p>
    </body></html>`);
    (async () => {
      try {
        const r = await runRemoteCode(lang, code, '');
        if (cancelled) return;
        const ok = r.exitCode === 0;
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#0b1220;color:#e2e8f0}
  .bar{display:flex;gap:10px;align-items:center;padding:10px 14px;background:#111827;border-bottom:1px solid #1f2937}
  .ok{color:#4ade80}.err{color:#f87171}.muted{color:#94a3b8;font-size:12px}
  pre{margin:0;padding:16px;white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.5}
  .sec{border-top:1px solid #1f2937;padding:12px 16px}
  h3{margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#64748b}
</style></head><body>
  <div class="bar">
    <span class="${ok ? 'ok' : 'err'}">${ok ? '✓ OK' : '✕ Error'} exit ${r.exitCode}</span>
    <span class="muted">${lang} · ${currentFile.name}</span>
    <span class="muted" style="margin-left:auto">${r.backend || ''}${r.timeMs ? ' · ' + r.timeMs + 'ms' : ''}</span>
  </div>
  ${r.stdout ? `<div class="sec"><h3>stdout</h3><pre>${escapeHtml(r.stdout)}</pre></div>` : ''}
  ${r.stderr ? `<div class="sec"><h3>stderr</h3><pre class="err">${escapeHtml(r.stderr)}</pre></div>` : ''}
  ${!r.stdout && !r.stderr ? `<div class="sec"><pre class="muted">(no output)</pre></div>` : ''}
</body></html>`;
        setRemoteHtml(html);
      } catch (e: any) {
        if (cancelled) return;
        setRemoteHtml(`<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;background:#0f172a;color:#f87171">
          <h2>Lỗi chạy code</h2><pre>${String(e?.message || e)}</pre></body></html>`);
      } finally {
        if (!cancelled) setRemoteBusy(false);
      }
    })();
    }, 900);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [currentFile?.id, currentFile?.content, currentFile?.name, currentFile?.language, refreshToken]);


  // Live Preview: cap nhat sau moi lan go (debounce 280ms) — muot, it giat CPU
  useEffect(() => {
    if (!currentFile) {
      setSnapshotHtml('');
      setSnapshotPath('');
      return;
    }
    // Chi HTML/CSS/JS live; ngon ngu compile do effect remote lo
    if (!(isHtmlFile(currentFile) || isCssFile(currentFile) || isJsFile(currentFile))) {
      return;
    }
    const handle = window.setTimeout(() => {
      let html = '';
      if (isHtmlFile(currentFile) && currentFile.content) {
        html = resolveAssets(currentFile.content, files);
      } else if (isCssFile(currentFile) || isJsFile(currentFile)) {
        html = wrapNonHtml(currentFile, files);
      } else if (currentFile.content) {
        html = resolveAssets(currentFile.content, files);
      } else {
        html = `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;color:#666">File trống</body></html>`;
      }
      setSnapshotHtml(html);
      setSnapshotPath(currentFile.path || currentFile.name || '');
      setKey((k) => k + 1);
    }, 280);
    return () => window.clearTimeout(handle);
  }, [currentFile?.id, currentFile?.content, files, refreshToken]);


  // Bam Preview tab moi → reset dieu huong trong iframe (giu link van resolve asset)
  useEffect(() => {
    if (previewSourceId) setPagePath(null);
  }, [previewSourceId]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'mhc-nav' && typeof e.data.href === 'string') {
        const target = findFile(e.data.href, files);
        if (target) {
          setPagePath(target.path);
          setKey((k) => k + 1);
        }
      }
      if (e.data?.type === 'mhc-preview-error') {
        setErrorMsg(String(e.data.message || 'Lỗi trong Preview'));
      }
    };
    const onImport = () => {
      setPagePath(null);
      setKey((k) => k + 1);
    };
    window.addEventListener('message', onMsg);
    window.addEventListener('fs:imported', onImport);
    return () => {
      window.removeEventListener('message', onMsg);
      window.removeEventListener('fs:imported', onImport);
    };
  }, [files]);

  const widthClass =
    device === 'phone' ? 'max-w-[375px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-full';

  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-[99999] flex flex-col w-screen h-screen'
          : 'flex flex-col h-full min-w-[280px] w-full'
      }
      style={{
        background: 'var(--bg-secondary)',
        borderLeft: fullscreen ? 'none' : '1px solid var(--border)',
      }}
    >
      <div
        className="h-10 flex items-center gap-2 px-3 shrink-0"
        style={{
          borderBottom: '1px solid var(--border)',
          background: fullscreen ? 'var(--bg-tertiary)' : undefined,
        }}
      >
        <span className="text-[12px] font-medium flex-1 truncate">
          Preview{currentFile ? ` · ${currentFile.name}` : ''}
          {fullscreen ? ' · Fullscreen' : ''}
        </span>
        <button title="Desktop" onClick={() => setDevice('desktop')} className="icon-btn">
          <Monitor size={14} style={{ color: device === 'desktop' ? 'var(--accent)' : undefined }} />
        </button>
        <button title="Tablet" onClick={() => setDevice('tablet')} className="icon-btn">
          <Tablet size={14} style={{ color: device === 'tablet' ? 'var(--accent)' : undefined }} />
        </button>
        <button title="Phone" onClick={() => setDevice('phone')} className="icon-btn">
          <Smartphone size={14} style={{ color: device === 'phone' ? 'var(--accent)' : undefined }} />
        </button>
        <button
          title="Refresh"
          onClick={() => {
            setErrorMsg(null);
            setPagePath(null);
            setKey((k) => k + 1);
          }}
          className="icon-btn"
        >
          <RefreshCw size={14} />
        </button>
        <button
          title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
          onClick={() => setFullscreen((v) => !v)}
          className="icon-btn"
          style={{ color: fullscreen ? 'var(--accent)' : undefined }}
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        {!fullscreen && (
          <button title="Close" onClick={() => setOpen(false)} className="icon-btn">
            <X size={14} />
          </button>
        )}
      </div>
      {errorMsg && (
        <div className="px-3 py-1.5 text-[11px] bg-red-500/15 text-red-400 border-b border-red-500/30 flex items-center gap-2">
          <span className="flex-1 truncate">{errorMsg}</span>
          <button className="underline" onClick={() => setErrorMsg(null)}>
            Ẩn
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto flex justify-center p-2" style={{ background: '#0a0a12' }}>
        <iframe
          ref={iframeRef}
          key={String(key) + '-' + (snapshotPath || '') + '-' + String(refreshToken)}
          title="preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          srcDoc={remoteHtml ?? (snapshotHtml || '<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;color:#888">Bấm <b>Preview</b> hoặc nút Refresh để cập nhật.</body></html>')}
          className={`w-full h-full bg-white rounded shadow-lg border-0 ${
            fullscreen && device === 'desktop' ? 'max-w-full' : widthClass
          }`}
        />
      </div>
      <div
        className="px-3 py-1 text-[10px] opacity-50 flex items-center gap-2 shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <ExternalLink size={10} />
        HTML/CSS/JS local được nhúng inline · CDN/Google Fonts giữ nguyên · Tab đang mở ưu tiên Preview
      </div>
    </div>
  );
}
