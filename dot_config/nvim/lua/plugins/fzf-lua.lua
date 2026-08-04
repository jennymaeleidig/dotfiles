return {
  {
    "ibhagwan/fzf-lua",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    cond = not vim.g.vscode,
    opts = {},
    keys = {
      { "<leader><space>", function() require("fzf-lua").files() end, desc = "Find Files" },
      { "<leader>sg",      function() require("fzf-lua").grep_project() end, desc = "Search (grep)" },
      { "<leader>fb",      function() require("fzf-lua").buffers() end, desc = "Buffers" },
      { "<leader>fh",      function() require("fzf-lua").help_tags() end, desc = "Help Tags" },
    },
  },
}
