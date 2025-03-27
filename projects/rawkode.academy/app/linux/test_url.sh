#!/usr/bin/env bash

# Test URL with our custom scheme
xdg-open "app.rawkode.academy://callback?code=test_code&state=test_state"

echo "Launched URL with app.rawkode.academy:// scheme"
