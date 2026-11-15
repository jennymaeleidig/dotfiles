-- Leader first: `keymap.set` resolves `<leader>` when it runs, and the vscode
-- branch below never loads `config.lazy`. Both hosts share this one leader;
-- nothing else sets it.
vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

if vim.g.vscode then
  return
end

require("config.lazy")