import { LegalCategory } from '../services/NLPService';

export interface LegalReference {
    type: 'law' | 'court_decision' | 'regulation';
    reference: string;
    title: string;
    relevantSection?: string;
    url?: string;
    excerpt?: string;
}

export interface ActionRecommendation {
    action: string;
    priority: 'high' | 'medium' | 'low';
    deadline?: string;
    legalBasis?: string;
    details?: string;
}

export interface TemplateReference {
    templateId: string;
    templateName: string;
    description: string;
    applicableFor: string[];
}

export const CATEGORY_NAMES: Record<LegalCategory, string> = {
    rent_reduction: 'Mietminderung',
    termination: 'Kündigung',
    utility_costs: 'Nebenkosten',
    rent_increase: 'Mieterhöhung',
    defects: 'Mängel',
    deposit: 'Kaution',
    modernization: 'Modernisierung',
    other: 'Allgemeine Anfrage'
};

export const CATEGORY_KEYWORDS: Record<LegalCategory, string[]> = {
    rent_reduction: ['Mietminderung', 'Mangel', '§ 536 BGB', 'Gewährleistung'],
    termination: ['Kündigung', '§ 573 BGB', '§ 543 BGB', 'Kündigungsschutz'],
    utility_costs: ['Nebenkosten', 'Betriebskosten', '§ 556 BGB', 'Abrechnung'],
    rent_increase: ['Mieterhöhung', '§ 558 BGB', 'Mietspiegel', 'Kappungsgrenze'],
    defects: ['Mangel', 'Gewährleistung', '§ 536 BGB', 'Instandhaltung'],
    deposit: ['Kaution', 'Sicherheit', '§ 551 BGB', 'Rückzahlung'],
    modernization: ['Modernisierung', '§ 555b BGB', 'Duldungspflicht'],
    other: ['Mietrecht', 'BGB']
};

export const MANDATORY_REFERENCES: Record<LegalCategory, LegalReference[]> = {
    rent_reduction: [
        {
            type: 'law',
            reference: '§ 536 BGB',
            title: 'Mietminderung bei Sach- und Rechtsmängeln',
            relevantSection: 'Abs. 1',
            url: 'https://www.gesetze-im-internet.de/bgb/__536.html'
        },
        {
            type: 'law',
            reference: '§ 536a BGB',
            title: 'Schadensersatzanspruch des Mieters wegen eines Mangels',
            url: 'https://www.gesetze-im-internet.de/bgb/__536a.html'
        }
    ],
    termination: [
        {
            type: 'law',
            reference: '§ 573 BGB',
            title: 'Ordentliche Kündigung des Vermieters',
            url: 'https://www.gesetze-im-internet.de/bgb/__573.html'
        },
        {
            type: 'law',
            reference: '§ 543 BGB',
            title: 'Fristlose Kündigung aus wichtigem Grund',
            url: 'https://www.gesetze-im-internet.de/bgb/__543.html'
        },
        {
            type: 'law',
            reference: '§ 574 BGB',
            title: 'Widerspruch des Mieters gegen die Kündigung',
            url: 'https://www.gesetze-im-internet.de/bgb/__574.html'
        }
    ],
    utility_costs: [
        {
            type: 'law',
            reference: '§ 556 BGB',
            title: 'Vereinbarung über Betriebskosten',
            url: 'https://www.gesetze-im-internet.de/bgb/__556.html'
        },
        {
            type: 'regulation',
            reference: 'BetrKV',
            title: 'Betriebskostenverordnung',
            url: 'https://www.gesetze-im-internet.de/betrkv/'
        }
    ],
    rent_increase: [
        {
            type: 'law',
            reference: '§ 558 BGB',
            title: 'Mieterhöhung bis zur ortsüblichen Vergleichsmiete',
            url: 'https://www.gesetze-im-internet.de/bgb/__558.html'
        },
        {
            type: 'law',
            reference: '§ 559 BGB',
            title: 'Mieterhöhung nach Modernisierung',
            url: 'https://www.gesetze-im-internet.de/bgb/__559.html'
        }
    ],
    defects: [
        {
            type: 'law',
            reference: '§ 536 BGB',
            title: 'Mietminderung bei Sach- und Rechtsmängeln',
            url: 'https://www.gesetze-im-internet.de/bgb/__536.html'
        }
    ],
    deposit: [
        {
            type: 'law',
            reference: '§ 551 BGB',
            title: 'Begrenzung von Mietsicherheiten',
            url: 'https://www.gesetze-im-internet.de/bgb/__551.html'
        }
    ],
    modernization: [
        {
            type: 'law',
            reference: '§ 555b BGB',
            title: 'Duldung von Erhaltungs- und Modernisierungsmaßnahmen',
            url: 'https://www.gesetze-im-internet.de/bgb/__555b.html'
        },
        {
            type: 'law',
            reference: '§ 559 BGB',
            title: 'Mieterhöhung nach Modernisierung',
            url: 'https://www.gesetze-im-internet.de/bgb/__559.html'
        }
    ],
    other: []
};

