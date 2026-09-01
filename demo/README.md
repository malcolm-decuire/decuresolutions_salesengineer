# Grace Hill presentation demo

## Local development

The Next.js project root is this `demo/` directory, so local runtime secrets must be stored here—not at the repository root.

1. Copy `demo/.env.example` to `demo/.env.local`.
2. Replace the placeholder with a valid `OPENAI_API_KEY`.
3. From the repository root, restart `npm run dev` after every environment-file change.
4. Open `/api/grace`. The diagnostic response must report `configured: true` before testing `/presentation`.

The real `.env.local` file is ignored by Git and must never be committed.

## Vercel through GitHub

In the Vercel project linked to the GitHub repository:

1. Open **Settings → Environment Variables**.
2. Add `OPENAI_API_KEY` to Development, Preview, and Production.
3. Redeploy the target Git commit after adding or changing the value.
4. Check `https://<deployment>/api/grace`; it must report `configured: true` and the intended Vercel environment.
5. Test all three `/presentation` slices with a starter question and a follow-up that depends on the previous answer.

The API key remains server-only. Do not rename it with a `NEXT_PUBLIC_` prefix.
