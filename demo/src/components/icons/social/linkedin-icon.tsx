import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function LinkedInIcon({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="image"
      className={clsx('inline-block', className)}
      {...props}
    >
      <path d="M20.447 20.452h-3.554v-5.568c0-1.328-.024-3.039-1.852-3.039-1.853 0-2.136 1.447-2.136 2.944v5.663H9.351V9h3.414v1.561h.049c.476-.9 1.637-1.853 3.369-1.853 3.602 0 4.267 2.37 4.267 5.455v6.289zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.116 20.452H3.558V9h3.558v11.452z" />
    </svg>
  )
}