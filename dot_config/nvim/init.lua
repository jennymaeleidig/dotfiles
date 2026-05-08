vim.cmd([[
	call plug#begin()

	Plug 'loctvl842/monokai-pro.nvim'

	call plug#end()

	colorscheme monokai-pro
]])

require("config.lazy")
