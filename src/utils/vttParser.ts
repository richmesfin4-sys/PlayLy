export interface VttCue {
  id: string;
  start: number;
  end: number;
  text: string;
  isSoundCue: boolean;
  signGloss?: string;
}

export function parseVttTimestamp(ts: string): number {
  const cleaned = ts.trim().replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length === 3) {
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const seconds = Number(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    return minutes * 60 + seconds;
  }
  return 0;
}

export function formatTimestamp(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  const ms = Math.round((clamped % 1) * 1000);
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const mmm = String(ms).padStart(3, '0');
  return `${mm}:${ss}.${mmm}`;
}

export function formatDisplayTime(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function parseVtt(vttContent: string): VttCue[] {
  const normalized = vttContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n{2,}/);
  const cues: VttCue[] = [];
  let index = 1;

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) continue;
    if (lines[0].startsWith('WEBVTT') || lines[0].startsWith('NOTE')) continue;

    const timingLineIdx = lines.findIndex((l) => l.includes('-->'));
    if (timingLineIdx === -1) continue;

    const timingParts = lines[timingLineIdx].split('-->');
    if (timingParts.length !== 2) continue;

    const start = parseVttTimestamp(timingParts[0]);
    const end = parseVttTimestamp(timingParts[1].trim().split(/\s+/)[0]);
    const textLines = lines.slice(timingLineIdx + 1);
    const text = textLines.join(' ').trim();
    if (!text) continue;

    const id = timingLineIdx > 0 ? lines[0] : `cue-${index}`;
    const isSoundCue = /\[[^\]]+\]/.test(text);

    cues.push({
      id,
      start,
      end,
      text,
      isSoundCue,
    });
    index += 1;
  }

  return cues;
}

export function findActiveCue(cues: VttCue[], currentTime: number): VttCue | null {
  for (const cue of cues) {
    if (currentTime >= cue.start && currentTime <= cue.end) {
      return cue;
    }
  }
  return null;
}

export function exportToVtt(cues: VttCue[]): string {
  const header = 'WEBVTT\n\n';
  const body = cues
    .map((cue, idx) => {
      const id = cue.id || `cue-${idx + 1}`;
      return `${id}\n${formatTimestamp(cue.start)} --> ${formatTimestamp(cue.end)}\n${cue.text}`;
    })
    .join('\n\n');
  return `${header}${body}\n`;
}

export function exportToPlainText(cues: VttCue[], title: string): string {
  const lines = cues.map((cue) => `[${formatDisplayTime(cue.start)}] ${cue.text}`);
  return `${title}\n${'='.repeat(title.length)}\n\n${lines.join('\n')}\n`;
}

const ASCII_BRAILLE_MAP: Record<string, string> = {
  a: 'A', b: 'B', c: 'C', d: 'D', e: 'E', f: 'F', g: 'G', h: 'H', i: 'I', j: 'J',
  k: 'K', l: 'L', m: 'M', n: 'N', o: 'O', p: 'P', q: 'Q', r: 'R', s: 'S', t: 'T',
  u: 'U', v: 'V', w: 'W', x: 'X', y: 'Y', z: 'Z',
  '0': '#J', '1': '#A', '2': '#B', '3': '#C', '4': '#D',
  '5': '#E', '6': '#F', '7': '#G', '8': '#H', '9': '#I',
  '.': '4', ',': '1', '?': '8', '!': '6', ':': '3', ';': '2', '-': '-', ' ': ' ',
};

export function exportToBrf(cues: VttCue[], title: string): string {
  const toBrfLine = (input: string): string => {
    let out = '';
    for (const ch of input) {
      const lower = ch.toLowerCase();
      if (ASCII_BRAILLE_MAP[lower]) {
        out += ASCII_BRAILLE_MAP[lower];
      } else if (/[\u1200-\u137F]/.test(ch)) {
        // Transliterate Ethiopic markers cleanly into readable BRF bracketed code points
        out += `[ET:${ch.codePointAt(0)?.toString(16).toUpperCase() ?? ''}]`;
      } else {
        out += ch;
      }
    }
    return out;
  };

  const wrappedTitle = toBrfLine(title.toUpperCase());
  const lines = cues.map((cue) => {
    const stamp = formatDisplayTime(cue.start);
    return toBrfLine(`${stamp} ${cue.text}`);
  });

  // Format to 40-cell standard Braille line width
  const formatted: string[] = [wrappedTitle, ''];
  for (const line of lines) {
    const words = line.split(' ');
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > 40) {
        if (current) formatted.push(current.trim());
        current = word;
      } else {
        current = `${current} ${word}`.trim();
      }
    }
    if (current) formatted.push(current.trim());
  }
  return formatted.join('\r\n') + '\r\n';
}
