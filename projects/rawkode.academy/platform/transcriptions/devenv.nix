{ pkgs, lib, config, inputs, ... }:

{
	packages = with pkgs; [
		biome
	];

  languages.javascript = {
		enable = true;
		npm.enable = true;
	};
	languages.typescript.enable = true;
}
