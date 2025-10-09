Feature: Authentication and roles
  As a Producer or Guest
  I want to sign in with atproto OAuth
  So that I can access producer tools or join the show

  Background:
    Given the system is configured with atproto OAuth (Better Auth)

  Scenario: Producer signs in
    When I authenticate as a Producer
    Then I see the Producer dashboard
    And my role is Producer

  Scenario: Guest signs in
    When I authenticate as a Guest
    Then I reach the green room
    And I can run device checks for mic/camera/screenshare

  Scenario: Public viewer has no sign-in requirement
    When I open a public live show link
    Then I can watch without authentication

