import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './App.css';

// Typdefinitionen
interface CasePrediction {
  id: string;
  title: string;
  predictedOutcome: string;
  confidence: number;
  estimatedDuration: number;
}

interface CaseCategory {
  name: string;
  count: number;
  color: string;
}

interface LawyerRecommendation {
  caseId: string;
  caseTitle: string;
  score: number;
  reasoning: string;
}

// Mock-Daten für die Diagramme
const mockPredictions: CasePrediction[] = [
  { id: '1', title: 'Mietvertrag Kündigung', predictedOutcome: 'Gewinn', confidence: 0.85, estimatedDuration: 45 },
  { id: '2', title: 'Nebenkostenabrechnung', predictedOutcome: 'Verlust', confidence: 0.72, estimatedDuration: 30 },
  { id: '3', title: 'Modernisierungsmieterhöhungen', predictedOutcome: 'Gewinn', confidence: 0.91, estimatedDuration: 60 },
  { id: '4', title: 'Heizkostenverteilung', predictedOutcome: 'Unklar', confidence: 0.65, estimatedDuration: 40 },
];

const mockCategories: CaseCategory[] = [
  { name: 'Mietrecht', count: 42, color: '#0088FE' },
  { name: 'Vertragsrecht', count: 28, color: '#00C49F' },
  { name: 'Familienrecht', count: 15, color: '#FFBB28' },
  { name: 'Arbeitsrecht', count: 10, color: '#FF8042' },
  { name: 'Sonstige', count: 5, color: '#8884D8' },
];

const mockRecommendations: LawyerRecommendation[] = [
  { caseId: '1', caseTitle: 'Mietvertrag Kündigung', score: 0.92, reasoning: 'Passt zu Ihrer Spezialisierung' },
  { caseId: '3', caseTitle: 'Modernisierungsmieterhöhungen', score: 0.87, reasoning: 'Hohe Erfahrung in diesem Bereich' },
  { caseId: '5', caseTitle: 'Wohnungseigentum', score: 0.81, reasoning: 'Regionale Expertise' },
];

function App() {
  const [predictions, setPredictions] = useState<CasePrediction[]>([]);
  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const [recommendations, setRecommendations] = useState<LawyerRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simuliere API-Aufruf
    setTimeout(() => {
      setPredictions(mockPredictions);
      setCategories(mockCategories);
      setRecommendations(mockRecommendations);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="loading">Lade Dashboard...</div>;
  }

  return (
    <div className="App">
      <header className="header">
        <h1>SmartLaw AI Dashboard</h1>
        <p>KI-gestützte Rechtsberatung und Fallvorhersage</p>
      </header>

      <main className="dashboard">
        <section className="predictions-section">
          <h2>Fallvorhersagen</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="confidence" name="Konfidenz" fill="#8884d8" />
                <Bar dataKey="estimatedDuration" name="Geschätzte Dauer (Tage)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="predictions-list">
            <h3>Top Vorhersagen</h3>
            <ul>
              {predictions.map(prediction => (
                <li key={prediction.id}>
                  <strong>{prediction.title}</strong>: {prediction.predictedOutcome} 
                  (Konfidenz: {(prediction.confidence * 100).toFixed(1)}%)
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="categories-section">
          <h2>Fallkategorien</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="recommendations-section">
          <h2>Personalisierte Empfehlungen</h2>
          <div className="recommendations-list">
            <ul>
              {recommendations.map(recommendation => (
                <li key={recommendation.caseId}>
                  <strong>{recommendation.caseTitle}</strong>: 
                  Score {recommendation.score.toFixed(2)} - {recommendation.reasoning}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© 2025 SmartLaw - KI-gestützte Rechtsberatung</p>
      </footer>
    </div>
  );
}

export default App;