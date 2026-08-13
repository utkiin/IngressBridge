import type { JSX } from 'react'

const KEY_RE = /^(\s*(?:-\s+)?)([A-Za-z0-9_.\-/]+)(:)(\s.*|)$/
const LIST_DASH_RE = /^(\s*)(-)(\s.*|)$/

function highlightValue(value: string, key: number): JSX.Element {
  const trimmed = value.trim()
  if (trimmed === '' ) return <span key={key}>{value}</span>
  if (trimmed.startsWith('#')) return <span key={key} className="text-slate-400 dark:text-slate-500 italic">{value}</span>
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return (
      <span key={key}>
        {value.replace(trimmed, '')}
        <span className="text-amber-600 dark:text-amber-400">{trimmed}</span>
      </span>
    )
  }
  if (/^(true|false|null)$/.test(trimmed)) {
    return (
      <span key={key}>
        {value.replace(trimmed, '')}
        <span className="text-fuchsia-600 dark:text-fuchsia-400">{trimmed}</span>
      </span>
    )
  }
  return (
    <span key={key} className="text-emerald-700 dark:text-emerald-400">
      {value}
    </span>
  )
}

export function highlightYamlLine(line: string, lineIndex: number): JSX.Element {
  if (/^\s*#/.test(line)) {
    return (
      <span key={lineIndex} className="text-slate-400 dark:text-slate-500 italic">
        {line}
      </span>
    )
  }
  if (line.trim() === '---') {
    return (
      <span key={lineIndex} className="text-sky-500 dark:text-sky-400 font-semibold">
        {line}
      </span>
    )
  }

  const keyMatch = line.match(KEY_RE)
  if (keyMatch) {
    const [, prefix, key, colon, rest] = keyMatch
    return (
      <span key={lineIndex}>
        <span className="text-slate-400 dark:text-slate-600">{prefix}</span>
        <span className="text-sky-600 dark:text-sky-400 font-medium">{key}</span>
        <span className="text-slate-400 dark:text-slate-600">{colon}</span>
        {highlightValue(rest, 0)}
      </span>
    )
  }

  const dashMatch = line.match(LIST_DASH_RE)
  if (dashMatch) {
    const [, prefix, dash, rest] = dashMatch
    return (
      <span key={lineIndex}>
        <span className="text-slate-400 dark:text-slate-600">{prefix}</span>
        <span className="text-indigo-500 dark:text-indigo-400">{dash}</span>
        {highlightValue(rest, 0)}
      </span>
    )
  }

  return <span key={lineIndex}>{line}</span>
}
