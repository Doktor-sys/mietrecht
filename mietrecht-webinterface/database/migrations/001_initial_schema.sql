-- Initial schema for Mietrecht Webinterface

-- Create lawyers table
CREATE TABLE IF NOT EXISTS lawyers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    law_firm VARCHAR(255),
    practice_areas TEXT[],
    regions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lawyer_preferences table
CREATE TABLE IF NOT EXISTS lawyer_preferences (
    id SERIAL PRIMARY KEY,
    lawyer_id INTEGER REFERENCES lawyers(id) ON DELETE CASCADE,
    court_levels TEXT[],
    topics TEXT[],
    frequency VARCHAR(20) DEFAULT 'weekly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court_decisions table
CREATE TABLE IF NOT EXISTS court_decisions (
    id SERIAL PRIMARY KEY,
    court VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    decision_date DATE NOT NULL,
    case_number VARCHAR(100) NOT NULL,
    topics TEXT[],
    summary TEXT,
    full_text TEXT,
    url TEXT,
    judges TEXT[],
    practice_implications TEXT,
    importance VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create newsletter_archive table
CREATE TABLE IF NOT EXISTS newsletter_archive (
    id SERIAL PRIMARY KEY,
    lawyer_id INTEGER REFERENCES lawyers(id) ON DELETE CASCADE,
    decision_id INTEGER REFERENCES court_decisions(id) ON DELETE CASCADE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subject VARCHAR(255),
    content TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lawyers_email ON lawyers(email);
CREATE INDEX IF NOT EXISTS idx_lawyer_preferences_lawyer_id ON lawyer_preferences(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_court_decisions_date ON court_decisions(decision_date);
CREATE INDEX IF NOT EXISTS idx_court_decisions_topics ON court_decisions USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_newsletter_archive_lawyer_id ON newsletter_archive(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_archive_sent_at ON newsletter_archive(sent_at);

-- Insert sample data for testing
INSERT INTO lawyers (name, email, law_firm, practice_areas, regions) VALUES
    ('Max Mustermann', 'max.mustermann@lawfirm.de', 'Mustermann & Partner', ARRAY['Mietrecht', 'Wohnungsrecht'], ARRAY['Berlin', 'Brandenburg']),
    ('Anna Schmidt', 'anna.schmidt@lawfirm.de', 'Schmidt Rechtsanwälte', 'Mietrecht,Verwaltungsrecht', ARRAY['Hamburg', 'Schleswig-Holstein'])
ON CONFLICT (email) DO NOTHING;

INSERT INTO lawyer_preferences (lawyer_id, court_levels, topics, frequency) VALUES
    (1, ARRAY['Bundesgerichtshof', 'Landgericht'], ARRAY['Mietminderung', 'Kündigung', 'Nebenkosten'], 'weekly'),
    (2, ARRAY['Bundesgerichtshof', 'Bundesverfassungsgericht'], ARRAY['Mietpreisbremse', 'Verfassungsrecht'], 'weekly')
ON CONFLICT DO NOTHING;

INSERT INTO court_decisions (court, location, decision_date, case_number, topics, summary, full_text, url, judges, practice_implications, importance) VALUES
    ('Bundesgerichtshof', 'Karlsruhe', '2025-11-15', 'VIII ZR 121/24', ARRAY['Mietminderung', 'Schimmelbefall'], 'Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern, selbst wenn dieser teilweise auf eigenes Verschulden zurückzuführen ist.', 'Der Bundesgerichtshof hat entschieden, dass ein Mieter bei Vorliegen eines schwerwiegenden Schimmelbefalls die Miete mindern kann, auch wenn der Schimmel teilweise auf eigenes Verschulden des Mieters zurückzuführen ist. Die Entscheidung berücksichtigt das Gebot der Verhältnismäßigkeit.', 'https://www.bundesgerichtshof.de/blob/[...]', ARRAY['Präsident Dr. Müller', 'Richter Schmidt', 'Richter Weber'], 'Diese Entscheidung erweitert den Schutz von Mietern bei Schimmelbefall. Anwälte sollten bei Mietminderungsverlangen nicht mehr automatisch das eigene Verschulden des Mieters als Ausschlussgrund prüfen, sondern eine Einzelfallbetrachtung durchführen.', 'high'),
    ('Landgericht', 'Berlin', '2025-11-10', '34 M 12/25', ARRAY['Kündigung', 'Modernisierung'], 'Eine Kündigung wegen Eigenbedarf ist unzulässig, wenn die Modernisierungsmaßnahmen nicht ordnungsgemäß angekündigt wurden.', 'Das Landgericht Berlin hat entschieden, dass eine Kündigung wegen Eigenbedarf unzulässig ist, wenn die erforderlichen Modernisierungsmaßnahmen nicht mindestens drei Monate vorher ordnungsgemäß angekündigt wurden. Die ordnungsgemäße Ankündigung ist Voraussetzung für die Zulässigkeit der Kündigung.', 'https://www.berlin.landgericht.de/[...]', ARRAY['Richterin Fischer', 'Richter Klein'], 'Vermieteranwälte müssen bei Eigenbedarfskündigungen unbedingt prüfen, ob die Modernisierungsankündigung fristgerecht erfolgt ist. Mieteranwälte können bei mangelnder Ankündigung die Kündigung angreifen.', 'medium')
ON CONFLICT DO NOTHING;