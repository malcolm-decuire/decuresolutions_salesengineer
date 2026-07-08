import type { ComponentProps } from 'react'
import { Section } from '../elements/section'

export type SeTimelineItem = {
  id: string | number
  name: string
  description: string
  date: string
  dateTime: string
}

export function SeTimeline({ timeline, ...props }: { timeline: SeTimelineItem[] } & ComponentProps<'section'>) {
  return (
    <Section className="bg-gray-900 py-24 sm:py-32" {...props}>
      <div className="grid grid-cols-1 gap-8 overflow-hidden lg:grid-cols-4">
          {timeline.map((item) => (
            <div key={item.name} className="relative">
              <time dateTime={item.dateTime} className="flex items-center text-sm/6 font-semibold text-indigo-400">
                <svg viewBox="0 0 4 4" aria-hidden="true" className="mr-4 size-1 flex-none">
                  <circle r={2} cx={2} cy={2} fill="currentColor" />
                </svg>
                {item.date}
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-px w-full -translate-x-full bg-white/15 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0"
                />
              </time>
              <p className="mt-6 text-lg/8 font-semibold tracking-tight text-white">{item.name}</p>
              <p className="mt-1 text-base/7 text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
    </Section>
  )
}