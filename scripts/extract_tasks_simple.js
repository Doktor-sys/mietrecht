const fs = require('fs');
const path = require('path');

// Path to the tasks.md file
const TASKS_FILE_PATH = path.join(__dirname, '..', 'tasks.md');

function extractTasks() {
  const content = fs.readFileSync(TASKS_FILE_PATH, 'utf8');
  const lines = content.split('\n');
  
  const tasks = [];
  let currentSection = '';
  let currentSubsection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for section headers (##)
    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '').trim();
      continue;
    }
    
    // Check for subsection headers (###)
    if (line.startsWith('### ')) {
      currentSubsection = line.replace('### ', '').trim();
      continue;
    }
    
    // Check for task lines (- [x] or - [ ] or variations)
    if (line.match(/^(\s*)- \[([ xX])\]\s*/)) {
      // Extract task information
      const statusMatch = line.match(/- \[([ xX])\]/);
      const status = statusMatch[1] === 'x' ? 'Completed' : 'Planned';
      
      // Extract task title (text between **)
      const titleMatch = line.match(/\*\*(.*?)\*\*/);
      if (titleMatch) {
        const title = titleMatch[1];
        
        // Extract attributes (text in parentheses)
        const attrMatch = line.match(/\(([^)]+)\)/);
        const attributes = attrMatch ? attrMatch[1] : '';
        
        // Extract description (text after colon)
        const descMatch = line.match(/:\s*(.*)/);
        const description = descMatch ? descMatch[1] : '';
        
        tasks.push({
          section: currentSection,
          subsection: currentSubsection,
          status: status,
          title: title,
          attributes: attributes,
          description: description.trim()
        });
      }
    }
  }
  
  return tasks;
}

function saveTasksAsJSON(tasks) {
  const outputDir = path.join(__dirname, '..', 'migration_output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  const outputPath = path.join(outputDir, 'tasks_simple.json');
  fs.writeFileSync(outputPath, JSON.stringify(tasks, null, 2));
  console.log(`Saved ${tasks.length} tasks to ${outputPath}`);
}

function saveTasksAsCSV(tasks) {
  const outputDir = path.join(__dirname, '..', 'migration_output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Create CSV header
  let csvContent = 'Section,Subsection,Status,Title,Attributes,Description\n';
  
  // Add each task as a row
  for (const task of tasks) {
    const row = [
      `"${task.section || ''}"`,
      `"${task.subsection || ''}"`,
      `"${task.status || ''}"`,
      `"${task.title || ''}"`,
      `"${task.attributes || ''}"`,
      `"${task.description || ''}"`
    ];
    csvContent += row.join(',') + '\n';
  }
  
  const outputPath = path.join(outputDir, 'tasks_simple.csv');
  fs.writeFileSync(outputPath, csvContent);
  console.log(`Saved ${tasks.length} tasks to ${outputPath}`);
}

// Main execution
try {
  console.log('Extracting tasks from tasks.md...');
  const tasks = extractTasks();
  console.log(`Found ${tasks.length} tasks`);
  
  saveTasksAsJSON(tasks);
  saveTasksAsCSV(tasks);
  
  console.log('Task extraction complete!');
} catch (error) {
  console.error('Error extracting tasks:', error.message);
}