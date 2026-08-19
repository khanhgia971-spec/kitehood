import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Exercise = {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  language: string;
  starterCode: string;
  hint?: string;
  solution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: number;
};

export type Chapter = {
  id: string;
  title: string;
  description: string;
  order: number;
};

export type Progress = {
  completedIds: string[];
  xp: number;
  streak: number;
  lastActive: number;
};

interface LearnState {
  chapters: Chapter[];
  exercises: Exercise[];
  progress: Progress;
  activeExerciseId: string | null;
  setActiveExercise: (id: string | null) => void;
  addChapter: (title: string, description?: string) => string;
  addExercise: (ex: Omit<Exercise, 'id' | 'createdAt'>) => string;
  importCurriculum: (chapters: Chapter[], exercises: Exercise[]) => void;
  markComplete: (exerciseId: string) => void;
  deleteChapter: (id: string) => void;
  deleteExercise: (id: string) => void;
  resetProgress: () => void;
}

const SEED_CHAPTERS: Chapter[] = [
  { id: 'ch1', title: 'HTML cơ bản', description: 'Cấu trúc trang web', order: 1 },
  { id: 'ch2', title: 'CSS trang trí', description: 'Màu, layout, flex', order: 2 },
  { id: 'ch3', title: 'JavaScript tương tác', description: 'DOM & sự kiện', order: 3 },
];

const SEED_EX: Exercise[] = [
  {
    id: 'ex1',
    chapterId: 'ch1',
    title: 'Tạo trang Hello',
    description: 'Viết HTML5 với h1 hiển thị "Xin chào KiteHood".',
    language: 'html',
    starterCode: '<!DOCTYPE html>\n<html>\n<head><meta charset="UTF-8"><title>Hello</title></head>\n<body>\n  <!-- Viết h1 ở đây -->\n</body>\n</html>',
    hint: 'Dùng thẻ <h1>...</h1>',
    difficulty: 'easy',
    createdAt: Date.now(),
  },
  {
    id: 'ex2',
    chapterId: 'ch1',
    title: 'Link CSS',
    description: 'Thêm <link rel="stylesheet" href="styles.css"> vào head.',
    language: 'html',
    starterCode: '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>Link CSS</title>\n</head>\n<body><p>Hello</p></body>\n</html>',
    difficulty: 'easy',
    createdAt: Date.now(),
  },
  {
    id: 'ex3',
    chapterId: 'ch2',
    title: 'Nút bấm đẹp',
    description: 'CSS cho button: nền xanh, chữ trắng, bo góc 8px.',
    language: 'css',
    starterCode: 'button {\n  /* viết CSS */\n}\n',
    difficulty: 'easy',
    createdAt: Date.now(),
  },
  {
    id: 'ex4',
    chapterId: 'ch3',
    title: 'Click đổi chữ',
    description: 'Khi bấm nút #btn, đổi textContent của #msg thành "Đã bấm!".',
    language: 'javascript',
    starterCode: "const btn = document.querySelector('#btn');\nconst msg = document.querySelector('#msg');\n// viết addEventListener\n",
    difficulty: 'medium',
    createdAt: Date.now(),
  },
];

export const useLearnStore = create<LearnState>()(
  persist(
    (set, get) => ({
      chapters: SEED_CHAPTERS,
      exercises: SEED_EX,
      progress: { completedIds: [], xp: 0, streak: 0, lastActive: Date.now() },
      activeExerciseId: null,
      setActiveExercise: (id) => set({ activeExerciseId: id }),
      addChapter: (title, description = '') => {
        const id = `ch_${Date.now()}`;
        const order = get().chapters.length + 1;
        set((s) => ({
          chapters: [...s.chapters, { id, title, description, order }],
        }));
        return id;
      },
      addExercise: (ex) => {
        const id = `ex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({
          exercises: [...s.exercises, { ...ex, id, createdAt: Date.now() }],
        }));
        return id;
      },
      importCurriculum: (chapters, exercises) =>
        set((s) => ({
          chapters: [...s.chapters, ...chapters],
          exercises: [...s.exercises, ...exercises],
        })),
      markComplete: (exerciseId) => {
        set((s) => {
          if (s.progress.completedIds.includes(exerciseId)) return s;
          const xpGain = 10;
          return {
            progress: {
              ...s.progress,
              completedIds: [...s.progress.completedIds, exerciseId],
              xp: s.progress.xp + xpGain,
              streak: s.progress.streak + 1,
              lastActive: Date.now(),
            },
          };
        });
        try {
          window.dispatchEvent(new CustomEvent('moihoccode:sync'));
        } catch {
          /* */
        }
      },
      deleteChapter: (id) =>
        set((s) => ({
          chapters: s.chapters.filter((c) => c.id !== id),
          exercises: s.exercises.filter((e) => e.chapterId !== id),
          activeExerciseId:
            s.exercises.find((e) => e.id === s.activeExerciseId)?.chapterId === id
              ? null
              : s.activeExerciseId,
        })),
      deleteExercise: (id) =>
        set((s) => ({
          exercises: s.exercises.filter((e) => e.id !== id),
          activeExerciseId: s.activeExerciseId === id ? null : s.activeExerciseId,
          progress: {
            ...s.progress,
            completedIds: s.progress.completedIds.filter((x) => x !== id),
          },
        })),
      resetProgress: () =>
        set({
          progress: { completedIds: [], xp: 0, streak: 0, lastActive: Date.now() },
        }),
    }),
    { name: 'moihoccode-learn-v1' }
  )
);
