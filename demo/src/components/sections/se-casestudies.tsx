"use client"

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { useState, type ComponentProps, type ReactNode } from 'react'

import { ButtonLink } from '../elements/button'
import { TagIcon } from '../icons/tag-icon'
import { Section } from '../elements/section'

type CaseStudyDetailSection = {
  product_service: string
  market_icp: string
  deal_stage: string
}

type CaseStudyDetailProblem = {
  buyer_struggles: string
  common_objections: string
}

type CaseStudyDetailStrategy = {
  positioning_decisions: string
  messaging_angle: string
  channel_selection: string
}

type CaseStudyDetailExecution = {
  outreach_approach: string
  demo_or_call_flow: string
  follow_ups: string
}

type CaseStudyDetailResults = {
  conversion_rate: string
  pipeline_created: string
  deals_closed: string
  time_to_close: string
}

type CaseStudyDetailLearnings = {
  what_worked: string
  what_id_do_differently: string
}

export type SeCaseStudy = {
  id: string | number
  company: string
  role: string
  location: string
  status?: string
  industry: string
  impact_summary: string
  technologies: string[]
  category: 'professional' | 'volunteer'
  imageSrc?: string
  actionLabel?: string
  actionHref?: string
  actionDisclaimer?: {
    title: string
    description: string
    expectations: string[]
    confirmLabel?: string
  }
  case_study: {
    context: CaseStudyDetailSection
    problem: CaseStudyDetailProblem
    strategy: CaseStudyDetailStrategy
    execution: CaseStudyDetailExecution
    results: CaseStudyDetailResults
    learnings: CaseStudyDetailLearnings
  }
}

