import offlineManager from './src/services/offlineManager';
import offlineStorage from './src/services/offlineStorage';

async function testOfflineFunctionality() {
  console.log('Testing offline functionality...');
  
  // Initialize the offline manager
  await offlineManager.initialize();
  
  // Check initial network status
  const isOnline = await offlineManager.checkNetworkStatus();
  console.log('Initial network status:', isOnline ? 'Online' : 'Offline');
  
  // Simulate going offline
  console.log('Simulating offline mode...');
  // We can't actually change the network status, but we can test the offline storage
  
  // Test storing chat messages
  const conversationId = 'test-conversation-123';
  const testMessages = [
    { id: '1', text: 'Hello, this is a test message', sender: 'user', timestamp: new Date().toISOString() },
    { id: '2', text: 'This is a response', sender: 'ai', timestamp: new Date().toISOString() }
  ];
  
  console.log('Storing chat messages locally...');
  const storeResult = await offlineStorage.storeChatMessages(conversationId, testMessages);
  console.log('Store result:', storeResult);
  
  // Test retrieving chat messages
  console.log('Retrieving chat messages...');
  const retrievedMessages = await offlineStorage.getChatMessages(conversationId);
  console.log('Retrieved messages:', retrievedMessages);
  
  // Test adding to offline queue
  console.log('Adding item to offline queue...');
  const queueResult = await offlineManager.queueChatMessage(conversationId, 'This is another test message');
  console.log('Queue result:', queueResult);
  
  // Test getting offline queue
  console.log('Getting offline queue...');
  const queue = await offlineStorage.getOfflineQueue();
  console.log('Offline queue:', queue);
  
  // Test storing user preferences
  console.log('Storing user preferences...');
  const prefs = { theme: 'dark', language: 'de', notifications: true };
  const prefsResult = await offlineStorage.storeUserPreferences(prefs);
  console.log('Preferences store result:', prefsResult);
  
  // Test retrieving user preferences
  console.log('Retrieving user preferences...');
  const retrievedPrefs = await offlineStorage.getUserPreferences();
  console.log('Retrieved preferences:', retrievedPrefs);
  
  console.log('Offline functionality test completed!');
}

testOfflineFunctionality().catch(console.error);