'use client'

import { FormEvent, Fragment, ReactNode, useState } from 'react'

type DemoMessage = {
  role: 'user' | 'assistant' | 'tool'
  label: string
  body: string
  meta?: string
  generated?: boolean
}
type Conversation = {
  id: 'lease' | 'training' | 'maintenance'
  title: string
  subtitle: string
  time: string
  suggestedQuestions: string[]
  sources: string
  messages: DemoMessage[]
}

const conversations: Conversation[] = [
  {
    id: 'lease',
    title: 'Lease renewal risk',
    subtitle: 'Oakline Commons · 312 units',
    time: '9:42 AM',
    suggestedQuestions: [
      'Who needs outreach today?',
      'Show the evidence behind the risk score',
      'Draft the resident outreach',
    ],
    sources: 'Resident ledger · Renewal calendar · Work orders · Surveys',
    messages: [
      {
        role: 'user',
        label: 'Regional VP',
        body: 'Which residents at Oakline Commons are most likely to decline renewal, and what should my team do this week?',
      },
      {
        role: 'tool',
        label: 'Connected intelligence',
        body: 'Resident ledger, maintenance history, survey feedback and renewal calendar searched securely.',
        meta: '4 approved sources · 1.8s',
      },
      {
        role: 'assistant',
        label: 'Thompson & Horn AI',
        body: 'I found 18 upcoming renewals with elevated risk. Five residents require outreach today, driven by unresolved work orders, low survey scores and above-market increases. Personalized, policy-compliant messages are drafted for manager approval.',
        meta: 'Evidence attached · Human approval required before send',
      },
    ],
  },
  {
    id: 'training',
    title: 'Training compliance',
    subtitle: 'Southeast portfolio · 14 sites',
    time: 'Yesterday',
    suggestedQuestions: [
      'What could affect next week’s audit?',
      'Which sites have the biggest gaps?',
      'Build the remediation plan',
    ],
    sources: 'Policy library · LMS records · Certificates · Site rosters',
    messages: [
      {
        role: 'user',
        label: 'VP of Operations',
        body: 'Give me the compliance gaps that could affect next week’s audit. Keep it executive-level.',
      },
      {
        role: 'tool',
        label: 'Connected intelligence',
        body: 'Current policies, LMS completion records and site rosters reviewed.',
        meta: '36 documents · 428 records',
      },
      {
        role: 'assistant',
        label: 'Thompson & Horn AI',
        body: 'Three sites need attention. Nine team members have overdue fair-housing modules, two certificates expire within seven days and one roster mismatch needs HR validation. A site-by-site action plan is ready.',
        meta: 'No employee action taken · Review action plan',
      },
    ],
  },
  {
    id: 'maintenance',
    title: 'Maintenance escalation',
    subtitle: 'Meridian Place · After hours',
    time: 'Mon',
    suggestedQuestions: [
      'What still needs an owner?',
      'Walk me through the incident timeline',
      'Draft the resident update',
    ],
    sources: 'Work orders · Vendor dispatch · Resident communications',
    messages: [
      {
        role: 'user',
        label: 'Community Manager',
        body: 'Summarize the after-hours incident at Meridian Place and tell me what still needs an owner.',
      },
      {
        role: 'tool',
        label: 'Connected intelligence',
        body: 'Work-order timeline, vendor dispatch and resident communications reconciled.',
        meta: '3 live systems · Read only',
      },
      {
        role: 'assistant',
        label: 'Thompson & Horn AI',
        body: 'The leak was isolated at 11:18 PM and restoration arrived at 12:06 AM. Resident relocation is confirmed. The insurance photo package remains open and is assigned for 10:00 AM.',
        meta: 'Timeline reconciled · 1 open action',
      },
    ],
  },
]

const benefits = [
  ['01', 'Faster decisions', 'Move from portfolio signal to an evidence-backed action plan in minutes, not days.'],
  [
    '02',
    'One operating view',
    'Unify property data, policy, training and live workflows without another fragmented dashboard.',
  ],
  [
    '03',
    'Governed execution',
    'Keep sources, permissions, approvals and audit history visible at every sensitive step.',
  ],
  [
    '04',
    'Compounding context',
    'Preserve institutional knowledge so every interaction starts with the right property context.',
  ],
]

