{ pkgs, ... }:
{
  languages.nix.enable = true;

  packages = with pkgs; [
    bun
    just
    nixpkgs-fmt
    sqld
    turso-cli
  ];

  processes = {
    turso.exec = "turso dev";
    grafbase.exec = "just dev";
  };

  enterShell = ''
    bun install
    turso config set autoupdate off
    __patchTarget="./node_modules/@grafbase/grafbase/bin/grafbase"
    if [[ -f "$__patchTarget" ]]; then
      ${pkgs.patchelf}/bin/patchelf --set-interpreter ${pkgs.glibc}/lib/ld-linux-x86-64.so.2 "$__patchTarget"
    fi
  '';
}
