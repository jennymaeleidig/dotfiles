# Secrets stay out of Source state

Machine-owner credentials — API keys, auth cookies, tokens — are configured on the host at runtime (env vars or owner-owned config files) and never declared in the pi settings dotfile or any other source file. The decision came out of the quota-provider setup (since retired): declaring providers and keys in settings was rejected precisely because it would put credentials in Source state. Consequence: a fresh host needs one-time owner configuration for anything that authenticates.
