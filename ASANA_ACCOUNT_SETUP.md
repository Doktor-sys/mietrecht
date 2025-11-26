# Asana Account Setup Instructions

This document provides step-by-step instructions for setting up our Asana organization account.

## Prerequisites

Before beginning the setup process, ensure you have:
- Access to a web browser (Chrome, Firefox, Safari, or Edge recommended)
- Administrative privileges for creating accounts
- List of all team members' email addresses
- Project Manager access credentials

## Step 1: Create Organization Account

### 1.1 Navigate to Asana
1. Open your web browser
2. Go to https://app.asana.com
3. Click "Try for free" or "Get Started"

### 1.2 Start Organization Setup
1. Select "Help my team stay organized" option
2. Enter your work email address
3. Create a strong password
4. Click "Continue"

### 1.3 Configure Organization Details
1. Enter organization name: "SmartLaw Mietrecht"
2. Select your role: "Project Manager" or "Admin"
3. Enter company size: "2-10" (adjust as needed)
4. Select department: "Engineering" or "Product"
5. Click "Continue"

### 1.4 Verify Email Address
1. Check your email for verification message from Asana
2. Click the verification link
3. Return to Asana if not automatically redirected

## Step 2: Set Up Basic Organization Settings

### 2.1 Configure Organization Preferences
1. Click on your profile icon in the top right
2. Select "Organization Settings"
3. Review and adjust the following settings:
   - **Organization Name**: Confirm "SmartLaw Mietrecht"
   - **Time Zone**: Set to "Berlin" (or appropriate time zone)
   - **Language**: Set to "English" or "German" as preferred
   - **Default Project Privacy**: Set to "Private to team members"
   - **Task Default Due Time**: Set to "17:00" (or preferred end-of-day time)

### 2.2 Configure Security Settings
1. In Organization Settings, click "Security & Privacy"
2. Enable two-factor authentication (recommended)
3. Set password requirements:
   - Minimum length: 8 characters
   - Require numbers and special characters
4. Configure session timeout: 8 hours
5. Enable single sign-on (SSO) if available

### 2.3 Set Up Billing
1. In Organization Settings, click "Billing"
2. Start with free plan (no credit card required)
3. Note: Upgrade to premium when team exceeds 15 members or advanced features are needed
4. Set up billing notifications to project manager email

## Step 3: Create Initial Admin Users

### 3.1 Add Administrative Team Members
1. Click "Add Members" in the main navigation
2. Enter email addresses of key administrators:
   - Project Manager
   - Team Leads
   - IT Support Contact
3. Assign roles:
   - Project Manager: "Admin"
   - Team Leads: "Member" (can be upgraded later)
   - IT Support: "Guest" (can be upgraded later)
4. Click "Send Invitations"

### 3.2 Configure User Permissions
1. Go to "Admin Console" > "Users"
2. For each admin user:
   - Confirm role is set correctly
   - Enable "Can manage organization settings"
   - Enable "Can manage billing"
   - Enable "Can manage apps" (for integrations)

## Step 4: Set Up Initial Projects

### 4.1 Create Main Projects
1. Click "+" in the sidebar
2. Select "Project"
3. Create each of the following projects:
   - **SmartLaw Mietrecht - Backend**
     - Description: "Backend development for SmartLaw Mietrecht application"
     - Privacy: Private to team members
     - Team: Backend Development
   - **SmartLaw Mietrecht - Web App**
     - Description: "Web application development for SmartLaw Mietrecht"
     - Privacy: Private to team members
     - Team: Frontend Development
   - **SmartLaw Mietrecht - Mobile App**
     - Description: "Mobile application development for SmartLaw Mietrecht"
     - Privacy: Private to team members
     - Team: Mobile Development
   - **SmartLaw Mietrecht - Infrastructure**
     - Description: "Infrastructure and DevOps for SmartLaw Mietrecht"
     - Privacy: Private to team members
     - Team: DevOps/Infrastructure

### 4.2 Create Portfolios
1. Click "+" in the sidebar
2. Select "Portfolio"
3. Create each of the following portfolios:
   - **Q3 2025 Release**
     - Description: "Tasks for Q3 2025 product release"
   - **Technical Debt Reduction**
     - Description: "Initiatives to reduce technical debt"
   - **Performance Optimization**
     - Description: "Projects focused on performance improvements"
   - **Security Enhancements**
     - Description: "Security-focused initiatives and improvements"

## Step 5: Configure Custom Fields

### 5.1 Create Priority Field
1. Go to "Custom Fields" in Admin Console
2. Click "Create Custom Field"
3. Name: "Priority"
4. Type: Dropdown
5. Options:
   - Critical
   - High
   - Medium
   - Low
6. Set as default field for all projects

### 5.2 Create Estimate Field
1. In Custom Fields, click "Create Custom Field"
2. Name: "Estimate"
3. Type: Number
4. Unit: "days"
5. Set as default field for all projects

