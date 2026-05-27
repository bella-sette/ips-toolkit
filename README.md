# IPS Toolkit

I'm starting a role as an Inside Product Specialist at Dell, and I wanted a better way to ramp than reading PDFs. So I built this.

**Live:** https://ips-toolkit-seven.vercel.app/

It's three tools in one app, all focused on Dell's enterprise compute and storage portfolio (PowerEdge and PowerStore).

## What's in it

**Quote configurator.** Pick a server or storage array, set the components, see the volume discount tier flip as the total grows. The sidebar shows estimated margin alongside the total, because the job pays on margin and I wanted to start training my eye for it.

**Flashcards.** 55 cards on positioning, services, AI/ML, competitive talk tracks, and sales motion. Uses spaced repetition (a simplified SM-2) so the cards I miss come back fast and the ones I nail get pushed out. Tracks all-time progress and surfaces my weakest category.

**Discovery question generator.** Pick an industry, company size, and primary pain point, and it builds a SPIN-style question set with the Dell products most likely to fit. Meant as pre-call prep, not a script.

## Stack

React, Vite, Tailwind. Everything runs in the browser — flashcard progress and saved quotes go to localStorage. No backend, hosted free on Vercel.

## A few things I thought about while building it

Most flashcard apps just shuffle. Shuffle is useless once you've seen a card twice. Spaced repetition takes maybe 40 lines of code and makes the tool actually useful for studying.

I wanted it to look like a thinking tool, not a Salesforce dashboard. Cream background, serif headlines, lots of monospace labels. There's enough corporate-blue in my future.

The margin numbers are illustrative, not Dell's real list. Calling that out so no one gets the wrong idea.

## Running it

```bash
npm install
npm run dev
```

## Things I'd add later

- Battle cards (Dell vs HPE, Lenovo, Supermicro)
- Networking attach in the configurator
- Discovery questions that branch based on answers
- CSV export for saved quotes

---

Not affiliated with Dell Technologies. Personal project for ramp.
