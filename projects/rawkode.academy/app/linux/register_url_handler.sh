#!/usr/bin/env bash

# Register the URL handler
xdg-mime default app.rawkode.academy.desktop x-scheme-handler/app.rawkode.academy

# Update the desktop database if the command exists
if command -v update-desktop-database &> /dev/null; then
  update-desktop-database ~/.local/share/applications
fi
