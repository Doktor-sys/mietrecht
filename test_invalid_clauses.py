import sys
import unittest
from flask import json

# Append path to import mietrecht_full
sys.path.append('.')
from mietrecht_full import app, MIETRECHT_WISSEN

class TestInvalidClauses(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_topics_endpoint(self):
        response = self.app.get('/api/topics')
        data = json.loads(response.data)
        self.assertIn("Kleinreparaturen", data)
        self.assertIn("Kündigungsverzicht", data)
        self.assertIn("Pauschalen", data)
        self.assertIn("Unwirksame Klauseln", data)
        self.assertIn("Wohnungsschlüssel", data)
        self.assertIn("Mietpreis", data)

    def test_topic_details_kleinreparaturen(self):
        response = self.app.get('/api/topic/Kleinreparaturen')
        data = json.loads(response.data)
        self.assertIn("Einzelgrenze", data)
        self.assertTrue("75 € bis 100 €" in data["Einzelgrenze"])

    def test_topic_details_kuendigungsverzicht(self):
        response = self.app.get('/api/topic/Kündigungsverzicht')
        data = json.loads(response.data)
        self.assertIn("Dauer", data)
        self.assertTrue("maximal vier Jahre" in data["Dauer"])

    def test_topic_details_pauschalen(self):
        response = self.app.get('/api/topic/Pauschalen')
        data = json.loads(response.data)
        self.assertIn("Heizkosten", data)
        self.assertTrue("meist unzulässig" in data["Heizkosten"])

    def test_topic_details_unwirksame_klauseln(self):
        response = self.app.get('/api/topic/Unwirksame Klauseln')
        data = json.loads(response.data)
        self.assertIn("Allgemein", data)
        self.assertTrue("§ 307 BGB" in data["Allgemein"])

    def test_topic_details_wohnungsschluessel(self):
        response = self.app.get('/api/topic/Wohnungsschlüssel')
        data = json.loads(response.data)
        self.assertIn("Key Retention", data)
        self.assertTrue("keinen Zweitschlüssel einbehalten" in data["Key Retention"])

    def test_topic_details_mietpreis(self):
        response = self.app.get('/api/topic/Mietpreis')
        data = json.loads(response.data)
        self.assertIn("Mietpreisbremse", data)
        self.assertTrue("maximal 10 %" in data["Mietpreisbremse"])

if __name__ == '__main__':
    unittest.main()
