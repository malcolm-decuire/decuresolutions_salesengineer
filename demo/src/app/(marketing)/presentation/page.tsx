'use client'

import { FormEvent, useState } from 'react'

type DemoMessage = {
  role: 'user' | 'assistant' | 'tool'
  label: string
  body: string
  meta?: string
  generated?: boolean
}

type Conversation = {
  id: string
  title: string
  subtitle: string
  time: string
  unread?: boolean
  messages: DemoMessage[]
}

const conversations: Conversation[] = [
  {
    id: 'lease',
    title: 'Lease renewal risk',
    subtitle: 'Oakline Commons · 312 units',
    time: '9:42 AM',
    unread: true,
    messages: [
      {
        role: 'user',
        label: 'Regional VP',
        body: 'Which residents at Oakline Commons are most likely to decline renewal, and what should my team do this week?',
      },
      {
        role: 'tool',
        label: 'Connected systems',
        body: 'Resident ledger, maintenance history, survey feedback and renewal calendar searched securely.',
        meta: '4 sources · 1.8s',
      },
      {
        role: 'assistant',
        label: 'Grace, AI operations agent',
        body: 'I found 18 upcoming renewals with elevated risk. The strongest signals are unresolved work orders, two low survey scores and above-market increases. I prioritized the five residents requiring outreach today and drafted personalized, policy-compliant messages for manager approval.',
        meta: 'Evidence attached · Human approval required before send',
      },
    ],
  },
  {
    id: 'training',
    title: 'Training compliance',
    subtitle: 'Southeast portfolio · 14 sites',
    time: 'Yesterday',
    messages: [
      {
        role: 'user',
        label: 'VP of Operations',
        body: 'Give me the compliance gaps that could affect next week’s audit. Keep it executive-level.',
      },
      {
        role: 'tool',
        label: 'File search',
        body: 'Reviewed current policy documents, LMS completion records and site rosters.',
        meta: '36 documents · 428 records',
      },
      {
        role: 'assistant',
        label: 'Grace, AI operations agent',
        body: 'Three sites need attention. Nine team members have overdue fair-housing modules, two certificates expire within seven days and one roster mismatch needs HR validation. I prepared a site-by-site action list with owners, due dates and source links.',
        meta: 'No employee action taken · Review action plan',
      },
    ],
  },
  {
    id: 'maintenance',
    title: 'Maintenance escalation',
    subtitle: 'After-hours resident request',
    time: 'Mon',
    messages: [
      {
        role: 'user',
        label: 'Community Manager',
        body: 'Summarize the after-hours incident at Meridian Place and tell me what still needs an owner.',
      },
      {
        role: 'tool',
        label: 'Function calls',
        body: 'Pulled the work order timeline, vendor dispatch status and resident communication log.',
        meta: '3 live systems · Read only',
      },
      {
        role: 'assistant',
        label: 'Grace, AI operations agent',
        body: 'The leak was isolated at 11:18 PM and the restoration vendor arrived at 12:06 AM. Resident relocation is confirmed. The only open item is the insurance photo package, assigned to the assistant manager for 10:00 AM. I can draft the resident follow-up now.',
        meta: 'Timeline reconciled · 1 open action',
      },
    ],
  },
]

const capabilities = [
  ['One conversation, every system', 'Bring policies, property data and live operational tools into a single governed workflow.'],
  ['Answers with evidence', 'Ground every recommendation in approved files and system records, with sources visible to the operator.'],
  ['Action, with control', 'Draft messages, route work and update systems through typed functions while people approve sensitive steps.'],
  ['Built for the operating model', 'Use persistent context to continue portfolio work without forcing teams to repeat the background each time.'],
]

const suggestedQuestions = [
  'Show me the residents who need outreach today',
  'What evidence drove the risk score?',
  'Draft the manager action plan',
]

function buildDemoResponse(question: string): DemoMessage {
  const normalized = question.toLowerCase()

  if (normalized.includes('evidence') || normalized.includes('why')) {
    return {
      role: 'assistant',
      label: 'Grace, AI operations agent',
      body: 'The highest-risk group is supported by four observable signals: 6 unresolved work orders, 4 survey scores below 3/5, 5 renewal increases above 7%, and 3 residents with repeated contact attempts. I linked each signal to its source record so the regional team can validate the recommendation before acting.',
      meta: '18 resident records · 4 evidence groups · Sources ready to inspect',
      generated: true,
    }
  }

  if (normalized.includes('draft') || normalized.includes('plan')) {
    return {
      role: 'assistant',
      label: 'Grace, AI operations agent',
      body: 'I drafted a two-step action plan: community managers contact the five highest-risk residents by 3:00 PM, while maintenance owners close or update the six open work orders by end of day. The messages are personalized from approved templates and remain queued until a regional manager approves them.',
      meta: '5 outreach tasks · 6 maintenance follow-ups · Approval required',
      generated: true,
    }
  }

  return {
    role: 'assistant',
    label: 'Grace, AI operations agent',
    body: 'I found five residents who need outreach today. Two have unresolved maintenance issues, two are above the recommended renewal increase threshold, and one has both risk factors. I prepared the prioritized list, assigned the correct community managers, and drafted compliant outreach for review.',
    meta: '5 residents prioritized · 5 drafts ready · No messages sent',
    generated: true,
  }
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <path d="M12 2.8c.8 4.8 3.3 7.3 8.2 8.2-4.9.9-7.4 3.4-8.2 8.2-.8-4.8-3.3-7.3-8.2-8.2 4.9-.9 7.4-3.4 8.2-8.2Z" fill="currentColor" />
    </svg>
  )
}