const proofPoints = [
  {
    name: 'Morgan Stanley',
    mark: 'MS',
    detail: 'GPT-4 assistant adopted across wealth management teams',
  },
  {
    name: 'Klarna.',
    mark: 'K.',
    detail: 'Customer-service assistant powered by OpenAI',
  },
  {
    name: 'stripe',
    mark: 'S',
    detail: 'GPT-4 used across support and developer documentation',
  },
  {
    name: 'JLL',
    mark: 'JLL',
    detail: 'JLL GPT brings GPT-4 into commercial real estate',
  },
]

const agenda = [
  ['01', 'Discovery', '5 min', 'Live questions to understand priorities, constraints and success criteria.'],
  ['02', 'Technical evaluation', '5 min', 'Assess feasibility, fit and the realities of your environment.'],
  ['03', 'Value proposition', '5 min', 'Connect the proposed solution to what we uncover together.'],
  ['04', 'Technical deep-dive', '15 min', 'Architecture, data flow, integrations, security and authentication.'],
]

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <path
        d="M12 2.8c.8 4.8 3.3 7.3 8.2 8.2-4.9.9-7.4 3.4-8.2 8.2-.8-4.8-3.3-7.3-8.2-8.2 4.9-.9 7.4-3.4 8.2-8.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function inlineMarkdown(value: string): ReactNode[] {
  return value
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <Fragment key={index}>{part}</Fragment>
      ),
    )
}

