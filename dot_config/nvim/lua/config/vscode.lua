-- Inside VS Code's embedded Neovim. `~/.config/nvim/init.lua` routes here when
-- `vim.g.vscode` is set; `config.lazy` never loads, so this file is the whole
-- setup: leader first (`keymap.set` resolves `<leader>` at definition time),
-- then the patch applier.
--
-- USAGE
--   1. Optional but recommended: open the file the patch targets.
--   2. `<space>ap` (= `:DiffApply`). A notification names the repo the patch
--      landed in and shows `git apply -v` output.
--   3. Deploy if the patch hit a chezmoi source file: `chezmoi apply <target>`.
--
-- The patch must be a unified diff with `a/`/`b/`-prefixed, repo-relative paths.
-- A surrounding ```diff fence is stripped, as is CRLF. `-p1` is tried first and
-- `-p0` second, so plain repo-relative paths (no `a/`/`b/`) work too.
--
-- The repo is NOT pinned: every plausible repo is probed with `git apply
-- --check` and the first one the patch applies to is used. So the same mapping
-- serves any repository — chezmoi, or whatever project the patch belongs to.
--
-- Editing this file does nothing until `Neovim: Restart Extension` (or a window
-- reload) — Neovim reads it once at startup, and the keymap with it.
local vscode = require("vscode")

vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

local HOME = vim.fn.expand("~")

-- `+` is synced with the VS Code clipboard; `pbpaste` covers the cases where it
-- comes back empty. Fences and CRLF are stripped here so the patch is taken
-- verbatim otherwise.
local function from_clipboard()
  local text = vim.fn.getreg("+")
  if text == nil or text == "" then
    text = vim.fn.system({ "pbpaste" })
  end
  text = text:gsub("\r\n", "\n")
  text = text:gsub("^%s*```[%w_+%-]*\n", "")
  text = text:gsub("\n```%s*$", "")
  return text
end

-- Target paths, from `--- a/x` / `+++ b/x` header pairs. A removed line that
-- happens to start with `--` renders as `--- ...`, so only a `+++` line
-- immediately following a `---` line counts.
local function patch_targets(lines)
  local paths, seen = {}, {}
  local previous_was_old = false
  for _, line in ipairs(lines) do
    local head = line:sub(1, 4)
    if head == "--- " then
      previous_was_old = true
    elseif head == "+++ " then
      if previous_was_old then
        local raw = vim.trim((line:sub(5):gsub("\t.*$", "")))
        if raw ~= "" and raw ~= "/dev/null" then
          local path = raw:gsub("^[ab]/", "")
          if not seen[path] then
            seen[path] = true
            table.insert(paths, path)
          end
        end
      end
      previous_was_old = false
    else
      previous_was_old = false
    end
  end
  return paths
end

local function git_toplevel(dir)
  if dir == nil or dir == "" then
    return nil
  end
  -- Via `sh` so a non-repo directory stays quiet instead of spraying stderr.
  local cmd = "git -C " .. vim.fn.shellescape(dir) .. " rev-parse --show-toplevel 2>/dev/null"
  local out = vim.fn.systemlist({ "sh", "-c", cmd })
  local top = out[1]
  if vim.v.shell_error ~= 0 or top == nil or top == "" then
    return nil
  end
  return vim.fn.fnamemodify(top, ":p")
end

local function ancestors(dir)
  local acc = {}
  dir = vim.fn.fnamemodify(dir, ":p")
  while dir ~= "" and dir ~= "/" do
    table.insert(acc, dir)
    local parent = vim.fn.fnamemodify(dir, ":h")
    if parent == dir then
      break
    end
    dir = parent
  end
  return acc
end

-- Candidate repos, best guess first: the active file's repo, then ancestry of
-- the active file / cwd that actually contains a target path, then cwd, then
-- `$PATCH_REPO`, then the chezmoi source tree.
local function candidate_repos(targets)
  local repos, seen = {}, {}

  local function add(dir)
    local top = git_toplevel(dir)
    if top ~= nil and not seen[top] then
      seen[top] = true
      table.insert(repos, top)
    end
  end

  local active = vim.fn.expand("%:p:h")
  local cwd = vim.fn.getcwd()

  add(active)
  for _, root in ipairs({ active, cwd }) do
    for _, ancestor in ipairs(ancestors(root)) do
      for _, target in ipairs(targets) do
        if vim.fn.filereadable(ancestor .. "/" .. target) == 1 then
          add(ancestor)
        end
      end
    end
  end
  add(cwd)
  add(vim.env.PATCH_REPO)
  add(HOME .. "/.local/share/chezmoi")

  return repos
end

-- First repo / strip-level where `git apply --check` passes wins. `--recount`
-- rescues a wrong `@@` line count; it does NOT rescue wrong content.
local function apply_patch(patch_file, targets, repos)
  local first_failure = nil

  for _, repo in ipairs(repos) do
    for _, strip in ipairs({ "1", "0" }) do
      local flag = "-p" .. strip
      vim.fn.system({ "git", "-C", repo, "apply", "--recount", "--check", flag, patch_file })
      local check_ok = vim.v.shell_error == 0
      local check_out = vim.fn.system({ "git", "-C", repo, "apply", "--recount", "--check", "-v", flag, patch_file })
      if check_ok then
        local out = vim.fn.system({ "git", "-C", repo, "apply", "--recount", "-v", flag, patch_file })
        return repo, out, vim.v.shell_error == 0, nil
      end
      if first_failure == nil then
        first_failure = { repo = repo, strip = strip, out = check_out }
      end
    end
  end

  return nil, nil, false, first_failure
end

vim.api.nvim_create_user_command("DiffApply", function()
  local text = from_clipboard()
  local lines = vim.split(text, "\n")

  if #patch_targets(lines) == 0 then
    vscode.notify("Clipboard holds no unified diff (no `+++ ` header). Check `:echo len(@+)`.")
    return
  end

  local targets = patch_targets(lines)
  local repos = candidate_repos(targets)
  if #repos == 0 then
    vscode.notify("No git repository found for this patch. Open the target file, or set $PATCH_REPO.")
    return
  end

  local tmp = vim.fn.tempname() .. ".diff"
  vim.fn.writefile(lines, tmp)
  local repo, out, ok, failure = apply_patch(tmp, targets, repos)
  vim.fn.delete(tmp)

  if not ok then
    local why = (failure and failure.out) or ""
    vscode.notify(
      "git apply failed in every candidate repo: "
        .. table.concat(repos, ", ")
        .. "\nfirst attempt: "
        .. (failure and failure.repo or "?")
        .. " -p"
        .. (failure and failure.strip or "?")
        .. "\n"
        .. why
    )
    return
  end

  vscode.notify("patch applied in " .. repo .. ":\n" .. out)

  -- Reload every buffer whose file changed on disk (no-op on modified buffers),
  -- then revert the active editor. A stale buffer plus `files.autoSave:
  -- afterDelay` can otherwise write the old text straight back over the patch.
  vim.cmd("silent! checktime")
  vscode.call("workbench.action.files.revert")
end, { desc = "Apply unified diff from clipboard" })

-- The extension installs its own default mappings during startup, so register
-- once now and once after startup, when those defaults exist.
local function map_apply()
  vim.keymap.set("n", "<leader>ap", "<cmd>DiffApply<cr>", { desc = "Apply clipboard diff", silent = true })
end

map_apply()
vim.schedule(map_apply)