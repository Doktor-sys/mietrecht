# Task Management System FAQ

This document answers common questions about the new task management system.

## General Questions

### Why did we change the task management system?
We updated our task management system to improve:
- Visibility into task priorities and progress
- Accountability through clear ownership
- Planning accuracy with effort estimates
- Coordination through dependency tracking
- Quality assurance with acceptance criteria

### Where can I learn more about the new system?
- [TASK_MANAGEMENT_GUIDE.md](file:///f%3A%20-%202025%20-%2022.06-%20copy%20C%5C_AA_Postfach%2001.01.2025%5C03.07.2025%20Arbeit%2002.11.2025%5CJurisMind%20-%20Mietrecht%2001%5CTASK_MANAGEMENT_GUIDE.md) - Complete guide to the system
- [TASK_MANAGEMENT_QUICK_START.md](file:///f%3A%20-%202025%20-%2022.06-%20copy%20C%5C_AA_Postfach%2001.01.2025%5C03.07.2025%20Arbeit%2002.11.2025%5CJurisMind%20-%20Mietrecht%2001%5CTASK_MANAGEMENT_QUICK_START.md) - Quick reference guide
- [TASK_STRUCTURE_VISUAL_GUIDE.md](file:///f%3A%20-%202025%20-%2022.06-%20copy%20C%5C_AA_Postfach%2001.01.2025%5C03.07.2025%20Arbeit%2002.11.2025%5CJurisMind%20-%20Mietrecht%2001%5CTASK_STRUCTURE_VISUAL_GUIDE.md) - Visual explanation of task components

## Task Creation

### How do I create a new task?
1. Open [tasks.md](file:///f%3A%20-%202025%20-%2022.06-%20copy%20C%5C_AA_Postfach%2001.01.2025%5C03.07.2025%20Arbeit%2002.11.2025%5CJurisMind%20-%20Mietrecht%2001%5Ctasks.md)
2. Find the appropriate section (or create a new one)
3. Follow the format:
   ```
   - [ ] **Task Title** (Prio: Priority | Est: Estimate | Owner: Assignee | Depends on: Prerequisites):
       - Brief description
       - Acceptance Criteria (for complex tasks):
           - Measurable outcome 1
           - Measurable outcome 2
   ```
4. Add to the correct section (completed, in progress, or backlog)

### What makes a good task title?
Good task titles are:
- Specific and descriptive
- Action-oriented (start with a verb)
- Concise but clear
- Examples:
  - Good: "Implement user authentication with JWT"
  - Poor: "Auth stuff"

### How do I determine the priority level?
Use this guide:
- **Critical**: Blocks other work or is a security issue
- **High**: Important for current sprint or milestone
- **Medium**: Normal day-to-day work
- **Low**: Nice-to-have improvements

### How should I estimate effort?
Consider:
- Research and investigation time
- Implementation time
- Testing and debugging time
- Code review time
- Add a 20% buffer for unexpected issues

### When should I include acceptance criteria?
Include acceptance criteria for:
- Complex tasks with multiple outcomes
- Tasks with specific quality requirements
- Tasks that need verification
- Any task where it's not obvious when it's "done"

## Task Management

### How often should I update my task status?
- Update daily during standup
- Mark completed tasks immediately
- Update estimates if they change significantly
- Note blockers as soon as they appear

### What should I do if I'm blocked?
1. Add a comment to the task noting the blocker
2. Change status indicator to [!]
3. Inform your team lead during standup
4. Work on alternative tasks if possible

### How do I handle task dependencies?
1. Clearly identify what must be completed first
2. List dependencies in the "Depends on:" field
3. Coordinate with owners of prerequisite tasks
4. Update dependencies if they change

### What if I disagree with a task estimate?
1. Discuss with the task owner
2. Bring up during weekly grooming session
3. Provide rationale for your estimate
4. Update the task with the agreed estimate

## Process Questions

### When are the weekly grooming sessions?
Weekly grooming sessions are every Monday at 10:00 AM. Check the shared calendar for invites.

### What's the format for daily standups?
During standups, report:
1. What you accomplished yesterday
2. What you plan to work on today
3. Any blockers preventing progress

### How do I provide feedback on the system?
1. Submit feedback via the anonymous feedback form
2. Bring up suggestions during retrospectives
3. Talk to your team lead directly
4. Create a GitHub issue if you have specific suggestions

## Troubleshooting

### What if I don't understand a task description?
1. Ask the task owner for clarification
2. Add questions to the task description
3. Request a meeting if needed for complex tasks

### What if a task doesn't fit in any existing category?
1. Create a new category header
2. Or place it in the most appropriate existing category
3. Discuss categorization during grooming sessions

### What if I finish a task early?
1. Mark it as completed immediately
2. Update remaining estimates for dependent tasks
3. Start on the next highest priority task

### What if a task takes much longer than estimated?
1. Update the estimate in the task
2. Inform your team lead
3. Discuss during the next grooming session
4. Identify what caused the misestimate for future planning

## Advanced Topics

### How do we track team velocity?
We calculate velocity by:
- Summing completed task estimates each sprint
- Tracking this over time to predict capacity
- Adjusting sprint planning based on historical data

### How do we handle cross-team dependencies?
1. Clearly identify external dependencies
2. Assign points of contact for external teams
3. Schedule regular sync meetings
4. Escalate blockers through team leads

### How do we measure task quality?
Quality is measured by:
- Completion rate (tasks completed vs planned)
- Defect rate (bugs found after task completion)
- Customer satisfaction (for user-facing tasks)
- Peer review feedback

### How do we handle technical debt tasks?
Technical debt tasks should:
- Have clear business justification
- Be prioritized appropriately
- Include time estimates like any other task
- Be tracked separately for reporting if needed