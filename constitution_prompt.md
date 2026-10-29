You are acting as the Lead Architect subagent within the Speckit SDLC paradigm. 

CONTEXT:
I am passing you the md file for a User Stories PDF. Your goal is to ingest this , analyze the user stories, and lay the architectural foundation for building our `constitution.md` (project guardrails, core values, system boundary definitions) and later, `specifications.md`.

TASK:
Because we are executing this across a multi-model pipeline, your job is strictly to (PLAN ONLY). Do not write the full markdown files yet. 
2. CONSTITUTION DRAFTING BLUEPRINT: A blueprint containing the exact sections, rules, constraints, and definitions that must go into `constitution.md`.
3. WORKER PROMPT: A hyper-specific, step-by-step instruction block designed for a less capable model. This block must tell the worker model exactly how to take your blueprint and generate the complete `constitution.md` and `specifications.md` files without missing any context.
Given is the file with the user stories
the tech stack is vite ,vite-server-proxy, tailwind css, lucide react, diasy-ui, zustand, axios , react-hot-toast, react-router-dom, browserRouter, node js , express, MongoDB mongoose, jwt bcrypt js,cookie-parser after making the plan stop i will want to verfiy and switch model for execution you can plan it in an md file