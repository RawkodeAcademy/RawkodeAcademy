Feature: Scheduling shows and configuring scenes
  As a Producer
  I want to schedule a show and set up scenes
  So that I can go live with a professional run of show

  Scenario: Schedule a new show with presets
    Given I am signed in as Producer
    When I create a Show with title, time, and default scenes
    Then the Show appears on my schedule
    And scene presets (Holding, Monologue, Discourse, Outro) are stored

  Scenario: Configure dynamic grid for Discourse scene
    Given a scheduled Show
    And guests A, B, C are invited
    When I open the Discourse scene editor
    And I add guests A and B to the dynamic grid
    Then the scene preview shows A and B composed

  Scenario: Automatic scene switch on media end
    Given the Holding scene has a JIT video asset
    And the next scene is set to Monologue
    When the Holding video finishes
    Then the active scene changes to Monologue