export const TEMPLATE_MAP: Record<LegalCategory, TemplateReference[]> = {
    rent_reduction: [
        {
            templateId: 'rent_reduction_notice',
            templateName: 'Mietminderungsanzeige',
            description: 'Anzeige eines Mangels mit Fristsetzung zur Beseitigung',
            applicableFor: ['Mängel', 'Heizungsausfall', 'Schimmel', 'Lärmbelästigung']
        },
        {
            templateId: 'rent_reduction_letter',
            templateName: 'Mietminderungsschreiben',
            description: 'Ankündigung der Mietminderung nach erfolgloser Fristsetzung',
            applicableFor: ['Mietminderung']
        }
    ],
    termination: [
        {
            templateId: 'termination_objection',
            templateName: 'Widerspruch gegen Kündigung',
            description: 'Widerspruch gegen eine Kündigung wegen Härtefall',
            applicableFor: ['Kündigung', 'Härtefall']
        }
    ],
    utility_costs: [
        {
            templateId: 'utility_objection',
            templateName: 'Widerspruch Nebenkostenabrechnung',
            description: 'Widerspruch gegen fehlerhafte Nebenkostenabrechnung',
            applicableFor: ['Nebenkostenabrechnung', 'Fehler']
        },
        {
            templateId: 'document_request',
            templateName: 'Belegeinsicht fordern',
            description: 'Anforderung der Belegeinsicht zur Nebenkostenabrechnung',
            applicableFor: ['Nebenkostenabrechnung']
        }
    ],
    rent_increase: [
        {
            templateId: 'rent_increase_objection',
            templateName: 'Widerspruch Mieterhöhung',
            description: 'Widerspruch gegen ungerechtfertigte Mieterhöhung',
            applicableFor: ['Mieterhöhung']
        }
    ],
    deposit: [
        {
            templateId: 'deposit_return_request',
            templateName: 'Kautionsrückforderung',
            description: 'Rückforderung der Kaution nach Auszug',
            applicableFor: ['Kaution', 'Auszug']
        }
    ],
    defects: [
        {
            templateId: 'defect_notice',
            templateName: 'Mängelanzeige',
            description: 'Anzeige eines Mangels mit Fristsetzung',
            applicableFor: ['Mängel']
        }
    ],
    modernization: [
        {
            templateId: 'modernization_objection',
            templateName: 'Widerspruch Modernisierung',
            description: 'Widerspruch gegen Modernisierungsmaßnahmen',
            applicableFor: ['Modernisierung']
        }
    ],
    other: []
};

