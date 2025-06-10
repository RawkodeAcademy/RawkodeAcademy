# Casting Credits Service Tests

This directory contains tests for the Casting Credits service.

## Test Structure

The tests are organized into the following categories:

1. **Schema Tests** (`schema.test.ts`): Tests for the GraphQL schema structure.
2. **Resolver Tests** (`resolvers.test.ts`): Tests for the GraphQL resolvers.
3. **Integration Tests** (`integration.test.ts`): Basic tests for the GraphQL server setup.
4. **Database Schema Tests** (`client.test.ts`): Tests for the database schema definition.

## Running Tests

To run the tests, use the following commands:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

## Current Test Coverage

The current tests focus on verifying the structure and basic functionality of the service:

1. **Schema Tests**: Verify that the GraphQL schema has the expected types and fields.
2. **Resolver Tests**: Verify that the resolvers return the expected data.
3. **Integration Tests**: Verify that the GraphQL server can be created successfully.
4. **Database Schema Tests**: Verify that the database schema is defined correctly.

## Future Test Improvements

The following improvements could be made to the test suite:

1. **Data Model Tests**: Add tests for CRUD operations on the database using an in-memory SQLite database.
2. **Integration Tests**: Add more comprehensive tests for the GraphQL API, including query execution.
3. **End-to-End Tests**: Add tests that simulate real-world usage of the service.
4. **Mock Database**: Implement proper database mocking to test database interactions without requiring a real database.

## Adding New Tests

When adding new functionality to the service, please add corresponding tests to maintain test coverage. Follow the existing patterns for consistency.