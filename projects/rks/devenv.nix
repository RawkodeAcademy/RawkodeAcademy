{ pkgs, ... }:
{
  name = "rks";

  dotenv.disableHint = true;

  languages.nix.enable = true;
  languages.javascript.enable = true;
  languages.typescript.enable = true;

  packages = with pkgs; [
    bun
    patchelf
    glibc
    nixfmt-rfc-style
  ];

  enterShell = ''
    # Ensure wrangler/workerd runs on Nix by patching the dynamic loader
    __patchTarget="./node_modules/@cloudflare/workerd-linux-64/bin/workerd"
    if [[ -f "$__patchTarget" ]]; then
      ${pkgs.patchelf}/bin/patchelf --set-interpreter ${pkgs.glibc}/lib/ld-linux-x86-64.so.2 "$__patchTarget" || true
    fi
  '';
}