### 5.3 Create Business Value Field
1. In Custom Fields, click "Create Custom Field"
2. Name: "Business Value"
3. Type: Dropdown
4. Options:
   - High
   - Medium
   - Low
5. Set as default field for all projects

### 5.4 Create Customer Impact Field
1. In Custom Fields, click "Create Custom Field"
2. Name: "Customer Impact"
3. Type: Dropdown
4. Options:
   - High
   - Medium
   - Low
5. Set as default field for all projects

### 5.5 Create Technical Complexity Field
1. In Custom Fields, click "Create Custom Field"
2. Name: "Technical Complexity"
3. Type: Dropdown
4. Options:
   - High
   - Medium
   - Low
5. Set as default field for all projects

### 5.6 Create Risk Level Field
1. In Custom Fields, click "Create Custom Field"
2. Name: "Risk Level"
3. Type: Dropdown
4. Options:
   - High
   - Medium
   - Low
5. Set as default field for all projects

## Step 6: Set Up Workflow Stages

### 6.1 Configure Task Statuses
1. Go to "Custom Fields" in Admin Console
2. Click "Create Custom Field"
3. Name: "Status"
4. Type: Dropdown
5. Options:
   - Planned
   - In Progress
   - In Review
   - Blocked
   - Completed
   - Cancelled
6. Set as default field for all projects

### 6.2 Create Status Automation Rules
1. In each project, go to "Project Settings"
2. Click "Automations"
3. Create rules for status transitions:
   - When task is marked complete, notify assignee
   - When task is blocked, notify project manager
   - When task is overdue, send reminder

## Step 7: Configure Notification Settings

### 7.1 Set Organization-Wide Notifications
1. Go to "Admin Console" > "Notifications"
2. Configure default notification settings:
   - Email notifications: Enabled
   - Mobile notifications: Enabled
   - Digest emails: Daily at 8:00 AM
   - Reminder emails: 1 day before due date

### 7.2 Configure Personal Notification Preferences
1. Each user should review their personal notification settings
2. Access via profile icon > "My Profile Settings" > "Notifications"
3. Recommended settings:
   - Notify me when someone assigns me a task: Immediately
   - Notify me when someone mentions me: Immediately
   - Notify me when a task is due: 1 day before
   - Weekly digest: Enabled

## Step 8: Create Project Templates

### 8.1 Create Feature Development Template
1. In any project, click "Add Task"
2. Create a task named "Feature Development Template"
3. Add the following checklist items:
   - Requirements gathering
   - Design review
   - Implementation
   - Testing
   - Documentation
   - Deployment
4. Save as template

### 8.2 Create Bug Fix Template
1. In any project, click "Add Task"
2. Create a task named "Bug Fix Template"
3. Add the following checklist items:
   - Reproduce issue
   - Identify root cause
   - Implement fix
   - Test fix
   - Code review
   - Deploy fix
4. Save as template

### 8.3 Create Technical Debt Template
1. In any project, click "Add Task"
2. Create a task named "Technical Debt Template"
3. Add the following checklist items:
   - Problem identification
   - Impact assessment
   - Solution design
   - Implementation
   - Testing
   - Review and documentation
4. Save as template

## Verification Checklist

Before proceeding to team onboarding, verify that:

### Account Setup
- [ ] Organization account created
- [ ] Organization settings configured
- [ ] Security settings enabled
- [ ] Billing information set up

### User Management
- [ ] Admin users added and configured
- [ ] User permissions verified
- [ ] Roles assigned correctly

### Projects and Portfolios
- [ ] All main projects created
- [ ] All portfolios created
- [ ] Project descriptions added
- [ ] Team assignments configured

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

Once account setup is complete:

1. **Invite Team Members**: Send invitations to all team members
2. **Schedule Training Session**: Plan introduction meeting
3. **Prepare Training Materials**: Review Asana Quick Start Guide
4. **Create Pilot Tasks**: Select tasks for initial testing
5. **Test Integrations**: Verify GitHub and Slack integrations

## Troubleshooting

### Common Issues and Solutions

#### Issue: Can't create organization
**Solution**: 
1. Verify email address is correct
2. Check if organization already exists
3. Contact Asana support if problems persist

#### Issue: Custom fields not appearing
**Solution**:
1. Verify fields are set as default for projects
2. Refresh browser
3. Check user permissions

#### Issue: Projects not visible to team members
**Solution**:
1. Verify team members have been added to projects
2. Check project privacy settings
3. Confirm user roles and permissions

#### Issue: Notification settings not working
**Solution**:
1. Verify organization-wide settings
2. Check individual user settings
3. Ensure email addresses are correct

## Support Contacts

For technical issues during setup:
- Asana Support: https://asana.com/support
- Internal IT Support: [IT support contact information]
- Project Manager: [Project manager contact information]

## Documentation References

- Asana Implementation Plan: ASANA_IMPLEMENTATION_PLAN.md
- Asana Quick Start Guide: ASANA_QUICK_START.md
- Asana Support Guide: ASANA_SUPPORT_GUIDE.md