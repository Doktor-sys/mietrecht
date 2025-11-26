/**
 * Script to parse tasks.md file and convert to structured data for migration
 * to digital task tracking systems
 */

const fs = require('fs');
const path = require('path');

// Path to the tasks.md file
const TASKS_FILE_PATH = path.join(__dirname, '..', 'tasks.md');

/**
 * Parse a task line and extract structured data
 * @param {string} line - The task line to parse
 * @returns {Object|null} Parsed task data or null if not a task line
 */
function parseTaskLine(line) {
  // Regex to match task lines
  const taskRegex = /^(\s*)- \[([ x~!?])\]\s*\*\*(.+?)\*\*\s*(?:$$(.*?)$$)?\s*:(.*)?$/;
  const match = line.match(taskRegex);
  
  if (!match) {
    return null;
  }
  
  const [, indent, status, title, attributes, description] = match;
  
  // Determine task status
  let taskStatus;
  switch (status) {
    case 'x':
      taskStatus = 'Completed';
      break;
    case '~':
      taskStatus = 'In Progress';
      break;
    case '!':
      taskStatus = 'Blocked';
      break;
    case '?':
      taskStatus = 'Needs Clarification';
      break;
    default:
      taskStatus = 'Planned';
  }
  
  // Parse attributes
  const parsedAttributes = parseAttributes(attributes || '');
  
  return {
    indent: indent.length,
    status: taskStatus,
    title: title.trim(),
    ...parsedAttributes,
    description: (description || '').trim()
  };
}

/**
 * Parse attributes string into structured data
 * @param {string} attributes - The attributes string to parse
 * @returns {Object} Parsed attributes
 */
function parseAttributes(attributes) {
  const result = {};
  
  if (!attributes) {
    return result;
  }
  
  // Split by | but respect quoted strings
  const attributePairs = attributes.split(/\s*\|\s*/);
  
  for (const pair of attributePairs) {
    const [key, value] = pair.split(':').map(s => s.trim());
    
    switch (key.toLowerCase()) {
      case 'prio':
        result.priority = value;
        break;
      case 'est':
        result.estimate = value;
        break;
      case 'owner':
        result.owner = value;
        break;
      case 'depends on':
        result.dependencies = value;
        break;
      default:
        // Handle unknown attributes
        result[key.toLowerCase()] = value;
    }
  }
  
  return result;
}

/**
 * Parse the entire tasks.md file
 * @param {string} filePath - Path to the tasks.md file
 * @returns {Array} Array of parsed tasks
 */
function parseTasksFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const tasks = [];
  let currentSection = '';
  let currentSubsection = '';
  let parentTask = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    
    // Skip empty lines
    if (line.trim() === '') {
      continue;
    }
    
    // Check for section headers (###)
    if (line.startsWith('###')) {
      currentSubsection = line.replace('###', '').trim();
      parentTask = null;
      continue;
    }
    
    // Check for main section headers (##)
    if (line.startsWith('##')) {
      currentSection = line.replace('##', '').trim();
      currentSubsection = '';
      parentTask = null;
      continue;
    }
    
    // Parse task lines
    const taskData = parseTaskLine(line);
    if (taskData) {
      taskData.section = currentSection;
      taskData.subsection = currentSubsection;
      
      // Determine if this is a subtask
      if (parentTask && taskData.indent > parentTask.indent) {
        taskData.parentTask = parentTask.title;
        if (!parentTask.subtasks) {
          parentTask.subtasks = [];
        }
        parentTask.subtasks.push(taskData);
      } else {
        tasks.push(taskData);
        parentTask = taskData;
      }
    }
  }
  
  return tasks;
}

/**
 * Convert parsed tasks to CSV format
 * @param {Array} tasks - Array of parsed tasks
 * @returns {string} CSV formatted string
 */
function convertToCSV(tasks) {
  const headers = ['Section', 'Subsection', 'Status', 'Title', 'Priority', 'Estimate', 'Owner', 'Dependencies', 'Description'];
  const csvRows = [headers.join(',')];
  
  function addTaskToCSV(task) {
    const row = [
      `"${task.section || ''}"`,
      `"${task.subsection || ''}"`,
      `"${task.status || ''}"`,
      `"${task.title || ''}"`,
      `"${task.priority || ''}"`,
      `"${task.estimate || ''}"`,
      `"${task.owner || ''}"`,
      `"${task.dependencies || ''}"`,
      `"${task.description || ''}"`
    ];
    csvRows.push(row.join(','));
    
    // Add subtasks if they exist
    if (task.subtasks) {
      for (const subtask of task.subtasks) {
        addTaskToCSV(subtask);
      }
    }
  }
  
  for (const task of tasks) {
    addTaskToCSV(task);
  }
  
  return csvRows.join('\n');
}

/**
 * Convert parsed tasks to JSON format
 * @param {Array} tasks - Array of parsed tasks
 * @returns {string} JSON formatted string
 */
function convertToJSON(tasks) {
  return JSON.stringify(tasks, null, 2);
}

/**
 * Main function
 */
function main() {
  try {
    console.log('Parsing tasks.md file...');
    const tasks = parseTasksFile(TASKS_FILE_PATH);
    
    console.log(`Parsed ${tasks.length} tasks`);
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'migration_output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    // Generate CSV output
    console.log('Generating CSV output...');
    const csvOutput = convertToCSV(tasks);
    fs.writeFileSync(path.join(outputDir, 'tasks.csv'), csvOutput);
    
    // Generate JSON output
    console.log('Generating JSON output...');
    const jsonOutput = convertToJSON(tasks);
    fs.writeFileSync(path.join(outputDir, 'tasks.json'), jsonOutput);
    
    console.log('Migration parsing complete!');
    console.log(`Output files generated in: ${outputDir}`);
    console.log('- tasks.csv: CSV format for spreadsheet import');
    console.log('- tasks.json: JSON format for programmatic import');
    
  } catch (error) {
    console.error('Error parsing tasks file:', error.message);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  parseTaskLine,
  parseAttributes,
  parseTasksFile,
  convertToCSV,
  convertToJSON
};