Feature: Whiteboard plugin
  As a Producer
  I want to enable a collaborative whiteboard
  So that viewers can see sketches and annotations in real time

  Scenario: Enable whiteboard and include in program
    Given the RTK whiteboard plugin is enabled
    When participants draw on the whiteboard
    Then the whiteboard state is broadcast over DataChannel
    And the whiteboard layer renders in the program output

