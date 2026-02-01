# Task Migration Tools

This directory contains tools for migrating from Markdown-based task management to digital task tracking systems.

## Available Scripts

### Core Tools
- `parse-tasks`: Parse Markdown task files
- `test`: Run parser tests

### Asana Integration
- `asana-setup`: Set up Asana integration
- `test-asana`: Test Asana integration

### Weekly Agent
- `weekly-agent`: Run weekly update agent
- `test-weekly-agent`: Test weekly agent

### Mietrecht Agent
- `mietrecht-agent`: Run Mietrecht agent prototype
- `test-mietrecht-agent`: Test Mietrecht agent
- `mietrecht-agent-de`: Run German version of Mietrecht agent
- `test-mietrecht-agent-de`: Test German Mietrecht agent
- `mietrecht-agent-real-data`: Run Mietrecht agent with real data sources
- `test-mietrecht-agent-real-data`: Test Mietrecht agent with real data

### API Clients
- `bgh-api-client`: BGH API client
- `test-bgh-api`: Test BGH API client
- `landgericht-api-client`: Landgericht API client
- `test-landgericht-api`: Test Landgericht API client
- `njw-api-client`: NJW API client
- `test-njw-api`: Test NJW API client
- `test-mietrecht-agent-with-njw`: Test Mietrecht agent with NJW integration

### Cache and Monitoring
- `api-cache`: API caching system
- `test-api-cache`: Test API cache

### Integration
- `github-asana`: GitHub-Asana webhook integration
- `deploy-heroku`: Deploy to Heroku

### Machine Learning
- `test-legal-classifier`: Test legal text classifier
- `install-ml-deps`: Install ML dependencies (TensorFlow.js and PyTorch)

## Additional Documentation

- [Advanced Features](README_ADVANCED_FEATURES.md)
- [Dashboard](README_DASHBOARD.md)
- [Data Sources](README_DATA_SOURCES.md)
- [GitHub-Asana Integration](README_GITHUB_ASANA.md)
- [Integrations](README_INTEGRATIONS.md)
- [German Mietrecht Agent](README_MIETRECHT_AGENT_DE.md)
- [NLP](README_NLP.md)
- [Real APIs](README_REAL_APIS.md)
- [Web Configuration](README_WEB_CONFIG.md)
- [Legal Text Classifier](ml/README_LEGAL_CLASSIFIER.md)

## Testing

Most scripts have corresponding test scripts. Run tests to verify functionality.

## Overview

The tools in this directory are designed to:

1. Parse the existing [tasks.md](file:///f%3A%20-%202025%20-%2022.06-%20copy%20C%5C_AA_Postfach%2001.01.2025%5C03.07.2025%20Arbeit%2002.11.2025%5CJurisMind%20-%20Mietrecht%2001%5Ctasks.md) file
2. Extract structured task data
3. Convert the data to formats suitable for import into digital task tracking systems

## Files

- [parse_tasks_md.js](file:///f%3A%20-%202025%20-%2022.06-%20copy%20C%5C_AA_Postfach%2001.01.2025%5C03.07.2025%20Arbeit%2002.11.2025%5CJurisMind%20-%20Mietrecht%2001%5Cscripts%5Cparse_tasks_md.js) - Main parser script
- [test_parser.js](file:///f%3A%20-%202025%20-%2022.06-%20copy%20C%5C_AA_Postfach%2001.01.2025%5C03.07.2025%20Arbeit%2002.11.2025%5CJurisMind%20-%20Mietrecht%2001%5Cscripts%5Ctest_parser.js) - Test suite for the parser
- [package.json](file:///f%3A%20-%202025%20-%2022.06-%20copy%20C%5C_AA_Postfach%2001.01.2025%5C03.07.2025%20Arbeit%2002.11.2025%5CJurisMind%20-%20Mietrecht%2001%5Cscripts%5Cpackage.json) - Node.js package configuration

## Usage

### Prerequisites

- Node.js installed on your system

### Installation

1. Navigate to the scripts directory:
   ```
   cd scripts
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Running the Parser

To parse the tasks.md file and generate migration data:

```
npm run parse-tasks
```

This will:
1. Read the [tasks.md](file:///f%3A%20-%202025%20-%2022.06-%20copy%20C%5C_AA_Postfach%2001.01.2025%5C03.07.2025%20Arbeit%2002.11.2025%5CJurisMind%20-%20Mietrecht%2001%5Ctasks.md) file
2. Parse all tasks and their metadata
3. Generate output files in the `migration_output` directory:
   - `tasks.csv` - CSV format for spreadsheet import
   - `tasks.json` - JSON format for programmatic import

### Running Tests

To run the parser test suite:

```
npm test
```

## Output Formats

### CSV Format

The CSV output includes the following columns:
- Section - Main section from tasks.md (e.g., "✅ Abgeschlossene Aufgaben")
- Subsection - Subsection from tasks.md (e.g., "Phase 1: Core Services & Backend Foundation")
- Status - Task status (Completed, In Progress, Planned, Blocked, Needs Clarification)
- Title - Task title
- Priority - Task priority (Critical, High, Medium, Low)
- Estimate - Effort estimate
- Owner - Task owner
- Dependencies - Task dependencies
- Description - Task description

### JSON Format

The JSON output contains the same data as the CSV but in a structured format that preserves:
- Hierarchical relationships between tasks and subtasks
- All metadata fields
- Section and subsection information

## Customization

You can customize the parser behavior by modifying [parse_tasks_md.js](file:///f%3A%20-%202025%20-%2022.06-%20copy%20C%5C_AA_Postfach%2001.01.2025%5C03.07.2025%20Arbeit%2002.11.2025%5CJurisMind%20-%20Mietrecht%2001%5Cscripts%5Cparse_tasks_md.js):

- Add new attribute parsers in the `parseAttributes` function
- Modify the CSV output format in the `convertToCSV` function
- Adjust the task parsing logic in the `parseTaskLine` function
- Change the JSON output structure in the `convertToJSON` function

## Troubleshooting

### Common Issues

1. **File not found errors**: Ensure you're running the script from the scripts directory and that [tasks.md](file:///f%3A%20-%202025%20-%2022.06-%20copy%20C%5C_AA_Postfach%2001.01.2025%5C03.07.2025%20Arbeit%2002.11.2025%5CJurisMind%20-%20Mietrecht%2001%5Ctasks.md) exists in the parent directory

2. **Parsing errors**: Check that the tasks.md file follows the expected format. The parser expects tasks in the format:
   ```
   - [x] **Task Title** (Prio: High | Est: 2 days | Owner: John): Description
   ```

3. **Permission errors**: Ensure you have write permissions in the scripts directory to create the migration_output folder

### Getting Help

If you encounter issues not covered here:
1. Check the console output for error messages
2. Verify the tasks.md file format
3. Run the test suite to isolate issues
4. Contact the team lead for assistance

## Contributing

To contribute improvements to these tools:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite to ensure nothing is broken
6. Submit a pull request

## License

These tools are proprietary to SmartLaw Mietrecht and should not be distributed outside the organization.