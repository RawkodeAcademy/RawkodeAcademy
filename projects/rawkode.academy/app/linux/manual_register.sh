#!/usr/bin/env bash

# Get the absolute path to the application
APP_PATH=$(readlink -f "$(dirname "$0")/../build/linux/x64/debug/bundle/rawkode_academy")

# Create a temporary desktop file
DESKTOP_FILE=~/.local/share/applications/app.rawkode.academy.desktop
mkdir -p ~/.local/share/applications

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Type=Application
Name=Rawkode Academy
Exec=$APP_PATH --url %u
Icon=app.rawkode.academy
Terminal=false
Categories=Education;Development;
MimeType=x-scheme-handler/app.rawkode.academy;
StartupWMClass=rawkode_academy
StartupNotify=true
SingleMainWindow=true
EOF

# Register the URL handler
xdg-mime default app.rawkode.academy.desktop x-scheme-handler/app.rawkode.academy

# Update the desktop database if the command exists
if command -v update-desktop-database &> /dev/null; then
  update-desktop-database ~/.local/share/applications
fi

echo "URL handler registered. You can now use app.rawkode.academy:// URLs."
