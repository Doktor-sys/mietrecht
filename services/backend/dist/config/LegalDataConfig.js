"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTION_RECOMMENDATIONS_MAP = exports.TEMPLATE_MAP = exports.MANDATORY_REFERENCES = exports.CATEGORY_KEYWORDS = exports.CATEGORY_NAMES = void 0;
exports.CATEGORY_NAMES = {
    rent_reduction: 'Mietminderung',
    termination: 'Kündigung',
    utility_costs: 'Nebenkosten',
    rent_increase: 'Mieterhöhung',
    defects: 'Mängel',
    deposit: 'Kaution',
    modernization: 'Modernisierung',
    other: 'Allgemeine Anfrage',
    // Arbeitsrecht-Kategorien
    employment_contract: 'Arbeitsvertrag',
    termination_protection: 'Kündigungsschutz',
    severance: 'Abfindung',
    vacation: 'Urlaub',
    wage_continuation: 'Lohnfortzahlung',
    discrimination: 'Diskriminierung',
    working_time: 'Arbeitszeit',
    subletting: 'Untervermietung',
    ownership_change: 'Eigentümerwechsel',
    handover: 'Wohnungsübergabe',
    landlord_questions: 'Vermieterfragen',
};
exports.CATEGORY_KEYWORDS = {
    rent_reduction: ['Mietminderung', 'Mangel', '§ 536 BGB', 'Gewährleistung'],
    termination: ['Kündigung', '§ 573 BGB', '§ 543 BGB', 'Kündigungsschutz'],
    utility_costs: ['Nebenkosten', 'Betriebskosten', '§ 556 BGB', 'Abrechnung'],
    rent_increase: ['Mieterhöhung', '§ 558 BGB', 'Mietspiegel', 'Kappungsgrenze'],
    defects: ['Mangel', 'Gewährleistung', '§ 536 BGB', 'Instandhaltung'],
    deposit: ['Kaution', 'Sicherheit', '§ 551 BGB', 'Rückzahlung'],
    modernization: ['Modernisierung', '§ 555b BGB', 'Duldungspflicht'],
    other: ['Mietrecht', 'BGB'],
    // Arbeitsrecht-Schlüsselwörter
    employment_contract: ['Arbeitsvertrag', 'Vertragsinhalte', '§ 2 Abs. 1 NachwG', 'Vertragsbedingungen'],
    termination_protection: ['Kündigungsschutz', '§ 1 KSchG', 'Kündigung', 'Härtefall'],
    severance: ['Abfindung', '§ 1a KSchG', 'Einvernehmliche Beendigung'],
    vacation: ['Urlaub', '§ 3 BUrlG', 'Jahresurlaub', 'Resturlaub'],
    wage_continuation: ['Lohnfortzahlung', '§ 3 EFZG', 'Krankheit', 'Arbeitsunfähigkeit'],
    discrimination: ['Diskriminierung', '§ 1 AGG', 'Benachteiligung', 'Gleichbehandlung'],
    working_time: ['Arbeitszeit', '§ 3 ArbZG', 'Überstunden', 'Ruhezeit'],
    subletting: ['Untervermietung', 'Untermieter', '§ 540 BGB', '§ 553 BGB', 'Erlaubnis', 'Dritter'],
    ownership_change: ['Eigentümerwechsel', 'Kauf bricht nicht Miete', '§ 566 BGB', 'Erwerber', 'Verkauf'],
    handover: ['Wohnungsübergabe', 'Protokoll', '§ 546 BGB', 'Schlüssel', 'Rückgabe'],
    landlord_questions: ['Vermieterfragen', 'Selbstauskunft', 'Privatsphäre', 'Erlaubte Fragen', 'AGG', 'DSGVO']
};
exports.MANDATORY_REFERENCES = {
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
    other: [],
    // Arbeitsrecht-Referenzen
    employment_contract: [
        {
            type: 'law',
            reference: '§ 2 Abs. 1 NachwG',
            title: 'Inhalt des Arbeitsvertrags',
            url: 'https://www.gesetze-im-internet.de/nachwg/__2.html'
        }
    ],
    termination_protection: [
        {
            type: 'law',
            reference: '§ 1 KSchG',
            title: 'Anwendungsbereich des Kündigungsschutzgesetzes',
            url: 'https://www.gesetze-im-internet.de/kschg/__1.html'
        },
        {
            type: 'law',
            reference: '§ 4 KSchG',
            title: 'Verbot der Kündigung ohne wichtigen Grund',
            url: 'https://www.gesetze-im-internet.de/kschg/__4.html'
        }
    ],
    severance: [
        {
            type: 'law',
            reference: '§ 1a KSchG',
            title: 'Einvernehmliche Beendigung des Arbeitsvertrags',
            url: 'https://www.gesetze-im-internet.de/kschg/__1a.html'
        }
    ],
    vacation: [
        {
            type: 'law',
            reference: '§ 3 BUrlG',
            title: 'Erwerb und Höhe des Urlaubsanspruchs',
            url: 'https://www.gesetze-im-internet.de/burlg/__3.html'
        }
    ],
    wage_continuation: [
        {
            type: 'law',
            reference: '§ 3 EFZG',
            title: 'Fortzahlung des Arbeitsentgelts bei Krankheit',
            url: 'https://www.gesetze-im-internet.de/efzg/__3.html'
        }
    ],
    discrimination: [
        {
            type: 'law',
            reference: '§ 1 AGG',
            title: 'Allgemeines Gleichbehandlungsgesetz',
            url: 'https://www.gesetze-im-internet.de/agg/__1.html'
        }
    ],
    working_time: [
        {
            type: 'law',
            reference: '§ 3 ArbZG',
            title: 'Tägliche Arbeitszeit',
            url: 'https://www.gesetze-im-internet.de/arbzg/__3.html'
        }
    ],
    subletting: [
        {
            type: 'law',
            reference: '§ 540 BGB',
            title: 'Gebrauchsüberlassung an Dritte',
            url: 'https://www.gesetze-im-internet.de/bgb/__540.html'
        },
        {
            type: 'law',
            reference: '§ 553 BGB',
            title: 'Gestattung der Untervermietung',
            url: 'https://www.gesetze-im-internet.de/bgb/__553.html'
        }
    ],
    ownership_change: [
        {
            type: 'law',
            reference: '§ 566 BGB',
            title: 'Kauf bricht nicht Miete',
            url: 'https://www.gesetze-im-internet.de/bgb/__566.html'
        },
        {
            type: 'law',
            reference: '§ 566a BGB',
            title: 'Mietkaution bei Eigentümerwechsel',
            url: 'https://www.gesetze-im-internet.de/bgb/__566a.html'
        }
    ],
    handover: [
        {
            type: 'law',
            reference: '§ 546 BGB',
            title: 'Rückgabepflicht des Mieters',
            url: 'https://www.gesetze-im-internet.de/bgb/__546.html'
        },
        {
            type: 'law',
            reference: '§ 548 BGB',
            title: 'Verjährung der Ersatzansprüche',
            url: 'https://www.gesetze-im-internet.de/bgb/__548.html'
        }
    ],
    landlord_questions: [
        {
            type: 'law',
            reference: '§ 242 BGB',
            title: 'Leistung nach Treu und Glauben',
            url: 'https://www.gesetze-im-internet.de/bgb/__242.html'
        },
        {
            type: 'law',
            reference: 'AGG',
            title: 'Allgemeines Gleichbehandlungsgesetz',
            url: 'https://www.gesetze-im-internet.de/agg/'
        }
    ]
};
exports.TEMPLATE_MAP = {
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
    other: [],
    // Arbeitsrecht-Vorlagen
    employment_contract: [
        {
            templateId: 'contract_review_request',
            templateName: 'Vertragsprüfung anfordern',
            description: 'Anfrage zur Prüfung von Arbeitsvertragsbedingungen',
            applicableFor: ['Arbeitsvertrag', 'Vertragsbedingungen']
        }
    ],
    termination_protection: [
        {
            templateId: 'termination_objection_employment',
            templateName: 'Widerspruch gegen Kündigung',
            description: 'Widerspruch gegen eine arbeitsrechtliche Kündigung',
            applicableFor: ['Kündigung', 'Härtefall']
        }
    ],
    severance: [
        {
            templateId: 'severance_agreement',
            templateName: 'Abfindungsvereinbarung',
            description: 'Vorlage für eine einvernehmliche Abfindungsvereinbarung',
            applicableFor: ['Abfindung', 'Einvernehmliche Beendigung']
        }
    ],
    vacation: [
        {
            templateId: 'vacation_request',
            templateName: 'Urlaubsantrag',
            description: 'Formeller Antrag auf Erholungsurlaub',
            applicableFor: ['Urlaub', 'Jahresurlaub']
        }
    ],
    wage_continuation: [
        {
            templateId: 'sick_leave_notification',
            templateName: 'Krankheitsmeldung',
            description: 'Formelle Meldung einer Arbeitsunfähigkeit',
            applicableFor: ['Krankheit', 'Arbeitsunfähigkeit']
        }
    ],
    discrimination: [
        {
            templateId: 'discrimination_complaint',
            templateName: 'Diskriminierungsbeschwerde',
            description: 'Beschwerde über diskriminierende Behandlung am Arbeitsplatz',
            applicableFor: ['Diskriminierung', 'Benachteiligung']
        }
    ],
    working_time: [
        {
            templateId: 'overtime_claim',
            templateName: 'Überstundenanspruch',
            description: 'Anspruch auf Überstundenvergütung oder Freizeitausgleich',
            applicableFor: ['Überstunden', 'Arbeitszeit']
        }
    ],
    subletting: [],
    ownership_change: [],
    handover: [],
    landlord_questions: []
};
exports.ACTION_RECOMMENDATIONS_MAP = {
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
    defects: [
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
        }
    ],
    modernization: [
        {
            action: 'Modernisierungsmaßnahme prüfen',
            priority: 'medium',
            details: 'Prüfen Sie, ob die Modernisierung genehmigungspflichtig ist und ordnungsgemäß angekündigt wurde',
            legalBasis: '§ 555b BGB'
        },
        {
            action: 'Kostenbeteiligung prüfen',
            priority: 'medium',
            details: 'Prüfen Sie, ob die Kostenbeteiligung nach § 559 BGB gerechtfertigt ist',
            legalBasis: '§ 559 BGB'
        },
        {
            action: 'Widerspruch erwägen',
            priority: 'medium',
            deadline: '4 Wochen nach Ankündigung',
            details: 'Sie haben das Recht, innerhalb von 4 Wochen schriftlich Widerspruch einzulegen',
            legalBasis: '§ 555d BGB'
        }
    ],
    other: [
        {
            action: 'Rechtliche Beratung einholen',
            priority: 'medium',
            details: 'Konsultieren Sie einen Fachanwalt für Mietrecht'
        }
    ],
    // Arbeitsrecht-Empfehlungen
    employment_contract: [
        {
            action: 'Vertragsbedingungen prüfen',
            priority: 'high',
            details: 'Lassen Sie Ihren Arbeitsvertrag von einem Fachanwalt prüfen',
            legalBasis: '§ 2 Abs. 1 NachwG'
        },
        {
            action: 'Vertragskopie aufbewahren',
            priority: 'medium',
            details: 'Bewahren Sie eine Kopie Ihres Arbeitsvertrags an sicherer Stelle auf'
        }
    ],
    termination_protection: [
        {
            action: 'Kündigung prüfen lassen',
            priority: 'high',
            deadline: 'Sofort',
            details: 'Lassen Sie die Kündigung umgehend von einem Fachanwalt prüfen',
            legalBasis: '§ 1 KSchG, § 4 KSchG'
        },
        {
            action: 'Wichtigen Grund prüfen',
            priority: 'high',
            details: 'Prüfen Sie, ob ein wichtiger Grund für die Kündigung vorliegt'
        },
        {
            action: 'Widerspruch erwägen',
            priority: 'high',
            deadline: '2 Wochen nach Zugang',
            details: 'Bei Härtefällen können Sie der Kündigung widersprechen',
            legalBasis: '§ 4 KSchG'
        }
    ],
    severance: [
        {
            action: 'Abfindung berechnen',
            priority: 'medium',
            details: 'Berechnen Sie die angemessene Höhe der Abfindung',
            legalBasis: '§ 1a KSchG'
        },
        {
            action: 'Einvernehmen anstreben',
            priority: 'medium',
            details: 'Streben Sie eine einvernehmliche Beendigung mit Abfindung an'
        }
    ],
    vacation: [
        {
            action: 'Urlaubsanspruch berechnen',
            priority: 'medium',
            details: 'Berechnen Sie Ihren gesetzlichen Urlaubsanspruch',
            legalBasis: '§ 3 BUrlG'
        },
        {
            action: 'Urlaub planen',
            priority: 'medium',
            details: 'Planen Sie Ihren Urlaub rechtzeitig mit Ihrem Arbeitgeber ab'
        }
    ],
    wage_continuation: [
        {
            action: 'Krankmeldung abgeben',
            priority: 'high',
            deadline: 'Sofort',
            details: 'Geben Sie Ihre Krankmeldung ordnungsgemäß ab',
            legalBasis: '§ 3 EFZG'
        },
        {
            action: 'Arbeitsunfähigkeit dokumentieren',
            priority: 'high',
            details: 'Dokumentieren Sie Ihre Arbeitsunfähigkeit durch ärztliche Bescheinigungen'
        }
    ],
    discrimination: [
        {
            action: 'Diskriminierung dokumentieren',
            priority: 'high',
            details: 'Dokumentieren Sie die diskriminierenden Vorfälle genau',
            legalBasis: '§ 1 AGG'
        },
        {
            action: 'Beschwerde einreichen',
            priority: 'high',
            deadline: 'Sofort',
            details: 'Reichen Sie eine formelle Beschwerde beim Arbeitgeber ein'
        }
    ],
    working_time: [
        {
            action: 'Arbeitszeiten dokumentieren',
            priority: 'medium',
            details: 'Dokumentieren Sie Ihre tatsächlichen Arbeitszeiten',
            legalBasis: '§ 3 ArbZG'
        },
        {
            action: 'Überstunden abrechnen',
            priority: 'medium',
            details: 'Fordern Sie die Abrechnung von geleisteten Überstunden'
        }
    ],
    subletting: [
        {
            action: 'Berechtigtes Interesse prüfen',
            priority: 'high',
            details: 'Prüfen Sie, ob Gründe (z.B. finanziell, persönlich) für eine Untervermietung vorliegen',
            legalBasis: '§ 553 BGB'
        },
        {
            action: 'Schriftliche Erlaubnis einholen',
            priority: 'high',
            details: 'Holen Sie vor der Überlassung zwingend die schriftliche Zustimmung des Vermieters ein',
            legalBasis: '§ 540 BGB'
        }
    ],
    ownership_change: [
        {
            action: 'Eigentümernachweis fordern',
            priority: 'medium',
            details: 'Zahlen Sie die Miete erst an den neuen Eigentümer, wenn eine formelle Mitteilung oder ein Grundbuchauszug vorliegt',
            legalBasis: '§ 566 BGB'
        }
    ],
    handover: [
        {
            action: 'Übergabeprotokoll erstellen',
            priority: 'high',
            details: 'Dokumentieren Sie den Zustand der Wohnung und die Zählerstände penibel'
        },
        {
            action: 'Alle Schlüssel zurückgeben',
            priority: 'high',
            details: 'Geben Sie sämtliche Schlüssel (auch nachgemachte) gegen Quittung zurück',
            legalBasis: '§ 546 BGB'
        }
    ],
    landlord_questions: [
        {
            action: 'Unzulässige Fragen identifizieren',
            priority: 'medium',
            details: 'Prüfen Sie, ob Fragen zu Religion, Politik oder Familienplanung gestellt wurden.',
            legalBasis: 'Art. 1, 2 GG, AGG'
        },
        {
            action: 'Notwehrrecht der Lüge anwenden',
            priority: 'low',
            details: 'Bei unzulässigen Fragen dürfen Sie die Unwahrheit sagen, ohne rechtliche Konsequenzen zu befürchten.'
        }
    ]
};
// Fix for modernization and defects to match default behavior if they were falling through
exports.ACTION_RECOMMENDATIONS_MAP.modernization = exports.ACTION_RECOMMENDATIONS_MAP.other;
