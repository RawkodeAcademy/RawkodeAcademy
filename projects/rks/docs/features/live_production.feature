Feature: Live production with dynamic grid and transitions
  As a Producer
  I want to compose the program in my browser
  So that I can switch scenes and manage guests during the show

  Background:
    Given a live Show is started
    And the program is published with simulcast 1080/720/360

  Scenario: Add/remove guests from dynamic grid
    When I add guest A to the grid
    Then guest A appears in the program within 200 ms
    When I remove guest A from the grid
    Then guest A disappears from the program within 200 ms

  Scenario: Transition between scenes
    Given Monologue is active
    When I switch to Discourse with transition "crossfade"
    Then the transition renders at 30 fps without dropped frames

  Scenario: Whiteboard visible in program when active
    Given the RTK whiteboard plugin is active
    Then the whiteboard layer is visible in the program output

