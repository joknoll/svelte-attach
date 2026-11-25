---
name: update-deps
description: Update this projects dependencies, runtime and toolchain through vp, exploring what the new releases make possible.
disable-model-invocation: true
---

!`vp install --frozen-lockfile && vp run ready && vp outdated -r --format list`
