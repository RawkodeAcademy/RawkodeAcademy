Feature: Resilience and reconnect
  As a User
  I want automatic recovery from network issues
  So that the show continues with minimal disruption

  Scenario: Viewer reconnect
    Given a viewer loses connectivity briefly
    When the connection is restored
    Then the client re-subscribes and fetches a state snapshot
    And playback resumes at the previous or best-available quality

  Scenario: Producer reconnect
    Given the producer's connection drops
    When they return within 30 seconds
    Then the session renegotiates without restarting the show

  Scenario: Container recorder restart
    Given the container recorder is restarted by the platform
    Then it rejoins RTK and resumes segment recording without data loss

