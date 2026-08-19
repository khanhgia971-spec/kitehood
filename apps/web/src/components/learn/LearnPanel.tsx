import { useState } from 'react';
import {
  GraduationCap, Trophy, Sparkles, CheckCircle2, Circle, Play,
  Plus, Loader2, BookOpen, Trash2, CloudUpload, GraduationCap as Teach,
} from 'lucide-react';
import { useLearnStore, Exercise } from '../../stores/learn';
import { useFSStore } from '../../stores/fs';
import { useEditorStore } from '../../stores/editor';
import { useAIStore, callAIChat } from '../../stores/ai';
import { pushToCloud } from '../../lib/cloudSync';
import { useAuthStore } from '../../stores/auth';

export function LearnPanel() {
  const {
    chapters, exercises, progress, activeExerciseId,
    setActiveExercise, markComplete, addChapter, addExercise, importCurriculum,
    deleteChapter, deleteExercise,
  } = useLearnStore();
  const createFile = useFSStore((s) => s.createFile);
  const openTab = useEditorStore((s) => s.openTab);
  const apiKey = useAIStore((s) => s.apiKey);
  const newConversation = useAIStore((s) => s.newConversation);
  const addMessage = useAIStore((s) => s.addMessage);
  const setBusyAI = useAIStore((s) => s.setBusy);
  const token = useAuthStore((s) => s.token);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const sortedCh = [...chapters].sort((a, b) => a.order - b.order);
  const active = exercises.find((e) => e.id === activeExerciseId);

  function openExercise(ex: Exercise) {
    setActiveExercise(ex.id);
    const ext =
      ex.language === 'javascript' ? 'js' :
      ex.language === 'python' ? 'py' :
      ex.language === 'css' ? 'css' : 'html';
    const id = createFile(`bai-${ex.id}.${ext}`, null, ex.starterCode, ex.language);
    openTab(id);
  }

  /** Dạy lý thuyết trên AI Agent trước khi làm bài */
  async function teachExercise(ex: Exercise) {
    if (!apiKey) {
      setMsg('Cần API key trong AI Agent.');
      return;
    }
    setBusy(true);
    setMsg('AI đang soạn bài giảng…');
    try {
      newConversation();
      const ch = chapters.find((c) => c.id === ex.chapterId);
      const prompt = `Hãy DẠY (không giao bài ngay) cho học viên về bài: "${ex.title}".
Chương: ${ch?.title || ''}.
Mô tả bài tập (chỉ để bạn biết mục tiêu, CHƯA bắt làm): ${ex.description}
Language: ${ex.language}

Yêu cầu bài giảng:
1) Giải thích khái niệm liên quan thật dễ hiểu (tiếng Việt)
2) Ví dụ code ngắn, giải thích từng dòng
3) Lỗi hay gặp
4) Cuối cùng mới gợi ý: khi sẵn sàng hãy mở bài tập "${ex.title}" trong mục Học tập

Không bắt buộc làm bài ngay. Không chỉ đưa đáp án full.`;
      setBusyAI(true);
      addMessage('user', `Dạy bài: ${ex.title} (chương ${ch?.title || ''})`);
      const reply = await callAIChat(
        'Bạn là giáo viên lập trình kiên nhẫn. Dạy lý thuyết + ví dụ trước, không ép làm bài tập.',
        [],
        prompt
      );
      addMessage('assistant', reply);
      setMsg('Đã mở bài giảng trong AI Agent → xem tab AI');
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setBusyAI(false);
      setBusy(false);
    }
  }

  async function aiGenerateCurriculum() {
    if (!apiKey) {
      setMsg('Cần API key trong AI Agent trước.');
      return;
    }
    setBusy(true);
    setMsg('AI đang tạo chương & bài tập…');
    try {
      const prompt = `Tạo lộ trình học lập trình web cho người mới (tiếng Việt).
JSON thuần:
{"chapters":[{"id":"c1","title":"...","description":"...","order":1}],"exercises":[{"id":"e1","chapterId":"c1","title":"...","description":"...","language":"html","starterCode":"...","hint":"...","difficulty":"easy"}]}
6 chương, mỗi chương 3 bài. language: html|css|javascript.`;
      const raw = await callAIChat('Chỉ trả JSON hợp lệ.', [], prompt);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI không trả JSON');
      const data = JSON.parse(jsonMatch[0]);
      const ch = (data.chapters || []).map((c: any, i: number) => ({
        id: c.id || `ai_ch_${Date.now()}_${i}`,
        title: c.title || `Chương ${i + 1}`,
        description: c.description || '',
        order: c.order || chapters.length + i + 1,
      }));
      const ex = (data.exercises || []).map((e: any, i: number) => ({
        id: e.id || `ai_ex_${Date.now()}_${i}`,
        chapterId: e.chapterId || ch[0]?.id,
        title: e.title || `Bài ${i + 1}`,
        description: e.description || '',
        language: e.language || 'html',
        starterCode: e.starterCode || '',
        hint: e.hint,
        difficulty: e.difficulty || 'easy',
        createdAt: Date.now(),
      }));
      importCurriculum(ch, ex);
      setMsg(`+${ch.length} chương, +${ex.length} bài`);
      window.dispatchEvent(new CustomEvent('moihoccode:sync'));
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function aiMoreExercises(chapterId: string) {
    if (!apiKey) {
      setMsg('Cần API key trong AI Agent.');
      return;
    }
    const ch = chapters.find((c) => c.id === chapterId);
    setBusy(true);
    try {
      const raw = await callAIChat(
        'Chỉ trả JSON array.',
        [],
        `Thêm 4 bài tập cho chương "${ch?.title}". JSON: [{"title","description","language","starterCode","hint","difficulty"}]`
      );
      const arrMatch = raw.match(/\[[\s\S]*\]/);
      if (!arrMatch) throw new Error('Không parse được');
      JSON.parse(arrMatch[0]).forEach((e: any) => {
        addExercise({
          chapterId,
          title: e.title || 'Bài mới',
          description: e.description || '',
          language: e.language || 'html',
          starterCode: e.starterCode || '',
          hint: e.hint,
          difficulty: e.difficulty || 'easy',
        });
      });
      setMsg(`Đã thêm bài vào ${ch?.title}`);
      window.dispatchEvent(new CustomEvent('moihoccode:sync'));
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function pushCurriculumCloud() {
    if (!token) {
      setMsg('Đăng nhập để Push lên KV/D1');
      return;
    }
    setBusy(true);
    try {
      await pushToCloud();
      setMsg('Đã Push bài tập + tiến độ lên cloud');
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  /** Nộp bài → AI chấm JSON {pass, score, feedback} → chỉ +XP nếu đạt ≥60 */
  async function submitForGrading(ex: Exercise) {
    if (!apiKey) {
      setMsg('Cần API key trong AI Agent để AI chấm bài.');
      return;
    }
    setBusy(true);
    setMsg('AI đang chấm bài…');
    try {
      const fsState = useFSStore.getState();
      const edState = useEditorStore.getState();
      let code = '';
      if (edState.activeTabId) {
        const tab = edState.tabs.find((t) => t.id === edState.activeTabId);
        const fileId = tab?.fileId || edState.activeTabId;
        const node = fsState.nodes[fileId];
        if (node?.content != null) code = node.content;
      }
      if (!code.trim()) {
        const files = Object.values(fsState.nodes).filter(
          (n: any) => n.type === 'file' && (n.language === ex.language || (n.name && n.name.includes(ex.id)))
        ) as any[];
        code = files[files.length - 1]?.content || '';
      }
      if (!code.trim()) {
        setMsg('Chưa có code để nộp. Hãy mở / viết bài trong editor trước.');
        return;
      }

      const fence = String.fromCharCode(96, 96, 96); // ```
      const prompt =
        'Bạn là giáo viên chấm bài lập trình. Chấm bài sau và CHỈ trả về JSON thuần (không markdown):\n' +
        '{"pass":true|false,"score":0-100,"feedback":"nhận xét ngắn tiếng Việt"}\n\n' +
        'Bài: "' +
        ex.title +
        '"\nMô tả yêu cầu: ' +
        ex.description +
        '\nLanguage: ' +
        ex.language +
        '\nGợi ý (nếu có): ' +
        (ex.hint || '(không)') +
        '\n\nCode học viên nộp:\n' +
        fence +
        '\n' +
        code.slice(0, 8000) +
        '\n' +
        fence +
        '\n\nTiêu chí: đạt (pass=true) khi score >= 60. Đúng yêu cầu chính thì >= 70. Hoàn chỉnh đẹp >= 85. Sai hoàn toàn < 40.';

      const raw = await callAIChat(
        'Chỉ trả JSON hợp lệ {pass, score, feedback}. Không giải thích ngoài JSON.',
        [],
        prompt
      );
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI không trả JSON chấm điểm');
      const result = JSON.parse(jsonMatch[0]) as {
        pass?: boolean;
        score?: number;
        feedback?: string;
      };
      const score = typeof result.score === 'number' ? result.score : result.pass ? 70 : 40;
      const passed = result.pass === true || score >= 60;
      const feedback = result.feedback || (passed ? 'Đạt yêu cầu.' : 'Chưa đạt, hãy thử lại.');

      if (passed) {
        markComplete(ex.id);
        setMsg(`✓ Đạt ${score}/100 — +XP. ${feedback}`);
      } else {
        setMsg(`✗ Chưa đạt (${score}/100). Chưa cộng XP. ${feedback}`);
      }
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  const done = progress.completedIds.length;
  const total = exercises.length || 1;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-3 border-b space-y-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-[var(--accent)]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider flex-1">Học tập</span>
          <Trophy size={14} className="text-amber-400" />
          <span className="text-xs font-medium">{progress.xp} XP</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--hover)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), #a78bfa)' }}
          />
        </div>
        <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          <span>{done}/{exercises.length} bài · Streak {progress.streak}</span>
          <span>{pct}%</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <button className="btn-accent flex-1 py-1.5 text-[11px] flex items-center justify-center gap-1" disabled={busy} onClick={aiGenerateCurriculum}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            AI tạo lộ trình
          </button>
          <button className="btn-glass py-1.5 px-2 text-[11px] flex items-center gap-1" disabled={busy} onClick={pushCurriculumCloud} title="Push KV/D1">
            <CloudUpload size={12} /> Cloud
          </button>
        </div>
        <p className="text-[10px] opacity-60">Nên bấm <b>Dạy</b> trước → học trên AI Agent → rồi mới Làm bài.</p>
        {msg && <p className="text-[11px] text-[var(--accent)]">{msg}</p>}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {sortedCh.map((ch) => {
          const list = exercises.filter((e) => e.chapterId === ch.id);
          const chDone = list.filter((e) => progress.completedIds.includes(e.id)).length;
          return (
            <div key={ch.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}>
              <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <BookOpen size={13} className="text-[var(--accent)]" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[12px] truncate">{ch.title}</div>
                  <div className="text-[10px] opacity-60">{chDone}/{list.length} · {ch.description}</div>
                </div>
                <button className="icon-btn" title="AI thêm bài" onClick={() => aiMoreExercises(ch.id)}><Plus size={13} /></button>
                <button className="icon-btn" title="Xóa chương" style={{ color: '#f87171' }} onClick={() => {
                  if (confirm(`Xóa chương "${ch.title}" và mọi bài trong đó?`)) deleteChapter(ch.id);
                }}><Trash2 size={13} /></button>
              </div>
              <div className="p-1.5 space-y-1">
                {list.map((ex) => {
                  const ok = progress.completedIds.includes(ex.id);
                  return (
                    <div key={ex.id} className="flex items-start gap-1 px-1 py-1 rounded-lg" style={{ background: activeExerciseId === ex.id ? 'var(--accent-muted)' : 'transparent' }}>
                      <button className="flex-1 text-left flex gap-2 min-w-0" onClick={() => openExercise(ex)}>
                        {ok ? <CheckCircle2 size={14} className="text-green-400 shrink-0 mt-0.5" /> : <Circle size={14} className="opacity-40 shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium truncate">{ex.title}</div>
                          <div className="text-[10px] opacity-60">{ex.difficulty} · {ex.language}</div>
                        </div>
                      </button>
                      <button className="btn-glass px-1.5 py-0.5 text-[10px]" title="Dạy trên AI Agent" onClick={() => teachExercise(ex)}>Dạy</button>
                      <button className="icon-btn" title="Làm bài" onClick={() => openExercise(ex)}><Play size={12} /></button>
                      <button className="icon-btn" title="Xóa bài" onClick={() => deleteExercise(ex.id)} style={{ color: '#f87171' }}><Trash2 size={12} /></button>
                    </div>
                  );
                })}
                {!list.length && <p className="text-[11px] opacity-50 px-2 py-1">Chưa có bài — bấm +</p>}
              </div>
            </div>
          );
        })}
      </div>

      {active && (
        <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-medium">{active.title}</div>
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{active.description}</p>
          {active.hint && <p className="text-[11px] text-amber-400/90">Gợi ý: {active.hint}</p>}
          <div className="flex gap-1">
            <button className="btn-glass flex-1 py-1.5 text-xs" onClick={() => teachExercise(active)}>Dạy trên AI</button>
            <button className="btn-accent flex-1 py-1.5 text-xs" disabled={busy} onClick={() => submitForGrading(active)}>Nộp bài · AI chấm</button>
          </div>
        </div>
      )}
    </div>
  );
}
