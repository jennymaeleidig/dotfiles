if vim.g.vscode then
  require("config.vscode")
  return
end

require("config.lazy")