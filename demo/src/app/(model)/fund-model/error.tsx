'use client'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Model workspace unavailable</h1>
        <p className="mt-2 text-sm text-mauve-600">No financial outputs were published. Retry the workspace safely.</p>
        <button className="mt-5 min-h-11 rounded-full bg-mauve-950 px-5 text-sm font-semibold text-white" onClick={reset}>
          Retry
        </button>
      </div>
    </div>
  )
}
