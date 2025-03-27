{ pkgs, ... }:

{
  android = {
    enable = true;
    flutter.enable = true;
  };

	packages = with pkgs; [
		desktop-file-utils
		libsecret
		jsoncpp
	];

  enterShell = ''
    echo "Rawkode Academy Flutter App Development Environment"
    echo "Run 'flutter doctor' to verify your setup"
  '';
}
