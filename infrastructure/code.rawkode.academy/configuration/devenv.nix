{ pkgs, ... }:
{
  dotenv.enable = true;

  languages.javascript = {
    enable = true;
    bun.enable = true;
  };

  languages.terraform.enable = true;

  packages = with pkgs; [
    biome
  ];
}
