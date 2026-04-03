type LogLevel = 'info' | 'warn' | 'error' | 'success';

const reset = '\x1b[0m';
const bold = '\x1b[1m';
const dim = '\x1b[2m';

function rgb(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

function bgRgb(r: number, g: number, b: number): string {
  return `\x1b[48;2;${r};${g};${b}m`;
}

const palette = {
  cyan: rgb(82, 210, 255),
  teal: rgb(33, 233, 180),
  blue: rgb(86, 132, 255),
  amber: rgb(255, 189, 89),
  red: rgb(255, 97, 136),
  slate: rgb(129, 149, 174),
  ice: rgb(232, 241, 255),
  midnight: bgRgb(11, 23, 48),
  navy: bgRgb(16, 40, 74),
  emeraldBg: bgRgb(10, 64, 54),
  amberBg: bgRgb(72, 46, 9),
  roseBg: bgRgb(78, 16, 33),
};

const icon: Record<LogLevel, string> = {
  info: '◈',
  warn: '▲',
  error: '✕',
  success: '✓',
};

const colorForLevel: Record<LogLevel, string> = {
  info: palette.cyan,
  warn: palette.amber,
  error: palette.red,
  success: palette.teal,
};

function stripAnsi(value: string): string {
  return value.replace(/\x1b\[[0-9;]*m/g, '');
}

export function log(level: LogLevel, message: string, details?: string): void {
  const stamp = `${dim}${new Date().toISOString()}${reset}`;
  const label = `${colorForLevel[level]}${bold}${icon[level]} ${level.toUpperCase()}${reset}`;
  const suffix = details ? ` ${dim}${details}${reset}` : '';
  console.log(`${stamp} ${label} ${palette.ice}${message}${reset}${suffix}`);
}

export function logKeyValue(label: string, value: string | number): void {
  const left = `${palette.slate}${label.padEnd(18, ' ')}${reset}`;
  const right = `${palette.midnight}${palette.ice}${bold} ${String(value)} ${reset}`;
  console.log(`  ${left} ${palette.blue}│${reset} ${right}`);
}

export function logSection(title: string, subtitle?: string): void {
  const line = `${palette.blue}${bold}${'═'.repeat(64)}${reset}`;
  console.log(line);
  console.log(`${bold}${palette.ice}${title}${reset}${subtitle ? ` ${dim}${subtitle}${reset}` : ''}`);
}

export function renderLaunchBanner(mode: string, marketCount: number, strategyNames: string[]): string {
  const header = `${bold}${palette.ice}✦ PolyHFT-Autotrading-V3 Command Deck${reset}`;
  const sub = `${palette.slate}paired-execution runtime • live parity scanner • low-latency console${reset}`;
  const metrics = [
    `${palette.teal}${bold}MODE${reset} ${palette.ice}${mode}${reset}`,
    `${palette.cyan}${bold}MARKETS${reset} ${palette.ice}${marketCount}${reset}`,
    `${palette.blue}${bold}STRATEGIES${reset} ${palette.ice}${strategyNames.length}${reset}`,
  ].join(`   ${palette.slate}•${reset}   `);
  const strategyLine = `${palette.slate}Stack:${reset} ${palette.ice}${strategyNames.join(', ')}${reset}`;
  return [
    `${palette.blue}╭────────────────────────────────────────────────────────────────────╮${reset}`,
    `${palette.blue}│${reset} ${header.padEnd(87 - stripAnsi(header).length + stripAnsi(header).length, ' ')}`,
    `${palette.blue}│${reset} ${sub.padEnd(87 - stripAnsi(sub).length + stripAnsi(sub).length, ' ')}`,
    `${palette.blue}│${reset} ${metrics.padEnd(87 - stripAnsi(metrics).length + stripAnsi(metrics).length, ' ')}`,
    `${palette.blue}│${reset} ${strategyLine.padEnd(87 - stripAnsi(strategyLine).length + stripAnsi(strategyLine).length, ' ')}`,
    `${palette.blue}╰────────────────────────────────────────────────────────────────────╯${reset}`,
  ].join('\n');
}

export function renderOpportunityRow(label: string, combinedAsk: number, edge: number, volumeLabel?: string): string {
  const paddedLabel = label.padEnd(32, ' ');
  const cost = `${combinedAsk.toFixed(3)}`.padStart(5, ' ');
  const edgePct = `${(edge * 100).toFixed(2)}%`.padStart(7, ' ');
  const volume = (volumeLabel ?? 'n/a').padStart(10, ' ');
  return `  ${palette.navy}${palette.ice} ${paddedLabel} ${reset} ${palette.blue}│${reset} ${palette.midnight}${palette.cyan}${bold} ${cost} ${reset} ${palette.slate}│${reset} ${palette.emeraldBg}${palette.teal}${bold} ${edgePct} ${reset} ${palette.slate}│${reset} ${palette.amber}${volume}${reset}`;
}

export function renderExecutionRow(
  status: string,
  marketId: string,
  combinedAsk: number,
  totalNotional: number,
  legs: string
): string {
  const paddedMarket = marketId.padEnd(20, ' ');
  const paddedStatus = status.padEnd(9, ' ');
  const pair = combinedAsk.toFixed(3).padStart(5, ' ');
  const notion = `$${totalNotional.toFixed(2)}`.padStart(9, ' ');
  const statusStyle =
    status === 'ROUTED'
      ? `${palette.emeraldBg}${palette.teal}${bold}`
      : status === 'SIMULATED'
        ? `${palette.navy}${palette.cyan}${bold}`
        : `${palette.roseBg}${palette.red}${bold}`;
  return `  ${statusStyle} ${paddedStatus} ${reset} ${palette.ice}${paddedMarket}${reset} ${palette.slate}│${reset} ${palette.midnight}${palette.cyan}${bold} ${pair} ${reset} ${palette.slate}│${reset} ${palette.amberBg}${palette.amber}${bold} ${notion} ${reset} ${palette.slate}│${reset} ${palette.ice}${legs}${reset}`;
}

export function renderTableHeader(columns: string[]): string {
  const [left, middle, right, last] = columns;
  return `  ${palette.blue}${bold}${left.padEnd(34, ' ')}│${middle.padStart(7, ' ')}│${right.padStart(9, ' ')}│${last.padStart(12, ' ')}${reset}`;
}
