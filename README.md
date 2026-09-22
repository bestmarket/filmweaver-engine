# Stellar Studio Foundation

Here is the phase one, make it look like multi billion dollar tool, it should have it own authentication not lovable, the interface should look wonderfully attractive like lovable interface: 

Continue from the approved Master Engineering Directive.
Now implement PHASE 1 ONLY.
PHASE 1 — FOUNDATION
Build the technical foundation for AI Movie Studio.
1. Application architecture
Establish clean separation between:
frontend
backend
database
AI orchestration
provider integrations
job processing
storage
authentication
billing/credits
administration
Do not mix provider-specific logic throughout the application.
2. Provider abstraction
Create server-side interfaces for:
LLM Image Video Voice Music Storage
Gemini must be the initial LLM/image/video integration where supported by the configured models.
The rest must have provider interfaces ready for additional providers.
3. Database
Create the foundational schema for:
users roles projects movies subscriptions credits characters locations scenes shots assets jobs provider configurations provider usage audit logs
Use proper relationships, indexes and timestamps.
Every user-owned resource must contain ownership information.
4. Authentication
Implement secure authentication.
Roles:
USER ADMIN
Users must never access another user's:
projects assets jobs credits billing information
Admin routes must be protected server-side.
5. Environment configuration
Create a clean server-side environment configuration system.
Never put secret provider keys into client-side code.
Document required environment variables.
Do not hard-code secrets.
6. Job foundation
Implement the generic job model and job service.
Jobs must support:
queued processing completed failed cancelled retrying
Include:
job ID project ID user ID job type status attempt count error information timestamps provider metadata
Implement idempotency.
7. Logging
Implement structured application logging.
Never log:
API keys passwords tokens private credentials
8. Tests
Create tests for:
authentication authorization project ownership database relationships job creation job status transitions credit reservation logic
Do not build movie-generation UI yet.
At the end, run the entire test/build process and fix all errors.
Report:
architecture created
database created
security implemented
tests passed
remaining work
Do not continue to Phase 2 automatically.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://filmweaver-engine.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/33c03ef1-25ca-4da0-a035-20cf03e6faa0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
