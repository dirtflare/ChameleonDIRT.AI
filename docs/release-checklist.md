# Release checklist

A lightweight, repeatable process for cutting a public release. Aimed at v0.1.x; revisit once
the project stabilizes.

`package.json` currently carries `"version": "0.0.0"` and `"private": true`. Nothing is published
to npm — a release here means a git tag plus a GitHub Release.

## 1. Pre-release checks

Run from a clean checkout of the branch you intend to tag:

```bash
git status                # working tree must be clean
npm ci                    # install exactly what the lockfile pins
npm run typecheck
npm test
npm run build             # must succeed; note the bundle size it reports
```

CI runs the same three checks, so a green build on the merge commit covers this. Run it locally
anyway if you changed dependencies.

Then confirm by hand:

- [ ] The app starts with `npm run dev` and generates at least one image with a real key.
- [ ] Cancelling a run mid-flight leaves the UI usable and keeps completed results.
- [ ] An invalid key shows the API key help screen, not a generic failure.
- [ ] Core actions are reachable by keyboard: upload, add prompt, generate, open preview, close
      preview.

## 2. Secrets sanity check

- [ ] `.env.local` is **not** tracked: `git ls-files | grep -c '\.env\.local'` returns `0`.
- [ ] `.env.example` contains placeholders only, never a real key.
- [ ] The build output carries no key. With no `GEMINI_API_KEY` in the environment:

      ```bash
      rm -rf dist && npm run build
      grep -rE 'AIza[0-9A-Za-z_-]{35}' dist/ || echo "clean"
      ```

      CI runs this check too. Remember that `vite build` inlines the key when one *is* set — see
      [privacy.md](privacy.md). Never publish a build made with a personal key.
- [ ] No key appears in the diff since the last tag:
      `git diff <last-tag>..HEAD | grep -E 'AIza[0-9A-Za-z_-]{35}'`

## 3. Changelog

- [ ] Add a section for the new version to `CHANGELOG.md`, dated, using the existing
      Added / Changed / Fixed / Removed headings.
- [ ] Describe user-visible changes, not internal refactors.
- [ ] Call out anything that changes behavior for existing users.

## 4. Version and tag

- [ ] Set the version in `package.json` (`npm version <x.y.z> --no-git-tag-version`), and commit
      it together with the changelog entry.
- [ ] Tag the commit: `git tag -a v<x.y.z> -m "v<x.y.z>"`
- [ ] Push both: `git push origin main && git push origin v<x.y.z>`

Use semantic versioning. While the project is pre-1.0, breaking changes bump the minor version.

## 5. GitHub Release

- [ ] Create a Release from the tag.
- [ ] Paste the changelog section for this version as the body.
- [ ] Mark it as a pre-release while the version is below 1.0.

## 6. After release

- [ ] Confirm CI is green on the tagged commit.
- [ ] Close the milestone or issues the release resolves.
- [ ] Open follow-up issues for anything deferred during the checks above.