function toBulletPoints(summary: string) {
  return summary
    .split('. ')
    .map((point) => point.replace(/\.$/, '').trim())
    .filter(Boolean)
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function CaseStudyCard({ item }: { item: SeCaseStudy }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false)
  const [openTags, setOpenTags] = useState(false)

  function renderItem(label: string, value: string) {
    return (
      <div key={label} className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mauve-500 dark:text-mauve-400">{label}</p>
        <p className="text-sm/6 text-mauve-700 dark:text-mauve-200">{value}</p>
      </div>
    )
  }

  function renderSection(title: string, items: [string, string][]) {
    return (
      <section className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-mauve-500 dark:text-mauve-400">{title}</h4>
        <div className="grid gap-5 sm:grid-cols-2">{items.map(([label, value]) => renderItem(label, value))}</div>
      </section>
    )
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-mauve-950/10 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5">
      <div className="relative aspect-square w-full bg-mauve-950/5 dark:bg-white/5">
        {item.imageSrc ? (
          <Image
            src={item.imageSrc}
            alt={`${item.company} card`}
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-mauve-950/10 via-transparent to-mauve-950/5 text-3xl font-semibold tracking-wide text-mauve-500 dark:from-white/10 dark:via-white/5 dark:to-white/10 dark:text-white">
            {getInitials(item.company)}
          </div>
        )}
      </div>

      <div className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-mauve-500 dark:text-mauve-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-mauve-950/5 px-2.5 py-1 dark:bg-white/10">{item.category}</span>
            <span>{item.industry}</span>
          </div>
          <button
            type="button"
            onClick={() => setOpenTags((current) => !current)}
            aria-expanded={openTags}
            aria-label={`Toggle tags for ${item.company}`}
            className="inline-flex size-9 items-center justify-center rounded-full border border-mauve-950/10 bg-white text-mauve-700 shadow-sm transition hover:bg-mauve-950/5 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <TagIcon className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm/6 text-mauve-700 dark:text-mauve-400">{item.location}</p>
            {item.status ? (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                {item.status}
              </span>
            ) : null}
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-mauve-950 dark:text-white">{item.company}</h3>
          <p className="text-sm/6 font-medium text-mauve-600 dark:text-mauve-300">{item.role}</p>
        </div>

        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm/7 text-mauve-700 dark:text-mauve-300">
          {toBulletPoints(item.impact_summary).map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>

        {item.actionHref && item.actionDisclaimer ? (
          <button
            type="button"
            onClick={() => setIsDisclaimerOpen(true)}
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full border border-mauve-950/10 bg-mauve-950/[0.03] px-4 text-sm font-medium text-mauve-800 shadow-none transition hover:bg-mauve-950/5 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <span>{item.actionLabel ?? 'Demo'}</span>
          </button>
        ) : item.actionHref ? (
          <ButtonLink
            href={item.actionHref}
            size="lg"
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full border border-mauve-950/10 bg-mauve-950/[0.03] px-4 text-sm font-medium text-mauve-800 shadow-none transition hover:bg-mauve-950/5 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <span>{item.actionLabel ?? 'Demo'}</span>
          </ButtonLink>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-mauve-950/10 bg-mauve-950/[0.03] px-4 text-sm font-medium text-mauve-800 shadow-none transition hover:bg-mauve-950/5 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <span>Case Study Details</span>
          </button>
        )}

        {item.actionHref && item.actionDisclaimer ? (
          <Dialog open={isDisclaimerOpen} onClose={setIsDisclaimerOpen} className="relative z-50">
            <DialogBackdrop
              transition
              className="fixed inset-0 bg-[#17232b]/70 backdrop-blur-sm transition-opacity data-closed:opacity-0"
            />
            <div className="fixed inset-0 z-50 w-screen overflow-y-auto p-4">
              <div className="flex min-h-full items-end justify-center sm:items-center">
                <DialogPanel
                  transition
                  className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-5 text-left shadow-2xl transition data-closed:translate-y-4 data-closed:opacity-0 sm:p-7 dark:bg-mauve-950"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-amber-800">
                        Preview release
                      </span>
                      <DialogTitle as="h3" className="mt-4 text-2xl font-semibold tracking-tight text-mauve-950 dark:text-white">
                        {item.actionDisclaimer.title}
                      </DialogTitle>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDisclaimerOpen(false)}
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-mauve-950/10 text-mauve-600 hover:bg-mauve-950/5 dark:border-white/10 dark:text-white"
                    >
                      <span className="sr-only">Close disclaimer</span>
                      <XMarkIcon aria-hidden="true" className="size-5" />
                    </button>
                  </div>

                  <p className="mt-4 text-sm/6 text-mauve-600 dark:text-mauve-300">{item.actionDisclaimer.description}</p>
                  <ul className="mt-5 space-y-3">
                    {item.actionDisclaimer.expectations.map((expectation) => (
                      <li key={expectation} className="flex gap-3 rounded-2xl bg-mauve-950/[0.04] p-3 text-sm/6 text-mauve-700 dark:bg-white/[0.06] dark:text-mauve-200">
                        <span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">!</span>
                        <span>{expectation}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setIsDisclaimerOpen(false)}
                      className="min-h-12 rounded-full border border-mauve-950/10 px-5 text-sm font-semibold text-mauve-700 hover:bg-mauve-950/5 dark:border-white/10 dark:text-white"
                    >
                      Return to portfolio
                    </button>
                    <ButtonLink href={item.actionHref} size="lg" className="min-h-12 px-5 text-center">
                      {item.actionDisclaimer.confirmLabel ?? 'Continue to preview'}
                    </ButtonLink>
                  </div>
                </DialogPanel>
              </div>
            </div>
          </Dialog>
        ) : null}

        <Dialog open={isOpen} onClose={setIsOpen} className="relative z-10">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
          />

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <DialogPanel
                transition
                className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95 dark:bg-mauve-950"
              >
                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-md bg-white text-mauve-500 hover:text-mauve-700 focus:outline-2 focus:outline-offset-2 focus:outline-white dark:bg-mauve-950 dark:text-mauve-400 dark:hover:text-white"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon aria-hidden="true" className="size-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-mauve-950/5 sm:mx-0 sm:size-10 dark:bg-white/10">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-mauve-700 dark:text-white">CS</span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" className="text-base font-semibold text-mauve-950 dark:text-white">
                      Case Study Details
                    </DialogTitle>
                    <div className="mt-2 space-y-6">
                      <p className="text-sm text-mauve-600 dark:text-mauve-300">
                        {item.company} · {item.role}
                      </p>

                      <section className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-mauve-500 dark:text-mauve-400">
                          Context
                        </h4>
                        <div className="space-y-4">
                          {renderItem('Product / service', item.case_study.context.product_service)}
                          {renderItem('Market / ICP', item.case_study.context.market_icp)}
                          {renderItem('Deal stage', item.case_study.context.deal_stage)}
                        </div>
                      </section>

                      {renderSection('Problem', [
                        ['Buyer struggles', item.case_study.problem.buyer_struggles],
                        ['Common objections', item.case_study.problem.common_objections],
                      ])}

                      {renderSection('Strategy', [
                        ['Positioning decisions', item.case_study.strategy.positioning_decisions],
                        ['Messaging angle', item.case_study.strategy.messaging_angle],
                        ['Channel selection', item.case_study.strategy.channel_selection],
                      ])}

                      {renderSection('Execution', [
                        ['Outreach approach', item.case_study.execution.outreach_approach],
                        ['Demo / call flow', item.case_study.execution.demo_or_call_flow],
                        ['Follow-ups', item.case_study.execution.follow_ups],
                      ])}

                      {renderSection('Results', [
                        ['Conversion rate', item.case_study.results.conversion_rate],
                        ['Pipeline created', item.case_study.results.pipeline_created],
                        ['Deals closed', item.case_study.results.deals_closed],
                        ['Time to close', item.case_study.results.time_to_close],
                      ])}

                      {renderSection('Learnings', [
                        ['What worked', item.case_study.learnings.what_worked],
                        ['What I would do differently', item.case_study.learnings.what_id_do_differently],
                      ])}
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex w-full justify-center rounded-md bg-mauve-950 px-3 py-2 text-sm font-semibold text-white hover:bg-mauve-800 sm:ml-3 sm:w-auto"
                  >
                    Close
                  </button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>

        {openTags ? (
          <ul className="flex flex-wrap gap-2 pt-1">
            {item.technologies.map((technology) => (
              <li
                key={technology}
                className="rounded-full bg-mauve-950/5 px-3 py-1 text-xs/5 font-medium text-mauve-700 dark:bg-white/10 dark:text-mauve-300"
              >
                {technology}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  )
}

export function SeCaseStudies({
  headline,
  subheadline,
  items,
  ...props
}: {
  headline: ReactNode
  subheadline: ReactNode
  items: SeCaseStudy[]
} & ComponentProps<'section'>) {
  return (
    <Section {...props}>
      <div className="flex flex-col gap-10 sm:gap-16">
        <div className="flex max-w-2xl flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-[2rem]/10 font-semibold tracking-tight text-balance text-mauve-950 sm:text-5xl/14 dark:text-white">
              {headline}
            </h2>
          </div>
          <p className="text-pretty text-base/7 text-mauve-700 dark:text-mauve-400 sm:text-lg/8">{subheadline}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <CaseStudyCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </Section>
  )
}
