Feature: Comments and polls
  As a Producer
  I want to feature comments and run polls
  So that I can drive audience participation

  Scenario: Authenticated comments only
    Given an authenticated user submits a comment over WebSocket
    Then the DO validates permissions
    And the comment appears in my moderation queue
    When I pin the comment
    Then it renders as an overlay on the program

  Scenario: Anonymous poll voting
    Given a poll is opened
    When a viewer without authentication votes
    Then the vote is counted once per browser session
    And aggregate results broadcast to clients within 500 ms

