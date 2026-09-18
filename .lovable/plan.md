# Complete the Deadly’s Studio public portfolio

## Team portraits
- Replace the current team image references with the five newly supplied portraits in their stated order: Caleb, Marisa, Blast, Shark, and Alpha.
- Keep Oscar in the second position with a deliberate high-end typographic placeholder until a headshot is available.
- Preserve the exact names, titles, and descriptions already supplied, with consistent editorial portrait crops across desktop and mobile.

## Public studio navigation and presentation
- Refine the black editorial studio system so the homepage, review portal, and jobs area feel like one cohesive premium site inspired by the supplied reference without copying its protected branding or content.
- Add visible navigation for Work, Studio, Free Review, and Careers while keeping staff access discreet in the footer.
- Keep the existing nine-project portfolio and private `/admin` workspace isolated from public pages.

## Free game review portal
- Add a dedicated `/review` page with a focused Roblox title submission experience.
- Collect the game URL, developer/studio name, contact email, game stage, primary goal, and optional context.
- Validate submissions, show clear success/error states, prevent repeat submissions while sending, and save completed requests to the cloud database for staff follow-up.

## Careers and job board
- Add `/jobs` with a concise studio culture introduction, practical perks such as modern workspace support and gym/wellness stipends, and open roles for Acquisition Executive and Live Operations.
- Give each role a scannable responsibility/fit summary and a working application form that records applicant details, portfolio/profile links, and a short note in the cloud database.
- Include clear empty/error/success states and accessible keyboard-friendly controls.

## Data protection
- Add public-submission tables with explicit grants and row-level rules that allow anonymous inserts only; public visitors cannot read, edit, or delete submissions.
- Validate and constrain submitted values in both the interface and database schema.

## Validation
- Verify portrait order and cropping, homepage navigation, game review submission, job application submission, public/private isolation, and mobile/desktop layouts.
- Check the final preview for build, runtime, console, and broken-image errors.
