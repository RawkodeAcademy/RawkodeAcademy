Feature: Local ISO and cloud program recordings
  As a Producer
  I want reliable local ISO and cloud backups
  So that I can edit and repurpose content after the show

  Background:
    Given a show is live

  Scenario: Local ISO progressive upload
    Given guest A is connected
    Then guest A's camera, mic, and screenshare are recorded locally
    And chunks upload progressively to R2 with integrity hashes

  Scenario: Resume upload after browser close
    Given a guest closes the browser mid-upload
    When they re-open within 7 days and sign in
    Then the upload resumes from the last complete chunk

  Scenario: Cloud program backup
    When the show starts
    Then the container recorder subscribes to the program track
    And MP4 segments are written to R2 during the show
    When the show ends
    Then a finalized MP4 appears in R2 within 5 minutes

