{ pkgs, ... }:

let
  playwright-driver = pkgs.playwright-driver;
  playwright-driver-browsers = pkgs.playwright-driver.browsers;

  playright-file = builtins.readFile "${playwright-driver}/package/browsers.json";
  playright-json = builtins.fromJSON playright-file;
  playwright-chromium-entry = builtins.elemAt (builtins.filter (
    browser: browser.name == "chromium"
  ) playright-json.browsers) 0;
  playwright-chromium-revision = playwright-chromium-entry.revision;
in
{
  name = "web.rawkode.academy";

  languages.nix.enable = true;

  languages.javascript = {
    enable = true;
  };
  languages.typescript.enable = true;

  packages = with pkgs; [
    bun
		d2
    nixfmt-rfc-style
  ];

  enterShell = ''
    bun install

    __patchTarget="./node_modules/@cloudflare/workerd-linux-64/bin/workerd"
    if [[ -f "$__patchTarget" ]]; then
      ${pkgs.patchelf}/bin/patchelf --set-interpreter ${pkgs.glibc}/lib/ld-linux-x86-64.so.2 "$__patchTarget"
    fi
  '';
}
