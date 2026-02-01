/**
 * Input Validation Security Tests
 * These tests verify the enhanced input validation in the Mietrecht Agent.
 */

const { validateLawyerData } = require('../../middleware/securityMiddleware.js');

// Test suite for input validation
describe('Input Validation Security Tests', () => {
  // Test for valid lawyer data
  test('should accept valid lawyer data', () => {
    const validData = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      law_firm: 'Musterkanzlei',
      practice_areas: ['Mietrecht', 'Familienrecht'],
      regions: ['Berlin', 'Brandenburg']
    };
    
    expect(() => {
      validateLawyerData(validData);
    }).not.toThrow();
  });
  
  // Test for missing name
  test('should reject lawyer data without name', () => {
    const invalidData = {
      email: 'max@example.com',
      law_firm: 'Musterkanzlei'
    };
    
    expect(() => {
      validateLawyerData(invalidData);
    }).toThrow('Name is required');
  });
  
  // Test for missing email
  test('should reject lawyer data without email', () => {
    const invalidData = {
      name: 'Max Mustermann',
      law_firm: 'Musterkanzlei'
    };
    
    expect(() => {
      validateLawyerData(invalidData);
    }).toThrow('Email is required');
  });
  
  // Test for invalid email format
  test('should reject lawyer data with invalid email format', () => {
    const invalidData = {
      name: 'Max Mustermann',
      email: 'invalid-email',
      law_firm: 'Musterkanzlei'
    };
    
    expect(() => {
      validateLawyerData(invalidData);
    }).toThrow('Invalid email format');
  });
  
  // Test for name too long
  test('should reject lawyer data with name too long', () => {
    const invalidData = {
      name: 'A'.repeat(101), // 101 characters
      email: 'max@example.com',
      law_firm: 'Musterkanzlei'
    };
    
    expect(() => {
      validateLawyerData(invalidData);
    }).toThrow('Name must be a string with maximum 100 characters');
  });
  
  // Test for law firm too long
  test('should reject lawyer data with law firm too long', () => {
    const invalidData = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      law_firm: 'A'.repeat(101) // 101 characters
    };
    
    expect(() => {
      validateLawyerData(invalidData);
    }).toThrow('Law firm must be a string with maximum 100 characters');
  });
  
  // Test for practice areas not an array
  test('should reject lawyer data with practice areas not an array', () => {
    const invalidData = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      practice_areas: 'Mietrecht' // Should be an array
    };
    
    expect(() => {
      validateLawyerData(invalidData);
    }).toThrow('Practice areas must be an array');
  });
  
  // Test for too many practice areas
  test('should reject lawyer data with too many practice areas', () => {
    const invalidData = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      practice_areas: Array(21).fill('Mietrecht') // 21 areas, max is 20
    };
    
    expect(() => {
      validateLawyerData(invalidData);
    }).toThrow('Maximum 20 practice areas allowed');
  });
  
  // Test for practice area too long
  test('should reject lawyer data with practice area too long', () => {
    const invalidData = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      practice_areas: ['A'.repeat(51)] // 51 characters, max is 50
    };
    
    expect(() => {
      validateLawyerData(invalidData);
    }).toThrow('Each practice area must be a string with maximum 50 characters');
  });
  
  // Test for regions not an array
  test('should reject lawyer data with regions not an array', () => {
    const invalidData = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      regions: 'Berlin' // Should be an array
    };
    
    expect(() => {
      validateLawyerData(invalidData);
    }).toThrow('Regions must be an array');
  });
  
  // Test for too many regions
  test('should reject lawyer data with too many regions', () => {
    const invalidData = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      regions: Array(21).fill('Berlin') // 21 regions, max is 20
    };
    
    expect(() => {
      validateLawyerData(invalidData);
    }).toThrow('Maximum 20 regions allowed');
  });
  
  // Test for region too long
  test('should reject lawyer data with region too long', () => {
    const invalidData = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      regions: ['A'.repeat(51)] // 51 characters, max is 50
    };
    
    expect(() => {
      validateLawyerData(invalidData);
    }).toThrow('Each region must be a string with maximum 50 characters');
  });
});