# Proposal Helper Version Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve every historical version while making the mature free saved-progress version the sole clearly labelled update target.

**Architecture:** Keep the existing Git branches and tag intact. Add a version-status ledger to both reachable branch roots, rename the mature deployment workflow to remove its obsolete paid label, and create a separate local clone checked out to the production branch.

**Tech Stack:** Git, GitHub Actions workflow metadata, Markdown documentation, Windows filesystem.

## Global Constraints

- Do not delete branches, tags, drafts, saved data, or old desktop folders.
- The active production source is `origin/highauto` at commit `233cbb6` unless a later deliberate release supersedes it.
- The official public domain remains `proposal.we-teach.cn → 8085 → 3007`.
- The mature version is free and has 6-digit save/restore support.

---

### Task 1: Mark branch and tag roles

**Files:**
- Create: `VERSION_STATUS.md` on `main`
- Create: `VERSION_STATUS.md` on `highauto`
- Modify: `.github/workflows/deploy-highauto.yml` on `highauto`

**Interfaces:**
- Consumes: Git references `main`, `highauto`, and `mvp2-stable-style`.
- Produces: A plain-language status marker visible immediately after opening either active branch.

- [x] **Step 1: Add the main-branch ledger**

State that `main` is the disabled internal-beta source without save/restore and must not be deployed to the official domain.

- [x] **Step 2: Add the highauto-branch ledger**

State that `highauto` is the only active production source, free of a paywall, and has six-digit save/restore.

- [x] **Step 3: Rename the mature deployment workflow**

Change only the displayed workflow name from the obsolete paid label to `Deploy mature public version (free, saved progress)`.

- [x] **Step 4: Verify branch-specific files**

Run:

```powershell
git show origin/main:VERSION_STATUS.md
git show origin/highauto:VERSION_STATUS.md
git show origin/highauto:.github/workflows/deploy-highauto.yml | Select-Object -First 1
```

Expected: main is marked disabled; highauto is marked active; workflow contains no paid label.

### Task 2: Create a durable local update folder

**Files:**
- Create: `D:\AIProjects\01-active\proposal-helper\` (Git clone)

**Interfaces:**
- Consumes: `https://github.com/milaotou-tools/proposal-helper.git`, branch `highauto`.
- Produces: A full Git worktree on the mature production branch for future maintenance.

- [x] **Step 1: Clone the active branch into the dedicated folder**

Run:

```powershell
git clone --branch highauto --single-branch https://github.com/milaotou-tools/proposal-helper.git "D:\AIProjects\01-active\proposal-helper"
```

- [x] **Step 2: Verify the checkout**

Run:

```powershell
git -C "D:\AIProjects\01-active\proposal-helper" status --short --branch
git -C "D:\AIProjects\01-active\proposal-helper" log -1 --oneline
```

Expected: branch `highauto`, clean working tree, and the active release commit.
