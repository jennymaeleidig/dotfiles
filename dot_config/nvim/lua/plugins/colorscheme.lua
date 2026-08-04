return {
  {
    "loctvl842/monokai-pro.nvim",
    cond = not vim.g.vscode,
    priority = 1000,
    config = function()
      require("monokai-pro").setup({
        transparent_background = false,
        terminal_colors = true,
        devicons = true,
        styles = {
          comment = { italic = true },
          keyword = { italic = true },
          type = { italic = true },
          storageclass = { italic = true },
          structure = { italic = true },
          parameter = { italic = true },
          annotation = { italic = true },
          tag_attribute = { italic = true },
        },
        filter = "pro",
      })
      vim.cmd.colorscheme("monokai-pro")
    end,
  },
}
