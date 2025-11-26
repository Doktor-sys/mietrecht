# Task Structure Visual Guide

This guide visually explains the components of a task in our new task management system.

## Completed Task Example

```
[x] **Authentication Service** (Prio: Critical | Est: 4 days | Owner: Max | Depends on: Projekt-Setup):
    - JWT-based authentication with password hashing
    - Role-based access control implementation
```

### Components Breakdown:

1. **Status Indicator**: `[x]` = Completed
2. **Task Title**: `**Authentication Service**` (Bold text)
3. **Priority**: `Prio: Critical` (Critical, High, Medium, Low)
4. **Estimate**: `Est: 4 days` (Effort in person-days)
5. **Owner**: `Owner: Max` (Person responsible)
6. **Dependencies**: `Depends on: Projekt-Setup` (Prerequisites)
7. **Description**: `- JWT-based authentication with password hashing` (Task details)

## In Progress Task Example

```
[~] **Database Design** (Prio: High | Est: 3 days | Owner: Sarah | Depends on: Requirements):
    - Create Prisma schema for Users table
    - Define relationships between Cases and Documents
```

### Components Breakdown:

1. **Status Indicator**: `[~]` = In Progress
2. **Task Title**: `**Database Design**` (Bold text)
3. **Priority**: `Prio: High` (High priority task)
4. **Estimate**: `Est: 3 days` (Estimated effort)
5. **Owner**: `Owner: Sarah` (Assigned person)
6. **Dependencies**: `Depends on: Requirements` (What must be completed first)
7. **Description**: `- Create Prisma schema for Users table` (Specific work items)

## Planned Task Example

```
[ ] **API Documentation** (Prio: Medium | Est: 2 days | Owner: Max | Depends on: Core Services):
    - Generate Swagger/OpenAPI documentation
    - Validate schemas against code
    - Acceptance Criteria:
        - Swagger UI accessible at /api/docs
        - All endpoints documented with examples
```

### Components Breakdown:

1. **Status Indicator**: `[ ]` = Planned/Not Started
2. **Task Title**: `**API Documentation**` (Bold text)
3. **Priority**: `Prio: Medium` (Medium priority)
4. **Estimate**: `Est: 2 days` (Time estimate)
5. **Owner**: `Owner: Max` (Responsible person)
6. **Dependencies**: `Depends on: Core Services` (Prerequisites)
7. **Description**: `- Generate Swagger/OpenAPI documentation` (Work description)
8. **Acceptance Criteria**: `Acceptance Criteria:` (Success conditions)

## Blocked Task Example

```
[!] **Performance Optimization** (Prio: High | Est: 4 days | Owner: Team | Depends on: Load Testing Framework):
    - Optimize database queries for high-traffic scenarios
    - Implement caching strategies
```

### Components Breakdown:

1. **Status Indicator**: `[!]` = Blocked/Paused
2. **Task Title**: `**Performance Optimization**` (Bold text)
3. **Priority**: `Prio: High` (High importance)
4. **Estimate**: `Est: 4 days` (Effort estimate)
5. **Owner**: `Owner: Team` (Collective responsibility)
6. **Dependencies**: `Depends on: Load Testing Framework` (Blocking tasks)
7. **Description**: `- Optimize database queries for high-traffic scenarios` (Task details)

## Status Indicators Quick Reference

| Symbol | Status          | Meaning                          |
|--------|-----------------|----------------------------------|
| [x]    | Completed       | Task is finished                 |
| [~]    | In Progress     | Work is actively happening       |
| [ ]    | Planned         | Task is scheduled for future     |
| [!]    | Blocked         | Cannot progress due to obstacles |
| [?]    | Needs Clarification | Requires more information    |

## Priority Levels Quick Reference

| Level    | When to Use                              | Examples                                  |
|----------|------------------------------------------|-------------------------------------------|
| Critical | Must be done immediately; blocks other work | Security fixes, core functionality        |
| High     | Important for current goals               | Feature development, bug fixes            |
| Medium   | Part of regular workflow                  | Technical debt, documentation             |
| Low      | Nice to have; can be deferred             | UI improvements, minor enhancements       |

## Common Task Categories

1. **Feature Development**
   - New functionality implementation
   - User story completion

2. **Bug Fixes**
   - Issue resolution
   - Error correction

3. **Technical Debt**
   - Refactoring
   - Code quality improvements

4. **Documentation**
   - User guides
   - API documentation

5. **Testing**
   - Unit tests
   - Integration tests

6. **Infrastructure**
   - Deployment
   - Environment setup

## Best Practices

1. **Writing Good Task Titles**
   - Use action verbs: "Implement", "Create", "Fix"
   - Be specific: "Implement user authentication" vs "Authentication"
   - Keep concise but descriptive

2. **Setting Accurate Estimates**
   - Consider research time
   - Account for testing and review
   - Add buffer for unexpected issues

3. **Assigning Owners**
   - Match skills to task requirements
   - Consider workload balance
   - Use "Team" for collective responsibility

4. **Defining Dependencies**
   - Identify true prerequisites
   - Avoid creating artificial dependencies
   - Update when dependencies change

5. **Writing Acceptance Criteria**
   - Make criteria measurable
   - Focus on outcomes, not implementation
   - Include edge cases when relevant