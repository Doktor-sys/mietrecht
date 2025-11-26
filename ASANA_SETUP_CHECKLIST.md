# Asana Setup Checklist

This checklist tracks the progress of setting up our Asana organization.

## Phase 1: Account Creation

### Create Organization Account
- [ ] Navigate to https://app.asana.com
- [ ] Click "Try for free" or "Get Started"
- [ ] Select "Help my team stay organized" option
- [ ] Enter work email address
- [ ] Create strong password
- [ ] Click "Continue"
- [ ] Enter organization name: "SmartLaw Mietrecht"
- [ ] Select role: "Project Manager" or "Admin"
- [ ] Enter company size and department
- [ ] Click "Continue"
- [ ] Verify email address (check inbox for verification email)
- [ ] Click verification link
- [ ] Return to Asana

### Configure Organization Settings
- [ ] Click profile icon > "Organization Settings"
- [ ] Set Time Zone to "Berlin"
- [ ] Set Language to "English"
- [ ] Set Default Project Privacy to "Private to team members"
- [ ] Set Task Default Due Time to "17:00"
- [ ] Click "Save Changes"

### Configure Security Settings
- [ ] In Organization Settings, click "Security & Privacy"
- [ ] Enable two-factor authentication
- [ ] Set password requirements (minimum 8 characters with numbers/special chars)
- [ ] Configure session timeout: 8 hours
- [ ] Enable single sign-on (if available)

### Set Up Billing
- [ ] In Organization Settings, click "Billing"
- [ ] Start with free plan (no credit card required)
- [ ] Set up billing notifications to project manager email

## Phase 2: User Management

### Create Initial Admin Users
- [ ] Click "Add Members" in main navigation
- [ ] Enter email addresses of key administrators:
  - [ ] Project Manager
  - [ ] Team Leads
  - [ ] IT Support Contact
- [ ] Assign roles:
  - [ ] Project Manager: "Admin"
  - [ ] Team Leads: "Member"
  - [ ] IT Support: "Guest"
- [ ] Click "Send Invitations"

### Configure User Permissions
- [ ] Go to "Admin Console" > "Users"
- [ ] For each admin user:
  - [ ] Confirm role is set correctly
  - [ ] Enable "Can manage organization settings"
  - [ ] Enable "Can manage billing"
  - [ ] Enable "Can manage apps" (for integrations)

## Phase 3: Project Structure

### Create Main Projects
- [ ] Click "+" in sidebar > "Project"
- [ ] Create "SmartLaw Mietrecht - Backend"
  - [ ] Description: "Backend development for SmartLaw Mietrecht application"
  - [ ] Privacy: Private to team members
  - [ ] Team: Backend Development
- [ ] Create "SmartLaw Mietrecht - Web App"
  - [ ] Description: "Web application development for SmartLaw Mietrecht"
  - [ ] Privacy: Private to team members
  - [ ] Team: Frontend Development
- [ ] Create "SmartLaw Mietrecht - Mobile App"
  - [ ] Description: "Mobile application development for SmartLaw Mietrecht"
  - [ ] Privacy: Private to team members
  - [ ] Team: Mobile Development
- [ ] Create "SmartLaw Mietrecht - Infrastructure"
  - [ ] Description: "Infrastructure and DevOps for SmartLaw Mietrecht"
  - [ ] Privacy: Private to team members
  - [ ] Team: DevOps/Infrastructure

### Create Portfolios
- [ ] Click "+" in sidebar > "Portfolio"
- [ ] Create "Q3 2025 Release"
  - [ ] Description: "Tasks for Q3 2025 product release"
- [ ] Create "Technical Debt Reduction"
  - [ ] Description: "Initiatives to reduce technical debt"
- [ ] Create "Performance Optimization"
  - [ ] Description: "Projects focused on performance improvements"
- [ ] Create "Security Enhancements"
  - [ ] Description: "Security-focused initiatives and improvements"

## Phase 4: Custom Fields

### Create Priority Field
- [ ] Go to "Custom Fields" in Admin Console
- [ ] Click "Create Custom Field"
- [ ] Name: "Priority"
- [ ] Type: Dropdown
- [ ] Options: Critical, High, Medium, Low
- [ ] Set as default field for all projects

### Create Estimate Field
- [ ] In Custom Fields, click "Create Custom Field"
- [ ] Name: "Estimate"
- [ ] Type: Number
- [ ] Unit: "days"
- [ ] Set as default field for all projects

