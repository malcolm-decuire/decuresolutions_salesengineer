import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'
import { Container } from '../elements/container'
import { Section } from '../elements/section'

export type SeStatsCardStat = {
  id: string | number
  name: ReactNode
  value: ReactNode
}

export function SeStatsCard({
  stats,
  eyebrow,
  headline,
  description,
  imageSrc,
  imageAlt,
  className,
  ...props
}: {
  stats: SeStatsCardStat[]
  eyebrow: ReactNode
  headline: ReactNode
  description: ReactNode
  imageSrc: string
  imageAlt: string
} & ComponentProps<'section'>) {
  return (
    <Section className={clsx(className)} {...props}>
      <Container>
        <div className="overflow-hidden rounded-3xl bg-gray-900 shadow-2xl ring-1 ring-white/10">
          <div className="grid lg:grid-cols-2">
            <img alt={imageAlt} src={imageSrc} className="h-56 w-full object-cover lg:h-full" />
            <div className="px-6 pb-24 pt-16 sm:pb-32 sm:pt-20 lg:px-8 lg:pt-32">
              <div className="mx-auto max-w-2xl lg:mr-0 lg:max-w-lg">
                <h2 className="text-base/8 font-semibold text-indigo-400">{eyebrow}</h2>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
                  {headline}
                </p>
                <div className="mt-6 text-lg/8 text-gray-300">{description}</div>
                <dl className="mt-16 grid max-w-xl grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 xl:mt-16">
                  {stats.map((stat) => (
                    <div key={stat.id} className="flex flex-col gap-y-3 border-l border-white/10 pl-6">
                      <dt className="text-sm/6 text-gray-400">{stat.name}</dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-white">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}