# Conventions

## Comments

Write short, present-tense comments for decisions, invariants, failure paths, cleanup ownership, ordering, and external contracts. Use `//` above the relevant code, JSDoc for information callers need on hover, and markup or CSS comments where those languages require them. Remove comments that paraphrase code, narrate edits, divide sections, or disable old code. Preserve tool directives verbatim and put their reason in a separate comment when the code establishes it.

Use tags sparingly and start the comment with the tag. Follow it with one or two plain sentences.

- **`TODO:`** State known unfinished work and what it is waiting for.
- **`FIXME:`** State what breaks and when.
- **`HACK:`** Identify the workaround and when it can go.
- **`WARNING:`** Name the non-obvious consequence of changing the code.
- **`SECURITY:`** Say which access, validation, or secrecy boundary the code enforces.
- **`CONTRACT:`** Name the external consumer or specification and the behavior it relies on.