### Create Business Value Field
- [ ] In Custom Fields, click "Create Custom Field"
- [ ] Name: "Business Value"
- [ ] Type: Dropdown
- [ ] Options: High, Medium, Low
- [ ] Set as default field for all projects

### Create Customer Impact Field
- [ ] In Custom Fields, click "Create Custom Field"
- [ ] Name: "Customer Impact"
- [ ] Type: Dropdown
- [ ] Options: High, Medium, Low
- [ ] Set as default field for all projects

### Create Technical Complexity Field
- [ ] In Custom Fields, click "Create Custom Field"
- [ ] Name: "Technical Complexity"
- [ ] Type: Dropdown
- [ ] Options: High, Medium, Low
- [ ] Set as default field for all projects

### Create Risk Level Field
- [ ] In Custom Fields, click "Create Custom Field"
- [ ] Name: "Risk Level"
- [ ] Type: Dropdown
- [ ] Options: High, Medium, Low
- [ ] Set as default field for all projects

## Phase 5: Workflow Configuration

### Configure Task Statuses
- [ ] Go to "Custom Fields" in Admin Console
- [ ] Click "Create Custom Field"
- [ ] Name: "Status"
- [ ] Type: Dropdown
- [ ] Options: Planned, In Progress, In Review, Blocked, Completed, Cancelled
- [ ] Set as default field for all projects

### Create Status Automation Rules
- [ ] In each project, go to "Project Settings" > "Automations"
- [ ] Create rule: When task is marked complete, notify assignee
- [ ] Create rule: When task is blocked, notify project manager
- [ ] Create rule: When task is overdue, send reminder

## Phase 6: Notification Settings

### Set Organization-Wide Notifications
- [ ] Go to "Admin Console" > "Notifications"
- [ ] Configure:
  - [ ] Email notifications: Enabled
  - [ ] Mobile notifications: Enabled
  - [ ] Digest emails: Daily at 8:00 AM
  - [ ] Reminder emails: 1 day before due date

### Configure Personal Notification Preferences
- [ ] Each user should review personal notification settings
- [ ] Access via profile icon > "My Profile Settings" > "Notifications"
- [ ] Recommended settings:
  - [ ] Notify when assigned a task: Immediately
  - [ ] Notify when mentioned: Immediately
  - [ ] Due date reminders: 1 day before
  - [ ] Weekly digest: Enabled

## Phase 7: Project Templates

### Create Feature Development Template
- [ ] In any project, click "Add Task"
- [ ] Name: "Feature Development Template"
- [ ] Add checklist:
  - [ ] Requirements gathering
  - [ ] Design review
  - [ ] Implementation
  - [ ] Testing
  - [ ] Documentation
  - [ ] Deployment
- [ ] Save as template

### Create Bug Fix Template
- [ ] In any project, click "Add Task"
- [ ] Name: "Bug Fix Template"
- [ ] Add checklist:
  - [ ] Reproduce issue
  - [ ] Identify root cause
  - [ ] Implement fix
  - [ ] Test fix
  - [ ] Code review
  - [ ] Deploy fix
- [ ] Save as template

### Create Technical Debt Template
- [ ] In any project, click "Add Task"
- [ ] Name: "Technical Debt Template"
- [ ] Add checklist:
  - [ ] Problem identification
  - [ ] Impact assessment
  - [ ] Solution design
  - [ ] Implementation
  - [ ] Testing
  - [ ] Review and documentation
- [ ] Save as template

## Verification

Before proceeding to team invitations:

### Account Setup
- [ ] Organization account created
- [ ] Organization settings configured
- [ ] Security settings enabled
- [ ] Billing information set up

### User Management
- [ ] Admin users added and configured
- [ ] User permissions verified

### Projects and Portfolios
- [ ] All main projects created
- [ ] All portfolios created
- [ ] Project descriptions added

### Custom Fields
- [ ] Priority field created and configured
- [ ] Estimate field created and configured
- [ ] Business Value field created and configured
- [ ] Customer Impact field created and configured
- [ ] Technical Complexity field created and configured
- [ ] Risk Level field created and configured
- [ ] Status field created and configured

### Workflow
- [ ] Workflow stages defined
- [ ] Status automation rules created
- [ ] Notification settings configured
- [ ] Project templates created

## Next Steps

Once setup is complete:

1. [ ] Send team invitations
2. [ ] Schedule introduction meeting
3. [ ] Prepare training materials
4. [ ] Create pilot tasks
5. [ ] Test integrations