function StructuredAnswer({ body }: { body: string }) {
  const lines = body
    .replace(/\s+(?=\*\*(?:Compliance|Lease rules & limitations|Other landlord items)\*\*)/gi, '\n\n')
    .replace(/\s+-\s+(?=\*\*)/g, '\n- ')
    .replace(/\s+(?=\d+\.\s+\*\*)/g, '\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div className="space-y-3 text-sm/6 text-white/75 sm:text-[15px]/7">
      {lines.map((line, index) => {
        const heading = line.match(/^#{1,3}\s+(.+)$/)?.[1]
        const boldHeading = line.match(/^\*\*([^*]+)\*\*:?$/)?.[1]
        if (heading || boldHeading) {
          return (
            <h3 key={index} className="pt-2 text-base font-semibold tracking-[-0.01em] text-[#8ef0bb] first:pt-0">
              {heading ?? boldHeading}
            </h3>
          )
        }

        const bullet = line.match(/^[-*]\s+(.+)$/)?.[1]
        if (bullet) {
          return (
            <div key={index} className="grid grid-cols-[auto_1fr] gap-2.5 pl-1">
              <span aria-hidden="true" className="mt-[0.68rem] size-1.5 rounded-full bg-[#6ee7a8]" />
              <p>{inlineMarkdown(bullet)}</p>
            </div>
          )
        }

        const numbered = line.match(/^(\d+)\.\s+(.+)$/)
        if (numbered) {
          return (
            <div key={index} className="grid grid-cols-[1.5rem_1fr] gap-2 pl-1">
              <span className="font-semibold text-[#6ee7a8]">{numbered[1]}.</span>
              <p>{inlineMarkdown(numbered[2])}</p>
            </div>
          )
        }

        return <p key={index}>{inlineMarkdown(line)}</p>
      })}
    </div>
  )
}

export default function PresentationPage() {
  const [activeId, setActiveId] = useState(conversations[0].id)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Record<string, DemoMessage[]>>({})
  const [approved, setApproved] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [requestError, setRequestError] = useState('')
  const active = conversations.find((item) => item.id === activeId) ?? conversations[0]

  async function askQuestion(rawQuestion: string) {
    const submittedQuestion = rawQuestion.trim()
    if (!submittedQuestion || isThinking) return

    const workingMessage: DemoMessage = {
      role: 'tool',
      label: 'Grace is working',
      body: 'Reading this slice’s chat history and approved synthetic source context…',
      meta: 'Live OpenAI prompt v1 · Read-only · Audit event recorded',
      generated: true,
    }

    setMessages((current) => ({
      ...current,
      [active.id]: [
        ...(current[active.id] ?? []),
        { role: 'user', label: 'You · live demo', body: submittedQuestion, generated: true },
        workingMessage,
      ],
    }))
    setQuestion('')
    setApproved(false)
    setRequestError('')
    setIsThinking(true)

    try {
      const history = [...active.messages, ...(messages[active.id] ?? [])]
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.body }))
      const response = await fetch('/api/grace', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slice: active.id,
          question: submittedQuestion,
          history,
        }),
      })
      const result = (await response.json()) as {
        answer?: string
        error?: string
        responseId?: string
        historyTurnsUsed?: number
      }
      if (!response.ok || !result.answer) throw new Error(result.error || 'Grace returned an incomplete response.')
      const answer = result.answer

      setMessages((current) => ({
        ...current,
        [active.id]: [
          ...(current[active.id] ?? []).filter((message) => message !== workingMessage),
          {
            role: 'assistant',
            label: 'Grace · Live OpenAI',
            body: answer,
            meta: `Prompt v1 · ${result.historyTurnsUsed ?? history.length} history turns · ${result.responseId ? `Response ${result.responseId.slice(0, 12)}… · ` : ''}No action taken`,
            generated: true,
          },
        ],
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Grace could not complete that request.'
      setMessages((current) => ({
        ...current,
        [active.id]: (current[active.id] ?? []).filter((item) => item !== workingMessage),
      }))
      setRequestError(message)
    } finally {
      setIsThinking(false)
    }
  }

  function ask(event: FormEvent) {
    event.preventDefault()
    void askQuestion(question)
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080a0c] text-white max-[500px]:w-[375px]">
      <section id="overview" className="relative border-b border-white/10 px-5 pt-7 pb-16 sm:px-8 lg:px-12 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(72,211,148,0.13),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl max-sm:mx-0 max-sm:w-[335px]">
          <nav className="flex items-center justify-between border-b border-white/10 pb-6">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] sm:gap-3 sm:text-sm sm:tracking-[0.16em]">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#6ee7a8] text-[#07100b]">
                <SparkIcon />
              </span>
              <span>
                THOMPSON & HORN <span className="text-white/40">INVESTMENTS</span>
              </span>
            </div>
            <div className="hidden gap-6 text-xs text-white/50 sm:flex">
              <a href="#overview">Overview</a>
              <a href="#end-state">End state</a>
              <a href="#demo">Demo</a>
            </div>
          </nav>
          <div className="pt-10 lg:pt-14">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-[#6ee7a8] uppercase">
                  OpenAI in production
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                  Proven with category leaders.
                </h2>
              </div>
              <p className="max-w-md text-xs/5 text-white/38">
                Publicly documented examples of organizations using OpenAI technology. No partnership or endorsement
                is implied.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] lg:grid-cols-4">
              {proofPoints.map((company, index) => (
                <article
                  key={company.name}
                  aria-label={`${company.name}: ${company.detail}`}
                  className={`min-h-40 p-4 sm:p-6 ${index % 2 === 0 ? 'border-r border-white/10' : ''} ${index < 2 ? 'border-b border-white/10 lg:border-b-0' : ''} lg:border-r lg:border-b-0 lg:last:border-r-0`}
                >
                  <div className="flex h-12 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/[0.05] text-xs font-bold text-[#6ee7a8]">
                      {company.mark}
                    </span>
                    <p
                      className={`font-semibold text-white ${company.name === 'Morgan Stanley' ? 'text-sm tracking-[-0.02em] sm:text-base' : company.name === 'stripe' ? 'text-2xl tracking-[-0.06em]' : 'text-xl tracking-[-0.04em]'}`}
                    >
                      {company.name}
                    </p>
                  </div>
                  <p className="mt-4 text-[11px]/5 text-white/42">{company.detail}</p>
                </article>
              ))}
            </div>
          </div>
          <div id="agenda" className="scroll-mt-6 pt-12 lg:pt-16">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-[#6ee7a8] uppercase">Today’s agenda</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Thirty minutes, start to finish.</h2>
              </div>
              <span className="hidden rounded-full border border-[#6ee7a8]/20 bg-[#6ee7a8]/[0.06] px-4 py-2 text-xs font-semibold text-[#9df0c2] sm:block">
                30 min
              </span>
            </div>
            <ol className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-4">
              {agenda.map(([number, title, duration, description]) => (
                <li key={number} className="bg-[#0b0e10] p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6ee7a8]">{number}</span>
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/50">
                      {duration}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-xs/5 text-white/42">{description}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="grid gap-12 pt-14 lg:grid-cols-[1.3fr_.7fr] lg:items-end lg:pt-24">
            <div>
              <p className="mb-5 text-xs font-semibold tracking-[0.24em] text-[#6ee7a8] uppercase">
                01 / Overview & key takeaway
              </p>
              <h1 className="max-w-4xl text-5xl/[0.94] font-semibold tracking-[-0.055em] sm:text-7xl lg:text-[86px]">
                Portfolio
                <span className="sm:hidden">
                  <br />
                </span>
                <span className="max-sm:hidden"> </span>intelligence.
                <br />
                <span className="text-white/38">Ready to act.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg/8 text-white/58 sm:text-xl/8">
                A governed AI operating layer that turns fragmented property signals into clear decisions, cited answers
                and reviewable action.
              </p>
            </div>
            <div className="rounded-3xl border border-[#6ee7a8]/25 bg-[#0e1512] p-6 sm:p-8">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#6ee7a8] uppercase">Stakeholder takeaway</p>
              <p className="mt-5 text-2xl/9 font-medium tracking-[-0.025em]">
                Your teams already have the data. The advantage is connecting it to the moment a decision gets made.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
                {[
                  ['24/7', 'access'],
                  ['1', 'interface'],
                  ['100%', 'reviewable'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <p className="text-2xl font-semibold text-[#6ee7a8]">{value}</p>
                    <p className="mt-1 text-[10px] tracking-wider text-white/40 uppercase">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="end-state" className="border-b border-white/10 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 max-sm:mx-0 max-sm:w-[335px] lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-[#6ee7a8] uppercase">
              02 / End state & key benefits
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              One trusted layer across the portfolio.
            </h2>
            <p className="mt-6 max-w-lg text-base/7 text-white/50">
              Not another chatbot. A controlled interface spanning operating data, institutional policy and the
              workflows that move performance.
            </p>
          </div>
          <div className="grid overflow-hidden rounded-3xl border border-white/10 sm:grid-cols-2">
            {benefits.map(([number, title, body]) => (
              <article
                key={number}
                className="border-b border-white/10 bg-[#0c0f12] p-6 last:border-b-0 sm:min-h-56 sm:border-r sm:p-8 sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-child(n+3)]:border-b-0"
              >
                <p className="text-xs font-semibold text-[#6ee7a8]">{number}</p>
                <h3 className="mt-10 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm/6 text-white/46">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="px-4 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl max-sm:mx-0 max-sm:w-[343px]">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-[#6ee7a8] uppercase">03 / Demo</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">See the operating thread.</h2>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/50">
              <span className="size-2 rounded-full bg-[#6ee7a8]" />
              Synthetic data · no live actions
            </div>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-white/12 bg-[#0c0f12] lg:grid lg:grid-cols-[310px_1fr]">
            <aside className="border-b border-white/10 bg-[#0a0c0e] p-3 lg:border-r lg:border-b-0">
              <div className="px-3 py-4">
                <p className="font-semibold">Decision workspace</p>
                <p className="mt-1 text-xs text-white/35">3 active portfolio threads</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2">
                {conversations.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveId(item.id)
                      setApproved(false)
                    }}
                    className={`min-w-64 rounded-2xl border p-4 text-left transition lg:w-full ${active.id === item.id ? 'border-[#6ee7a8]/30 bg-[#111916]' : 'border-transparent hover:bg-white/[0.04]'}`}
                  >
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <span className="text-[10px] text-white/30">{item.time}</span>
                    </div>
                    <p className="mt-2 truncate text-xs text-white/38">{item.subtitle}</p>
                  </button>
                ))}
              </div>
            </aside>
            <div className="flex min-h-[620px] flex-col">
              <header className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-7">
                <div>
                  <p className="font-semibold">{active.title}</p>
                  <p className="mt-1 text-xs text-white/35">{active.subtitle}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] tracking-wider text-white/40 uppercase">
                  Audit on
                </span>
              </header>
              <div className="border-b border-amber-200/10 bg-amber-100/[0.035] px-5 py-3 text-[10px]/5 text-amber-50/55 sm:px-7">
                <span className="font-semibold text-amber-100/80">Institutional demo notice:</span> Synthetic data only.
                AI output may be incomplete or inaccurate; review cited source records. No resident, employee, vendor or
                system action occurs without authorized human approval.
                <span className="mt-1 block text-white/30">Active sources: {active.sources}</span>
              </div>
              <div aria-live="polite" className="flex-1 space-y-5 p-5 sm:p-8">
                {[...active.messages, ...(messages[active.id] ?? [])].map((message, index) => (
                  <div
                    key={`${message.label}-${index}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-2xl rounded-2xl px-4 py-4 sm:px-5 ${message.role === 'user' ? 'rounded-br-sm bg-[#d9ffe9] text-[#07100b]' : message.role === 'tool' ? 'border border-[#6ee7a8]/15 bg-[#0d1712] text-white/68' : 'rounded-bl-sm border border-white/10 bg-[#12161a]'}`}
                    >
                      <p
                        className={`mb-2 text-[10px] font-semibold tracking-[0.15em] uppercase ${message.role === 'user' ? 'text-[#174c32]' : 'text-[#6ee7a8]'}`}
                      >
                        {message.label}
                      </p>
                      {message.role === 'assistant' && message.generated ? (
                        <StructuredAnswer body={message.body} />
                      ) : (
                        <p className="text-sm/6 whitespace-pre-wrap sm:text-[15px]/7">{message.body}</p>
                      )}
                      {message.meta && (
                        <p
                          className={`mt-3 text-[10px] ${message.role === 'user' ? 'text-[#174c32]/60' : 'text-white/32'}`}
                        >
                          {message.meta}
                        </p>
                      )}
                      {message.generated && message.role === 'assistant' && (
                        <div className="mt-4 border-t border-white/10 pt-4">
                          {approved ? (
                            <p className="rounded-xl bg-[#6ee7a8]/10 px-3 py-2 text-xs font-semibold text-[#6ee7a8]">
                              ✓ Approved — tasks added to audit trail
                            </p>
                          ) : (
                            <button
                              onClick={() => setApproved(true)}
                              className="rounded-xl bg-[#6ee7a8] px-4 py-2 text-xs font-semibold text-[#07100b]"
                            >
                              Approve & create tasks
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={ask} className="border-t border-white/10 p-4 sm:px-7">
                <div
                  className="mb-3 flex gap-2 overflow-x-auto pb-1"
                  aria-label={`Suggested questions for ${active.title}`}
                >
                  {active.suggestedQuestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      disabled={isThinking}
                      onClick={() => void askQuestion(suggestion)}
                      className="shrink-0 rounded-full border border-[#6ee7a8]/20 bg-[#6ee7a8]/[0.06] px-3 py-2 text-[11px] font-medium text-[#9df0c2] transition hover:border-[#6ee7a8]/45 hover:bg-[#6ee7a8]/10 disabled:opacity-40"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3 focus-within:border-[#6ee7a8]/50">
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    maxLength={2000}
                    disabled={isThinking}
                    placeholder={isThinking ? 'Grace is working…' : 'Ask about a property, policy or workflow…'}
                    aria-label="Ask Grace AI"
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25 disabled:cursor-wait"
                  />
                  <button
                    disabled={!question.trim() || isThinking}
                    className="grid size-8 place-items-center rounded-xl bg-[#6ee7a8] font-semibold text-[#07100b] disabled:opacity-30"
                    aria-label="Send"
                  >
                    {isThinking ? (
                      <span className="size-3 animate-spin rounded-full border-2 border-[#07100b]/30 border-t-[#07100b]" />
                    ) : (
                      '↑'
                    )}
                  </button>
                </div>
                {requestError ? (
                  <p role="alert" className="mt-2 text-xs text-[#ff9d9d]">
                    {requestError}
                  </p>
                ) : (
                  <p className="mt-2 text-[10px] text-white/25">
                    Multi-turn chat · Prior slice history included · Live OpenAI prompt v1
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
