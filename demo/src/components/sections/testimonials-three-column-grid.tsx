import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'
import { Section } from '../elements/section'

export function Testimonial({
  quote,
  img,
  name,
  byline,
  className,
  ...props
}: {
  quote: ReactNode
  img: ReactNode
  name: ReactNode
  byline: ReactNode
} & ComponentProps<'blockquote'>) {
  return (
    <figure
      className={clsx(
        'flex flex-col justify-between gap-12 rounded-md bg-mauve-950/2.5 p-7 text-sm/7.5 text-mauve-950 sm:p-8 dark:bg-white/5 dark:text-white',
        className,
      )}
      {...props}
    >
      <blockquote className="relative flex flex-col gap-5 text-pretty *:first:before:absolute *:first:before:inline *:first:before:-translate-x-full *:first:before:content-['“'] *:last:after:inline *:last:after:content-['”']">
        {quote}
      </blockquote>
      <figcaption className="flex items-center gap-4 pt-1">
        <div className="flex size-12 overflow-hidden rounded-full outline -outline-offset-1 outline-black/5 *:size-full *:object-cover dark:outline-white/5">
          {img}
        </div>
        <div className="space-y-1">
          <p className="font-semibold">{name}</p>
          <p className="text-sm/6 text-mauve-700 dark:text-mauve-400">{byline}</p>
        </div>
      </figcaption>
    </figure>
  )
}

export function TestimonialThreeColumnGrid({ children, ...props }: ComponentProps<typeof Section>) {
  return (
    <Section {...props}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </Section>
  )
}
