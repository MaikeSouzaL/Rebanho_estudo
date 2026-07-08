'use client';

import { openDB, type IDBPDatabase } from 'idb';

/**
 * Persistência local (Master Prompt §4/§9):
 * - IndexedDB → progresso, anotações do professor, quiz, XP.
 * - localStorage → perfil do aluno e preferências leves.
 * Sem servidor, sem credenciais. Tudo fica no dispositivo.
 */

// ----------------------------------------------------------------- Tipos
export interface ProgressoLicao {
  licaoId: string;
  ultimoIndice: number;
  concluidos: string[]; // ids de blocos com "Entendi"
  xp: number;
  /** respostas do quiz: índice da pergunta → escolha e acerto (1ª tentativa) */
  quiz: Record<number, { escolha: string; correta: boolean }>;
  licaoConcluida: boolean;
  atualizadoEm: number;
}

export type CorMarcaTexto = 'amarelo' | 'verde' | 'azul' | 'rosa';

export interface Anotacao {
  id: string;
  licaoId: string;
  /** chave do parágrafo: `${blocoId}#${indiceParagrafo}` */
  paraKey: string;
  inicio: number; // offset no texto puro do parágrafo
  fim: number;
  cor: CorMarcaTexto;
  /** balão do professor: o que lembrar/falar. '' = só marca-texto */
  nota: string;
  criadaEm: number;
}

export interface Perfil {
  nome: string;
  idade?: string;
  congregacao?: string;
  professor?: string;
  turma?: string;
}

// ------------------------------------------------------------- IndexedDB
const DB_NAME = 'ebd-em-foco';
const DB_VERSION = 2; // v2: + store 'narracao' (áudio TTS cacheado)

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains('progresso')) {
          d.createObjectStore('progresso', { keyPath: 'licaoId' });
        }
        if (!d.objectStoreNames.contains('anotacoes')) {
          const s = d.createObjectStore('anotacoes', { keyPath: 'id' });
          s.createIndex('porLicao', 'licaoId');
        }
        if (!d.objectStoreNames.contains('narracao')) {
          d.createObjectStore('narracao'); // chave = hash(texto|voz), valor = Blob WAV
        }
      },
    });
  }
  return dbPromise;
}

// ------------------------------------------------- cache de narração (TTS)
export async function lerNarracao(id: string): Promise<Blob | undefined> {
  return (await (await db()).get('narracao', id)) as Blob | undefined;
}

export async function salvarNarracao(id: string, audio: Blob): Promise<void> {
  await (await db()).put('narracao', audio, id);
}

export function progressoVazio(licaoId: string): ProgressoLicao {
  return {
    licaoId,
    ultimoIndice: 0,
    concluidos: [],
    xp: 0,
    quiz: {},
    licaoConcluida: false,
    atualizadoEm: Date.now(),
  };
}

export async function lerProgresso(licaoId: string): Promise<ProgressoLicao> {
  const v = (await (await db()).get('progresso', licaoId)) as ProgressoLicao | undefined;
  return v ?? progressoVazio(licaoId);
}

export async function salvarProgresso(p: ProgressoLicao): Promise<void> {
  p.atualizadoEm = Date.now();
  await (await db()).put('progresso', p);
}

export async function lerTodosProgressos(): Promise<ProgressoLicao[]> {
  return (await (await db()).getAll('progresso')) as ProgressoLicao[];
}

export async function lerAnotacoes(licaoId: string): Promise<Anotacao[]> {
  return (await (await db()).getAllFromIndex('anotacoes', 'porLicao', licaoId)) as Anotacao[];
}

export async function salvarAnotacao(a: Anotacao): Promise<void> {
  await (await db()).put('anotacoes', a);
}

export async function excluirAnotacao(id: string): Promise<void> {
  await (await db()).delete('anotacoes', id);
}

export function novoId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ------------------------------------------------------------ localStorage
const K_PERFIL = 'ebd:perfil';
const K_PROFESSOR = 'ebd:modoProfessor';

export function lerPerfil(): Perfil | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(K_PERFIL);
    return raw ? (JSON.parse(raw) as Perfil) : null;
  } catch {
    return null;
  }
}

export function salvarPerfil(p: Perfil): void {
  localStorage.setItem(K_PERFIL, JSON.stringify(p));
}

export function lerModoProfessor(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(K_PROFESSOR) === '1';
}

export function salvarModoProfessor(on: boolean): void {
  localStorage.setItem(K_PROFESSOR, on ? '1' : '0');
}

// ------------------------------------------------------------------ XP
export const XP_BLOCO = 10; // primeiro "Entendi" em um bloco
export const XP_ACERTO_QUIZ = 15; // acerto na 1ª tentativa
export const XP_CONCLUSAO = 50; // concluir a lição inteira
