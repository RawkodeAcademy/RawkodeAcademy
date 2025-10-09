Feature: Viewer playback and quality selection
  As a Viewer
  I want minimal latency and control over quality
  So that I can watch reliably across devices

  Background:
    Given a show is live with simulcast 1080/720/360

  Scenario: Auto quality
    When I open the show on a stable connection
    Then playback starts within 2 seconds
    And glass-to-glass latency is under 2 seconds (p50)

  Scenario: Manual quality selection
    When I select 720p
    Then the player switches to the h layer within 2 seconds without disconnecting

  Scenario: Mobile viewers supported
    When I open the show on iOS Safari
    Then playback works with the same Auto/Manual quality options