export default function PresentationPage() {
  const [activeId, setActiveId] = useState(conversations[0].id)
  const [question, setQuestion] = useState('')
  const [demoMessages, setDemoMessages] = useState<Record<string, DemoMessage[]>>({})
  const [isThinking, setIsThinking] = useState(false)
  const [actionStatus, setActionStatus] = useState<'idle' | 'approved'>('idle')
  const active = conversations.find((conversation) => conversation.id === activeId) ?? conversations[0]
  const visibleMessages = [...active.messages, ...(demoMessages[active.id] ?? [])]

  function askGrace(event?: FormEvent) {
    event?.preventDefault()
    const submittedQuestion = question.trim()
    if (!submittedQuestion || isThinking) return

    setDemoMessages((current) => ({
      ...current,
      [active.id]: [
        ...(current[active.id] ?? []),
        { role: 'user', label: 'You · live demo', body: submittedQuestion, generated: true },
        {
          role: 'tool',
          label: 'Grace is working',
          body: 'Searching approved resident, maintenance and renewal sources…',
          meta: 'Read-only access · Audit event recorded',
          generated: true,
        },
      ],
    }))
    setQuestion('')
    setIsThinking(true)
    setActionStatus('idle')

    window.setTimeout(() => {
      setDemoMessages((current) => ({
        ...current,
        [active.id]: [
          ...(current[active.id] ?? []).filter((message) => message.label !== 'Grace is working'),
          buildDemoResponse(submittedQuestion),
        ],
      }))
      setIsThinking(false)
    }, 700)
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#f8f7f4] text-[#17211b]">
      <section className="relative overflow-hidden border-b border-[#d9ddd8] px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[#b9e3ce]/45 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#1e684c]/20 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#1e684c]">
              <SparkIcon /> Grace Hill × OpenAI
            </div>
            <h1 className="max-w-4xl font-display text-5xl/[0.94] font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Turn property operations into a conversation.
            </h1>
            <p className="mt-6 max-w-2xl text-lg/8 text-[#536159] sm:text-xl/8">
              A governed AI operations layer that helps multifamily teams find the right answer, understand the evidence and move work forward.
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              ['24/7', 'operational access'],
              ['1', 'trusted interface'],
              ['100%', 'reviewable actions'],
            ].map(([value, label], index) => (
              <div key={label} className={`min-w-0 rounded-2xl border border-[#d9ddd8] bg-white/80 p-3 shadow-sm backdrop-blur sm:p-5 ${index === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
                <div className="text-2xl font-semibold tracking-tight text-[#1e684c] sm:text-3xl">{value}</div>
                <div className="mt-1 break-words text-[10px]/4 text-[#69766f] sm:text-sm/5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1e684c]">Live workflow preview</p>
              <h2 className="mt-2 max-w-[330px] text-2xl font-semibold tracking-[-0.035em] sm:max-w-none sm:text-4xl">The work is already in the thread.</h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e7f4ed] px-3 py-1.5 text-xs font-medium text-[#1e684c]">
              <span className="size-2 rounded-full bg-[#2d936b]" /> Synthetic demo data · no live actions
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[#d4d9d5] bg-white shadow-[0_24px_80px_-44px_rgba(18,42,30,0.45)] lg:grid lg:grid-cols-[330px_1fr]">
            <aside className="min-w-0 border-b border-[#e2e5e2] bg-[#f1f3f0] p-3 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between px-3 py-3">
                <div>
                  <p className="text-sm font-semibold">Operations inbox</p>
                  <p className="text-xs text-[#7a847e]">3 decision threads</p>
                </div>
                <button className="grid size-9 place-items-center rounded-xl bg-[#1f6249] text-lg text-white" aria-label="New conversation">+</button>
              </div>
              <div className="mt-2 flex max-w-full gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setActiveId(conversation.id)
                      setActionStatus('idle')
                    }}
                    className={`min-w-64 rounded-2xl border p-4 text-left transition lg:w-full ${
                      active.id === conversation.id
                        ? 'border-[#b8d6c7] bg-white shadow-sm'
                        : 'border-transparent bg-transparent hover:bg-white/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">{conversation.title}</p>
                      <span className="shrink-0 text-[11px] text-[#8a948e]">{conversation.time}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="truncate text-xs text-[#6c7770]">{conversation.subtitle}</p>
                      {conversation.unread && <span className="size-2 rounded-full bg-[#2d936b]" />}
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <div className="flex min-h-[590px] flex-col bg-[#fbfbfa]">
              <div className="flex items-center justify-between border-b border-[#e6e8e5] bg-white px-5 py-4 sm:px-7">
                <div>
                  <p className="font-semibold">{active.title}</p>
                  <p className="text-xs text-[#7b857f]">{active.subtitle}</p>
                </div>
                <div className="rounded-full border border-[#dce1dd] px-3 py-1 text-xs text-[#607068]">Audit trail on</div>
              </div>
              <div className="flex-1 space-y-5 p-5 sm:p-7 lg:p-9">
                {visibleMessages.map((message, index) => (
                  <div
                    key={`${active.id}-${index}-${message.label}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-2xl rounded-2xl px-4 py-3.5 sm:px-5 ${
                        message.role === 'user'
                          ? 'rounded-br-md bg-[#1f6249] text-white'
                          : message.role === 'tool'
                            ? 'border border-[#d9ddd9] bg-[#f0f3f0] text-[#34443a]'
                            : 'rounded-bl-md border border-[#dce2dd] bg-white text-[#25332b] shadow-sm'
                      }`}
                    >
                      <div className={`mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${message.role === 'user' ? 'text-white/65' : 'text-[#478066]'}`}>
                        {message.label}
                      </div>
                      <p className="text-sm/6 sm:text-[15px]/7">{message.body}</p>
                      {message.meta && <p className="mt-2 text-[11px] text-[#758079]">{message.meta}</p>}
                      {message.generated && message.role === 'assistant' && (
                        <div className="mt-4 border-t border-[#e2e6e3] pt-4">
                          {actionStatus === 'approved' ? (
                            <div className="flex items-center gap-2 rounded-xl bg-[#e8f5ee] px-3 py-2 text-xs font-semibold text-[#1f6b4d]">
                              <span className="grid size-5 place-items-center rounded-full bg-[#2d936b] text-white">✓</span>
                              Approved — 5 tasks created and added to the audit trail
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setActionStatus('approved')}
                                className="rounded-xl bg-[#1f6249] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#174d39]"
                              >
                                Approve & create tasks
                              </button>
                              <button className="rounded-xl border border-[#d6dcd7] px-3.5 py-2 text-xs font-semibold text-[#536159]">
                                Review sources
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#e6e8e5] bg-white p-4 sm:px-7">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {suggestedQuestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setQuestion(suggestion)}
                      className="shrink-0 rounded-full border border-[#dce2dd] bg-[#f7f9f7] px-3 py-1.5 text-[11px] font-medium text-[#52645a] hover:border-[#9dc5b1]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <form onSubmit={askGrace} className="flex items-center gap-3 rounded-2xl border border-[#d7dcd8] bg-[#fafbf9] px-4 py-2.5 text-sm focus-within:border-[#6ba88b] focus-within:ring-2 focus-within:ring-[#dcefe5]">
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask about a property, policy or workflow…"
                    aria-label="Ask Grace a question"
                    className="min-w-0 flex-1 bg-transparent py-1 text-[#25332b] outline-none placeholder:text-[#89928d]"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || isThinking}
                    className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#1f6249] text-white transition enabled:hover:bg-[#174d39] disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Ask Grace"
                  >
                    ↑
                  </button>
                </form>
                <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#8a948e]">
                  <span>{isThinking ? 'Grace is checking connected sources…' : 'Try a suggested question or ask your own.'}</span>
                  <span>Evidence + approvals stay visible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#17251e] px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#86d2ae]">Why Grace Hill</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Intelligence your teams can actually operate.</h2>
              <p className="mt-5 max-w-lg text-base/7 text-white/62">
                The opportunity is not another chatbot. It is a trusted interface across learning, policy and property operations—with the controls enterprise teams expect.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-3xl bg-white/12 sm:grid-cols-2">
              {capabilities.map(([title, body], index) => (
                <div key={title} className="bg-[#1d2f26] p-6 sm:p-8">
                  <span className="text-xs font-semibold text-[#86d2ae]">0{index + 1}</span>
                  <h3 className="mt-7 text-xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-3 text-sm/6 text-white/58">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 grid gap-4 rounded-3xl border border-white/12 bg-white/[0.04] p-6 sm:grid-cols-3 sm:p-8">
            {[
              ['Responses API', 'Stateful, multimodal conversations'],
              ['File search + tools', 'Grounded answers and system actions'],
              ['Human-in-the-loop', 'Approvals, evidence and auditability'],
            ].map(([title, text]) => (
              <div key={title} className="border-white/10 max-sm:border-b max-sm:pb-4 sm:border-r sm:last:border-r-0 sm:pr-6">
                <p className="font-semibold text-[#9be0bf]">{title}</p>
                <p className="mt-1 text-sm text-white/58">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
