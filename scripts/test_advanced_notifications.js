/**
 * Test script for advanced notifications
 * This script tests the advanced notification functionality
 */

const { AdvancedNotificationManager } = require('./notifications/advancedNotificationManager.js');

// Mock data for testing
const mockDecision = {
  id: 1,
  gericht: "Bundesgerichtshof",
  ort: "Karlsruhe",
  datum: "2025-11-15",
  az: "VIII ZR 121/24",
  themen: ["Mietminderung", "Schimmelbefall"],
  zusammenfassung: "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern, selbst wenn dieser teilweise auf eigenes Verschulden zurückzuführen ist.",
  volltext: "Der Bundesgerichtshof hat entschieden, dass ein Mieter bei Vorliegen eines schwerwiegenden Schimmelbefalls die Miete mindern kann, auch wenn der Schimmel teilweise auf eigenes Verschulden des Mieters zurückzuführen ist. Die Entscheidung berücksichtigt das Gebot der Verhältnismäßigkeit.",
  url: "https://www.bundesgerichtshof.de/blob/[...]",
  richter: ["Präsident Dr. Müller", "Richter Schmidt", "Richter Weber"],
  praxishinweise: "Diese Entscheidung erweitert den Schutz von Mietern bei Schimmelbefall. Anwälte sollten bei Mietminderungsverlangen nicht mehr automatisch das eigene Verschulden des Mieters als Ausschlussgrund prüfen, sondern eine Einzelfallbetrachtung durchführen.",
  wichtigkeit: "hoch"
};

const mockLawyer = {
  id: 1,
  name: "Max Mustermann",
  email: "max.mustermann@kanzlei.de",
  deviceId: "device-123",
  phoneNumber: "+49123456789",
  kanzlei: "Mustermann & Partner",
  schwerpunkte: ["Mietrecht", "Wohnungsrecht"],
  regionen: ["Berlin", "Brandenburg"],
  einstellungen: {
    gerichtsarten: ["Bundesgerichtshof", "Landgericht"],
    themengebiete: ["Mietminderung", "Kündigung", "Nebenkosten"],
    frequenz: "woechentlich"
  }
};

async function testAdvancedNotifications() {
  console.log("Testing advanced notification functionality...\n");
  
  try {
    // Initialize notification manager
    const notificationManager = new AdvancedNotificationManager();
    
    // Test 1: Send multi-channel notification
    console.log("Test 1: Send multi-channel notification");
    const results = await notificationManager.sendMultiChannelNotification(
      mockDecision, 
      mockLawyer, 
      ['stub'] // Using stub to avoid external dependencies
    );
    
    console.log("  Notification results:");
    results.forEach(result => {
      console.log(`    ${result.channel}: ${result.success ? 'SUCCESS' : 'FAILED'}${result.error ? ` - ${result.error}` : ''}`);
    });
    
    // Test 2: Add to RSS feed
    console.log("\nTest 2: Add to RSS feed");
    notificationManager.addToRSSFeed(mockDecision);
    console.log("  Decision added to RSS feed");
    
    // Test 3: Generate RSS feed
    console.log("\nTest 3: Generate RSS feed");
    const rssFeed = notificationManager.generateRSSFeed();
    console.log("  RSS feed generated");
    console.log(`    Feed length: ${rssFeed.length} characters`);
    
    // Test 4: Subscribe to real-time notifications
    console.log("\nTest 4: Subscribe to real-time notifications");
    const subscriptionId = notificationManager.subscribe((decision) => {
      console.log(`    Received notification for decision: ${decision.az}`);
    });
    console.log(`  Subscribed with ID: ${subscriptionId}`);
    
    // Test 5: Notify subscribers
    console.log("\nTest 5: Notify subscribers");
    notificationManager.notifySubscribers(mockDecision);
    console.log("  Subscribers notified");
    
    // Test 6: Unsubscribe
    console.log("\nTest 6: Unsubscribe");
    notificationManager.unsubscribe(subscriptionId);
    console.log("  Unsubscribed");
    
    console.log("\nAdvanced notification tests completed successfully!");
    return true;
  } catch (error) {
    console.error("Error testing advanced notifications:", error.message);
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAdvancedNotifications().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = { testAdvancedNotifications };