export const ACTION_RECOMMENDATIONS_MAP: Record<LegalCategory, ActionRecommendation[]> = {
    rent_reduction: [
        {
            action: 'Mangel dokumentieren',
            priority: 'high',
            details: 'Erstellen Sie Fotos und notieren Sie das Datum des Auftretens',
            legalBasis: '§ 536 BGB'
        },
        {
            action: 'Vermieter schriftlich informieren',
            priority: 'high',
            deadline: 'Sofort',
            details: 'Setzen Sie eine angemessene Frist zur Mängelbeseitigung (in der Regel 14 Tage)',
            legalBasis: '§ 536c BGB'
        },
        {
            action: 'Mietminderung berechnen',
            priority: 'medium',
            details: 'Orientieren Sie sich an der Mietminderungstabelle für vergleichbare Fälle'
        },
        {
            action: 'Miete mindern',
            priority: 'medium',
            deadline: 'Nach Ablauf der Frist',
            details: 'Mindern Sie die Miete erst nach erfolgloser Fristsetzung',
            legalBasis: '§ 536 BGB Abs. 1'
        }
    ],
    termination: [
        {
            action: 'Kündigung prüfen lassen',
            priority: 'high',
            deadline: 'Sofort',
            details: 'Lassen Sie die Kündigung umgehend von einem Fachanwalt prüfen',
            legalBasis: '§ 573 BGB, § 543 BGB'
        },
        {
            action: 'Kündigungsfristen prüfen',
            priority: 'high',
            details: 'Prüfen Sie, ob die gesetzlichen Kündigungsfristen eingehalten wurden'
        },
        {
            action: 'Widerspruch erwägen',
            priority: 'high',
            deadline: '2 Monate vor Kündigungstermin',
            details: 'Bei Härtefällen können Sie der Kündigung widersprechen',
            legalBasis: '§ 574 BGB'
        }
    ],
    utility_costs: [
        {
            action: 'Abrechnung prüfen',
            priority: 'medium',
            details: 'Prüfen Sie die Abrechnung auf Vollständigkeit und Richtigkeit',
            legalBasis: '§ 556 BGB'
        },
        {
            action: 'Belegeinsicht fordern',
            priority: 'medium',
            deadline: '12 Monate nach Zugang',
            details: 'Sie haben das Recht, die Belege einzusehen',
            legalBasis: '§ 259 BGB'
        },
        {
            action: 'Widerspruch einlegen',
            priority: 'medium',
            deadline: '12 Monate nach Zugang',
            details: 'Bei Fehlern widersprechen Sie schriftlich innerhalb von 12 Monaten',
            legalBasis: '§ 556 BGB Abs. 3'
        }
    ],
    rent_increase: [
        {
            action: 'Mieterhöhung prüfen',
            priority: 'medium',
            details: 'Prüfen Sie die Begründung und den Vergleich mit dem Mietspiegel',
            legalBasis: '§ 558 BGB'
        },
        {
            action: 'Mietspiegel vergleichen',
            priority: 'medium',
            details: 'Vergleichen Sie die geforderte Miete mit dem örtlichen Mietspiegel'
        },
        {
            action: 'Zustimmung oder Ablehnung',
            priority: 'medium',
            deadline: '2 Monate',
            details: 'Sie haben 2 Monate Zeit für Ihre Reaktion',
            legalBasis: '§ 558b BGB'
        }
    ],
    deposit: [
        {
            action: 'Kaution schriftlich zurückfordern',
            priority: 'medium',
            details: 'Fordern Sie die Kaution nach Auszug schriftlich zurück'
        },
        {
            action: 'Frist setzen',
            priority: 'medium',
            deadline: '6 Monate nach Auszug',
            details: 'Der Vermieter hat 6 Monate Zeit für die Abrechnung',
            legalBasis: '§ 551 BGB'
        }
    ],
    modernization: [], // Added empty array for missing keys to satisfy Record type if needed, though 'other' covers it usually. Added explicit modernization based on switch case default falling through or being empty? In switch case it wasn't there explicitly for modernization actions?
    // Wait, looking at switch case in original file:
    // case 'rent_reduction': ...
    // case 'termination': ...
    // case 'utility_costs': ...
    // case 'rent_increase': ...
    // case 'deposit': ...
    // default: ...
    // 'modernization' and 'defects' (if not rent_reduction) fell into default.
    // I should add them to the map or handle default in the code.
    // Let's add them as empty or with default actions in the map, or keep the default logic in the code.
    // Better to put specific actions if known, or generic ones.
    // For now I will map what was explicitly there. 'modernization' and 'defects' were not in the switch case explicitly (except defects might be rent_reduction).
    // Actually 'defects' key exists in other maps.
    // I will add 'modernization', 'defects', 'other' with the default recommendation.
    defects: [
        {
            action: 'Rechtliche Beratung einholen',
            priority: 'medium',
            details: 'Konsultieren Sie einen Fachanwalt für Mietrecht'
        }
    ],
    other: [
        {
            action: 'Rechtliche Beratung einholen',
            priority: 'medium',
            details: 'Konsultieren Sie einen Fachanwalt für Mietrecht'
        }
    ]
};

// Fix for modernization and defects to match default behavior if they were falling through
ACTION_RECOMMENDATIONS_MAP.modernization = ACTION_RECOMMENDATIONS_MAP.other;
