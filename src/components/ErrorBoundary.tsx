import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Last line of defence: if a screen crashes, show what happened and a way back,
 * instead of an empty page. The message helps tell what went wrong.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[crash]', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center" translate="no">
        <h1 className="text-2xl font-semibold text-wine-700">Something went wrong</h1>
        <p className="max-w-sm text-sm text-ink/65">
          The app hit an error. Reloading usually fixes it. If you had Translate turned on for this page, turn it off first.
        </p>
        <button className="btn btn-primary" onClick={() => window.location.assign('/')}>Reload</button>
        <p className="max-w-sm break-words rounded-lg bg-sand px-3 py-2 font-mono text-[11px] text-ink/60">{error.message || String(error)}</p>
      </div>
    )
  }
}
