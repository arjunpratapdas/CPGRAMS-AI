This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Jan-Awaz prototype

Jan-Awaz turns a citizen's plain-language grievance into a privacy-redacted, department-routed CPGRAMS-ready draft. Voice input, triage, registration, tracking, and escalation are demonstrated with synthetic data.

This is not an official CPGRAMS service. No complaint is sent to a government system. Demo registrations are stored only in the current browser. Common Aadhaar, PAN, phone, email, bank, and date-of-birth patterns are redacted before triage.

### AI configuration

The `/api/triage` route uses the local deterministic router when no key is configured. When `OPENAI_API_KEY` is configured, OpenAI receives only the redacted citizen text and the synthetic taxonomy; it does not receive government records or credentials. The result is labeled OpenAI-assisted. If the API is unavailable, the local mock router keeps the demo usable offline. Registration IDs, status history, departments, SLA values, and tracking records are always synthetic demo data.

### Run locally
