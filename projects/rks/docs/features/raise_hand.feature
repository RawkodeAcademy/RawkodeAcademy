Feature: Raise hand promotion
  As a Producer
  I want to promote an authenticated viewer to the stage
  So that they can participate as a guest

  Scenario: Authenticated viewer requests promotion
    Given a viewer is authenticated
    When they raise their hand
    Then the DO records the request and notifies the Producer
    When I approve the request
    Then the viewer is promoted to Guest
    And they join the green room within 5 seconds

