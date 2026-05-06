# Block 1 Prep: Reading Before Your Next Session

> Read this during a coffee break, not at the keyboard.
> When you sit down for the real session, you'll already know what's coming.

---

## What block 1 produces

By the end of block 1, your project will have:

- A real Next.js project on your machine, running locally
- TypeScript and Tailwind CSS configured
- A clean folder structure with your brief and ADRs in `/docs/`
- Prisma installed (database setup happens in block 2)
- A README that doesn't embarrass you
- Everything pushed to your `mohamedmeghawry/modest-filter` repo on GitHub
- A first deployment to Vercel showing a working homepage in production

That last bullet matters. By end of block 1, you'll have a real public URL you could send to anyone, even though it just shows "Hello, modest filter." Shipping something tiny to production on day one builds momentum and proves the deployment pipeline works.

## Time estimate

- 2 to 3 hours of focused work
- Best done in one sitting, not split across days

## What to have ready before you start

**Open in browser tabs (don't navigate away):**

- github.com (logged in as mohamedmeghawry)
- vercel.com (you'll create a free account during the session)
- supabase.com (account creation, but database work is block 2)

**Open on your machine:**

- VS Code (we'll install this as the very first step if you don't have it)
- Git Bash (or Windows Terminal with the Git Bash profile)

**Have at hand:**

- Your project brief and 5 ADRs (the files I created earlier)
- This prep document
- Water or coffee. You'll be staring at terminal output for a while.

## The four mini-blocks of block 1

### Mini-block 1A: Install VS Code (10 minutes)

VS Code is the editor we'll use. Free, made by Microsoft, the dominant editor in modern web development.

We'll also install three VS Code extensions that matter:

- ESLint (catches code quality issues)
- Prettier (auto-formats code)
- Tailwind CSS IntelliSense (autocomplete for Tailwind classes)

### Mini-block 1B: Install Claude Code (10 minutes)

Claude Code is the agentic coding tool I described earlier. It runs in your terminal, reads your codebase, edits files, runs commands. This is what you'll use to do most of the actual coding.

You'll need a Claude Pro subscription ($20/month) or to be on a paid plan. If you're not already on Pro, we'll talk about whether to upgrade now or proceed with just Claude.ai (slower but doable).

### Mini-block 1C: Create the Next.js project (45-60 minutes)

This is the meat of block 1. We'll:

1. Run `npx create-next-app@latest` in your projects folder
2. Answer its setup questions (TypeScript: yes, Tailwind: yes, App Router: yes, etc.)
3. Verify the project runs locally with `npm run dev`
4. Set up the `/docs/` folder with your brief and ADRs
5. Write a real README
6. Add a proper `.gitignore` (Next.js gives you a starter, we'll extend it)
7. Make your first proper commit using conventional commit format

**Critical detail:** the project folder you already created (`~/Documents/projects/modest-filter`) is correct. We'll work inside it.

### Mini-block 1D: Push to GitHub and deploy to Vercel (30-45 minutes)

1. Create the empty `modest-filter` repository on github.com
2. Connect your local project to the GitHub repo
3. Push your first commit
4. Sign up for Vercel (free) using your GitHub account
5. Import the project to Vercel
6. Watch it deploy automatically
7. See your homepage live at a real URL

## Decisions you'll make during block 1

I'll guide you, but these decisions are yours:

**Project name:** I'll recommend `modest-filter` as the GitHub repo name. Confirm or change before we start.

**License:** I'll recommend MIT (the most permissive, standard for portfolio projects). Confirm or change.

**Repository visibility:** Public or private? Public is recommended for portfolio purposes. Private is fine if you want to keep things quiet until v1 is shippable. You can flip this later.

## Things you DON'T need to think about yet

These come in later blocks. Don't get distracted by them tonight:

- Database schema design (block 2)
- Affiliate network signup (block 4 or 5)
- The actual filter UI (block 3)
- AI tagging logic (block 4)
- Custom domain (later)

## Mental preparation

A few honest things about what block 1 will feel like:

**You'll see lots of terminal output that looks scary but isn't.** Installing packages prints hundreds of lines. Most of it is normal. Don't read every line.

**You'll see warnings during installation. Most are harmless.** I'll tell you which ones to actually worry about.

**You'll write almost no application code in block 1.** It's setup. The "I'm building something!" feeling comes in block 3 or 4. This is normal and intentional.

**Things will go slightly wrong at some point.** A version mismatch, a typo, a missing file. This is part of development. We'll debug together. Don't panic, don't restart from scratch, paste the error and we work through it.

## When you come back

Open this chat and just say "ready for block 1." I'll start with mini-block 1A (VS Code install) and we'll go step by step from there.

Have a good rest. You earned it.

---

## Block 0 recap (what you already have)

- Node.js installed
- Git installed and configured (name: Mohamed Meghawry, email: m.meghawry@outlook.com)
- Windows Terminal with Git Bash profile working
- GitHub account: mohamedmeghawry
- SSH key generated with passphrase, added to GitHub, connection verified
- Project folder created at ~/Documents/projects/modest-filter

That's a fully ready development machine. Block 1 builds on top of it.
