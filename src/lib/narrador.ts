'use client';

import { lerNarracao, salvarNarracao } from './store';

/**
 * Narração profissional via Google AI Studio (Gemini TTS).
 * - A voz lê o texto de cada bloco/tela da lição.
 * - O áudio gerado é CACHEADO no IndexedDB: cada bloco é narrado 1x por
 *   aparelho; depois toca offline e sem custo de API.
 * - Sem internet/chave/erro → o chamador cai para a voz do dispositivo
 *   (Web Speech API), mantendo o app 100% funcional offline.
 *
 * A chave pode ser trocada sem rebuild: localStorage 'ebd:chaveNarracao'
 * tem prioridade sobre a variável de ambiente do build.
 */

const MODELO = 'gemini-2.5-flash-preview-tts';
const VOZ_PADRAO = 'Charon'; // grave e firme — boa para narração bíblica

function chave(): string | null {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('ebd:chaveNarracao');
    if (local) return local;
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? null;
}

function voz(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ebd:vozNarracao') ?? VOZ_PADRAO;
  }
  return VOZ_PADRAO;
}

export function narracaoDisponivel(): boolean {
  return !!chave() && typeof navigator !== 'undefined' && navigator.onLine;
}

/** Hash djb2 — id estável do áudio por (texto + voz). */
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** PCM 16-bit little-endian mono → WAV (cabeçalho de 44 bytes). */
function pcmParaWav(pcm: Uint8Array, sampleRate: number): Blob {
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const escrever = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  escrever(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length, true);
  escrever(8, 'WAVE');
  escrever(12, 'fmt ');
  v.setUint32(16, 16, true); // tamanho do fmt
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); // byte rate (16-bit mono)
  v.setUint16(32, 2, true); // block align
  v.setUint16(34, 16, true); // bits por amostra
  escrever(36, 'data');
  v.setUint32(40, pcm.length, true);
  return new Blob([header, pcm.buffer as ArrayBuffer], { type: 'audio/wav' });
}

function base64ParaBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Gera (ou lê do cache) a narração de um texto. Retorna um Blob WAV,
 * ou null se indisponível (chamador usa o fallback do dispositivo).
 */
export async function gerarNarracao(texto: string, sinal?: AbortSignal): Promise<Blob | null> {
  const id = `${MODELO}|${voz()}|${hash(texto)}`;

  // 1) cache primeiro — offline e sem custo
  try {
    const cacheado = await lerNarracao(id);
    if (cacheado) return cacheado;
  } catch {
    /* cache indisponível não impede a geração */
  }

  const k = chave();
  if (!k || (typeof navigator !== 'undefined' && !navigator.onLine)) return null;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
      {
        method: 'POST',
        signal: sinal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': k },
        body: JSON.stringify({
          contents: [{ parts: [{ text: texto }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voz() } } },
          },
        }),
      },
    );
    if (!resp.ok) return null;
    const dados = (await resp.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[];
    };
    const inline = dados.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!inline) return null;

    const taxa = Number(inline.mimeType.match(/rate=(\d+)/)?.[1] ?? 24000);
    const wav = pcmParaWav(base64ParaBytes(inline.data), taxa);

    try {
      await salvarNarracao(id, wav);
    } catch {
      /* sem cache, ainda tocamos */
    }
    return wav;
  } catch {
    return null; // abort/rede — fallback do chamador
  }
}
