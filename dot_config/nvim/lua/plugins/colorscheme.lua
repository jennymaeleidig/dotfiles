return {
  {
    "loctvl842/monokai-pro.nvim",
    lazy = vim.g.vscode,
    priority = 1000,
    config = function()
      vim.cmd([[colorscheme monokai-pro]])
    end,
  },
}
