import { afterEach, describe, expect, it, vi } from 'vitest'

const createResponse = vi.hoisted(() => vi.fn())
vi.mock('openai', () => ({
  default: class OpenAI {
    responses = { create: createResponse }
  },
}))

import { GET, POST } from './route'

const originalApiKey = process.env.OPENAI_API_KEY

afterEach(() => {
  createResponse.mockReset()
  if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY
  else process.env.OPENAI_API_KEY = originalApiKey
})

describe('POST /api/grace', () => {
  it('reports safe runtime configuration diagnostics', async () => {
    delete process.env.OPENAI_API_KEY
    const response = GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      configured: false,
      environment: 'local',
      prompt: { id: 'pmpt_6a96583674808190abaa1ec796ca017003616f2de519b6fd', version: '1' },
    })
  })

  it('rejects an empty question before calling OpenAI', async () => {
    const response = await POST(
      new Request('http://localhost/api/grace', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: '   ' }),
      }),
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({ error: 'Enter a question for Grace.' })
  })

  it.each(['lease', 'training', 'maintenance'])(
    'requires live OpenAI configuration for the %s slice',
    async (slice) => {
      delete process.env.OPENAI_API_KEY
      const response = await POST(
        new Request('http://localhost/api/grace', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slice,
            question: 'What changed since the previous answer?',
            history: [
              { role: 'user', content: 'Give me the current status.' },
              { role: 'assistant', content: 'Here is the current status.' },
            ],
          }),
        }),
      )

      expect(response.status).toBe(503)
      await expect(response.json()).resolves.toEqual({
        code: 'OPENAI_NOT_CONFIGURED',
        error: 'Live OpenAI chat is not configured. Add OPENAI_API_KEY to demo/.env.local, then restart npm run dev.',
      })
    },
  )

  it('rejects malformed chat history', async () => {
    const response = await POST(
      new Request('http://localhost/api/grace', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slice: 'lease',
          question: 'Continue.',
          history: [{ role: 'tool', content: 'hidden' }],
        }),
      }),
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({ error: 'The selected demo slice or chat history is invalid.' })
  })

  it('normalizes an environment assignment copied into the Vercel secret value', async () => {
    process.env.OPENAI_API_KEY = ' OPENAI_API_KEY="test-key" '
    createResponse.mockResolvedValue({ id: 'resp_normalized', output_text: 'Normalized key answer' })

    const response = await POST(
      new Request('http://localhost/api/grace', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slice: 'lease', question: 'What is the risk?', history: [] }),
      }),
    )

    expect(response.status).toBe(200)
    expect(createResponse).toHaveBeenCalled()
  })

  it.each([
    [401, 'OPENAI_AUTH_FAILED', 'Replace OPENAI_API_KEY'],
    [429, 'OPENAI_RATE_LIMITED', 'project quota'],
    [404, 'OPENAI_PROMPT_NOT_FOUND', 'configured OpenAI prompt'],
  ])('returns an actionable safe error for OpenAI status %s', async (status, code, message) => {
    process.env.OPENAI_API_KEY = 'test-key'
    createResponse.mockRejectedValue(Object.assign(new Error('sensitive upstream detail'), { status }))

    const response = await POST(
      new Request('http://localhost/api/grace', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slice: 'training', question: 'What is overdue?', history: [] }),
      }),
    )

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ code, error: expect.stringContaining(message) })
  })

  it.each([
    ['lease', 'Lease renewal risk'],
    ['training', 'Training compliance'],
    ['maintenance', 'Maintenance escalation'],
  ])('sends prior chat history and scoped context for the %s slice', async (slice, contextLabel) => {
    process.env.OPENAI_API_KEY = 'test-key'
    createResponse.mockResolvedValue({ id: `resp_${slice}`, output_text: `Answer for ${slice}` })
    const history = [
      { role: 'user', content: 'What is the current status?' },
      { role: 'assistant', content: 'Here is the current status.' },
    ]

    const response = await POST(
      new Request('http://localhost/api/grace', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slice, question: 'What changed?', history }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      answer: `Answer for ${slice}`,
      responseId: `resp_${slice}`,
      historyTurnsUsed: 2,
    })
    expect(createResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: { id: 'pmpt_6a96583674808190abaa1ec796ca017003616f2de519b6fd', version: '1' },
        input: [
          expect.objectContaining({ role: 'developer', content: expect.stringContaining(contextLabel) }),
          ...history,
          { role: 'user', content: 'What changed?' },
        ],
        store: false,
      }),
    )
  })
})
