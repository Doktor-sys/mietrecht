/**
 * Test suite for the tasks.md parser
 */

const { parseTaskLine, parseAttributes, parseTasksFile } = require('./parse_tasks_md.js');
const fs = require('fs');
const path = require('path');

// Test data
const sampleTaskLines = [
  '- [x] **Authentication Service** (Prio: Critical | Est: 4 days | Owner: Max | Depends on: Projekt-Setup): JWT-based authentication with password hashing',
  '- [~] **Database Design** (Prio: High | Est: 3 days | Owner: Sarah): Create Prisma schema',
  '- [ ] **API Documentation** (Prio: Medium | Est: 2 days | Owner: Max): Generate Swagger/OpenAPI documentation',
  '- [!] **Performance Optimization** (Prio: High | Est: 4 days | Owner: Team | Depends on: Load Testing Framework): Optimize database queries',
  '- [?] **Requirements Gathering** (Prio: Medium | Est: 5 days | Owner: Product Manager): Collect user requirements'
];

const sampleAttributeStrings = [
  'Prio: Critical | Est: 4 days | Owner: Max | Depends on: Projekt-Setup',
  'Prio: High | Est: 3 days | Owner: Sarah',
  'Prio: Medium | Est: 2 days | Owner: Max'
];

console.log('Running parser tests...\n');

// Test parseTaskLine function
console.log('1. Testing parseTaskLine function:');
let passedTests = 0;
let totalTests = 0;

for (const line of sampleTaskLines) {
  totalTests++;
  try {
    const result = parseTaskLine(line);
    if (result) {
      console.log(`   ✓ Parsed: "${result.title}" with status "${result.status}"`);
      passedTests++;
    } else {
      console.log(`   ✗ Failed to parse: "${line}"`);
    }
  } catch (error) {
    console.log(`   ✗ Error parsing: "${line}" - ${error.message}`);
  }
}

// Test parseAttributes function
console.log('\n2. Testing parseAttributes function:');
for (const attrString of sampleAttributeStrings) {
  totalTests++;
  try {
    const result = parseAttributes(attrString);
    if (result) {
      console.log(`   ✓ Parsed attributes: Priority=${result.priority}, Estimate=${result.estimate}, Owner=${result.owner}`);
      passedTests++;
    } else {
      console.log(`   ✗ Failed to parse attributes: "${attrString}"`);
    }
  } catch (error) {
    console.log(`   ✗ Error parsing attributes: "${attrString}" - ${error.message}`);
  }
}

// Test parseTasksFile function
console.log('\n3. Testing parseTasksFile function:');
totalTests++;
try {
  // Create a temporary test file
  const testFilePath = path.join(__dirname, 'test_tasks.md');
  const testContent = `
## ✅ Completed Tasks

### Phase 1
- [x] **Task 1** (Prio: High | Est: 2 days | Owner: John): Description 1

## 🚧 In Progress

### Phase 2
- [~] **Task 2** (Prio: Medium | Est: 3 days | Owner: Jane): Description 2
`;
  
  fs.writeFileSync(testFilePath, testContent);
  const result = parseTasksFile(testFilePath);
  
  if (result && result.length > 0) {
    console.log(`   ✓ Parsed ${result.length} tasks from test file`);
    console.log(`   ✓ First task: "${result[0].title}" in section "${result[0].section}"`);
    passedTests++;
  } else {
    console.log('   ✗ Failed to parse tasks from test file');
  }
  
  // Clean up
  fs.unlinkSync(testFilePath);
} catch (error) {
  console.log(`   ✗ Error testing parseTasksFile: ${error.message}`);
}

console.log(`\nTest Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed.');
  process.exit(1);
}