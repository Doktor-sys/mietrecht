let currentSelectedTopic = '';
let paypalAuthorized = false;
let currentPaymentMethod = '';
let conversationHistory = []; // Needed for persistence simulation
let lastAnalysisData = null;
let lastTopic = '';

const TOPICS_CONFIG = [
    { id: 'Kündigung', label: 'Kündigungsschutz', icon: 'fa-gavel', color: '#1976d2' },
    { id: 'Mietminderung', label: 'Mietminderung', icon: 'fa-house-crack', color: '#2e7d32' },
    { id: 'Nebenkosten', label: 'Nebenkosten', icon: 'fa-receipt', color: '#d32f2f' },
    { id: 'Kaution', label: 'Kaution', icon: 'fa-vault', color: '#ed6c02' },
    { id: 'Mietvertrag', label: 'Mietvertrag', icon: 'fa-file-lines', color: '#9c27b0' },
    { id: 'Renovierung', label: 'Renovierung', icon: 'fa-paint-roller', color: '#0288d1' },
    { id: 'Mieterhöhung', label: 'Mieterhöhung', icon: 'fa-chart-line', color: '#c62828' },
    { id: 'Hausordnung', label: 'Hausordnung', icon: 'fa-list-check', color: '#388e3c' },
    { id: 'Lärm', label: 'Lärm', icon: 'fa-volume-high', color: '#1976d2' }
];

const LAWYERS_DATA = [
    { id: 1, name: 'Dr. Hans-Werner Meyer', title: 'Fachanwalt für Miet- & WEG-Recht', exp: '18 Jahre', rating: '4.9', reviews: 142, focus: ['Kaution', 'Kündigung', 'Renovierung'], location: 'Berlin', address: 'Friedrichstraße 12, 10117 Berlin', img: '/static/images/lawyer_meyer.png' },
    { id: 2, name: 'Sabine Schulze', title: 'Rechtsanwältin für Immobilienrecht', exp: '12 Jahre', rating: '4.8', reviews: 98, focus: ['Mietminderung', 'Nebenkosten', 'Wohnfläche'], location: 'Hamburg', address: 'Neuer Wall 34, 20354 Hamburg', img: '/static/images/lawyer_schulze.png' },
    { id: 3, name: 'Markus Weber', title: 'Fachanwalt für Wohnungsrecht', exp: '15 Jahre', rating: '5.0', reviews: 210, focus: ['Lärm', 'Tierhaltung', 'Hausordnung', 'Kündigung'], location: 'München', address: 'Maximilianstraße 1, 80539 München', img: '/static/images/lawyer_weber.png' },
    { id: 4, name: 'Elena Petrova', title: 'Expertin für gewerbliches Mietrecht', exp: '10 Jahre', rating: '4.7', reviews: 76, focus: ['Mietvertrag', 'Modernisierung', 'Wasserschaden'], location: 'Köln', address: 'Schildergasse 8, 50667 Köln', img: '/static/images/lawyer_petrova.png' },
    { id: 5, name: 'Christian Wagner', title: 'Fachanwalt für Bau- & Architektenrecht', exp: '22 Jahre', rating: '4.9', reviews: 185, focus: ['Modernisierung', 'Mängel', 'Renovierung'], location: 'Frankfurt', address: 'Zeil 100, 60313 Frankfurt', img: '/static/images/lawyer_wagner.png' },
    { id: 6, name: 'Julia Hoffmann', title: 'Rechtsanwältin für Mietrecht', exp: '8 Jahre', rating: '4.6', reviews: 54, focus: ['Kaution', 'Hausordnung', 'Tierhaltung'], location: 'Stuttgart', address: 'Königstraße 2, 70173 Stuttgart', img: '/static/images/lawyer_hoffmann.png' },
    { id: 7, name: 'Thomas Müller', title: 'Fachanwalt für Erbrecht & Immobilien', exp: '25 Jahre', rating: '5.0', reviews: 312, focus: ['Mietvertrag', 'Wohnrecht', 'Räumung'], location: 'Düsseldorf', address: 'Königsallee 10, 40212 Düsseldorf', img: 'https://ui-avatars.com/api/?name=Thomas+Mueller&background=0288d1&color=fff' },
    { id: 8, name: 'Andreas Bauer', title: 'Spezialist für Mieterschutz', exp: '14 Jahre', rating: '4.8', reviews: 126, focus: ['Mietminderung', 'Nebenkosten', 'Kündigung'], location: 'Leipzig', address: 'Grimmaische Str. 1, 04109 Leipzig', img: 'https://ui-avatars.com/api/?name=Andreas+Bauer&background=2e7d32&color=fff' },
    { id: 9, name: 'Melanie Schmidt', title: 'Rechtsanwältin für privates Mietrecht', exp: '11 Jahre', rating: '4.7', reviews: 89, focus: ['Lärm', 'Tierhaltung', 'Wohnfläche'], location: 'Bremen', address: 'Sögestraße 5, 28195 Bremen', img: 'https://ui-avatars.com/api/?name=Melanie+Schmidt&background=7b1fa2&color=fff' },
    { id: 10, name: 'Stefan Klein', title: 'Experte für Immobilienverwaltung', exp: '9 Jahre', rating: '4.5', reviews: 42, focus: ['Nebenkosten', 'Modernisierung', 'Kaution'], location: 'Hannover', address: 'Georgstraße 1, 30159 Hannover', img: 'https://ui-avatars.com/api/?name=Stefan+Klein&background=ed6c02&color=fff' }
];

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('topics-grid');
    if (grid) {
        TOPICS_CONFIG.forEach(topic => {
            const card = document.createElement('div');
            card.className = 'topic-card glass-card p-6 rounded-3xl border border-transparent hover:border-blue-200 cursor-pointer text-center transition-premium group bg-white';
            card.onclick = () => loadTopic(topic.id);
            card.innerHTML = `
                <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-50 transition-premium" style="color: ${topic.color}">
                    <i class="fas ${topic.icon} text-2xl group-hover:scale-110 transition-premium"></i>
                </div>
                <span class="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">${topic.label}</span>
            `;
            grid.appendChild(card);
        });
    }

    const dateElem = document.getElementById('current-date');
    if (dateElem) dateElem.innerText = new Date().toLocaleDateString('de-DE');
});

async function loadTopic(id) {
    currentSelectedTopic = id;
    lastTopic = id;
    const results = document.getElementById('results-content');
    results.innerHTML = '<div class="animate-pulse flex flex-col items-center py-6"><div class="w-8 h-8 bg-blue-100 rounded-full mb-2"></div><div class="h-2 w-24 bg-blue-100 rounded"></div></div>';

    try {
        const res = await fetch(`/api/topic/${id}`);
        const data = await res.json();
        lastAnalysisData = data;
        displayResults(id, data);
    } catch (err) {
        results.innerHTML = '<p class="text-red-500">Fehler beim Laden.</p>';
    }
}

function displayResults(topic, data) {
    const results = document.getElementById('results-content');

    let kiText = data['KI-Einschätzung'] || data['KI-Einschaetzung'] || data['ki_evaluation'] || data['summary'];

    if (data.error) {
        kiText = `Fehler: ${data.error}`;
    }

    if (!kiText) {
        results.innerHTML = '<p class="text-slate-500">Keine KI-Einschätzung verfügbar.</p>';
    } else {
        results.innerHTML = `
            <div class="space-y-8 fade-in">
                <div class="bg-blue-50/50 p-8 rounded-[32px] border border-blue-100/50 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl group-hover:bg-blue-300/30 transition-premium"></div>
                    <h3 class="flex items-center space-x-3 mb-6">
                        <div class="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-blue-500/20">
                            <i class="fas fa-brain"></i>
                        </div>
                        <span class="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] leading-none">KI-Einschätzung</span>
                    </h3>
                    <p class="text-slate-700 leading-relaxed font-medium text-lg">${kiText}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="glass-card p-10 rounded-[40px] border-l-4 border-l-red-500 bg-white/40">
                        <h4 class="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center">
                            <i class="fas fa-triangle-exclamation mr-2"></i> Risiko-Profil
                        </h4>
                        <p id="analysis-risk" class="text-slate-900 font-bold text-base leading-snug">${data['Professionelle Analyse'] || 'Individuelle Prüfung erforderlich.'}</p>
                    </div>
                    <div class="glass-card p-10 rounded-[40px] border-l-4 border-l-emerald-500 bg-white/40">
                        <h4 class="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center">
                            <i class="fas fa-lightbulb mr-2"></i> Empfehlung
                        </h4>
                        <p id="analysis-recommendation" class="text-slate-900 font-bold text-base leading-snug">${data['Gerichtsurteile'] || 'Fachanwalt konsultieren.'}</p>
                    </div>
                </div>

                <button onclick="goToStep(3)" class="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600 hover:scale-[1.02] shadow-2xl transition-premium active:scale-95 flex items-center justify-center space-x-3">
                    <span>Rechtsbeistand anfordern</span>
                    <i class="fas fa-arrow-right text-[10px]"></i>
                </button>
            </div>
        `;
    }
}

function showLoading(text) {
    document.getElementById('loading-overlay').style.display = 'flex';
    document.getElementById('loading-text').innerText = text || 'Verarbeite...';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

async function performExpertMatching() {
    // Validation
    const vorname = document.getElementById('user-vorname');
    const nachname = document.getElementById('user-nachname');
    const email = document.getElementById('user-email');
    const phone = document.getElementById('user-phone');
    const plz = document.getElementById('user-plz');
    const ort = document.getElementById('user-ort');
    const btn = document.querySelector('#view-step-3 button');

    // Reset errors
    [vorname, nachname, email, phone, plz, ort].forEach(el => el.classList.remove('input-error'));
    btn.classList.remove('shake');

    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const plzRegex = /^\d{5}$/;

    if (!vorname.value.trim()) { vorname.classList.add('input-error'); isValid = false; }
    if (!nachname.value.trim()) { nachname.classList.add('input-error'); isValid = false; }
    if (!emailRegex.test(email.value.trim())) { email.classList.add('input-error'); isValid = false; }
    if (!phone.value.trim()) { phone.classList.add('input-error'); isValid = false; }
    if (!plzRegex.test(plz.value.trim())) { plz.classList.add('input-error'); isValid = false; }
    if (!ort.value.trim()) { ort.classList.add('input-error'); isValid = false; }

    if (!isValid) {
        btn.classList.add('shake');
        return;
    }

    showLoading('Suche passende Experten...');
    setTimeout(() => {
        hideLoading();
        renderLawyerList();
        goToStep(4);
    }, 2000);
}

function renderLawyerList() {
    const list = document.getElementById('lawyer-list');
    list.innerHTML = '';

    LAWYERS_DATA.forEach(lawyer => {
        const card = document.createElement('div');
        card.className = 'glass-card p-10 rounded-[50px] border-2 border-transparent hover:border-blue-600 transition-premium cursor-pointer group hover:-translate-y-2 bg-white/50 relative overflow-hidden';
        card.onclick = () => selectLawyer(lawyer);
        card.innerHTML = `
            <div class="absolute -right-12 -top-12 w-48 h-48 bg-blue-50/30 rounded-full blur-3xl group-hover:bg-blue-100/40 transition-premium"></div>
            <div class="flex items-start space-x-8 relative">
                <div class="relative">
                    <img src="${lawyer.img}" class="w-24 h-24 rounded-3xl object-cover shadow-xl grayscale group-hover:grayscale-0 transition-premium ring-4 ring-white">
                    <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full pulse-soft flex items-center justify-center text-[8px] text-white font-black">AI</div>
                </div>
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                        <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">${lawyer.location}</span>
                        <div class="flex items-center text-amber-500 text-xs">
                            <i class="fas fa-star mr-1"></i>
                            <span class="font-black text-slate-900">${lawyer.rating}</span>
                        </div>
                    </div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tight mb-1">${lawyer.name}</h3>
                    <p class="text-slate-500 font-bold text-sm mb-6">${lawyer.title}</p>
                    
                    <div class="flex flex-wrap gap-2 mb-8">
                        ${lawyer.focus.map(f => `<span class="px-4 py-2 bg-slate-50 text-slate-400 text-[9px] font-black rounded-xl uppercase tracking-widest border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-premium">${f}</span>`).join('')}
                    </div>

                    <p class="text-slate-400 font-medium text-xs flex items-center px-1">
                        <i class="fas fa-clock mr-2 opacity-50"></i>
                        Verfügbar: <span class="text-slate-900 font-black ml-1">Heute</span>
                    </p>
                </div>
                <div class="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-premium shadow-inner">
                    <i class="fas fa-chevron-right text-xl group-hover:scale-110 transition-premium"></i>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

let currentLawyer = null;
function selectLawyer(lawyer) {
    currentLawyer = lawyer;
    document.querySelectorAll('#lawyer-list .glass-card').forEach(el => el.classList.remove('border-blue-600', 'bg-blue-50/20'));
    // Find card that reflects lawyer
    // In this mock, we just proceed
    goToStep(5);
}

let selectedConsultationType = '';
let currentPrice = 0;
function selectConsultation(type, price) {
    selectedConsultationType = type;
    currentPrice = price;
    document.getElementById('final-price').innerText = price + ',00 €';
    document.getElementById('final-summary-price').innerText = price + ',00 €';
    document.getElementById('summary-type').innerText = type;

    // Update Sidebar Lawyer Info
    if (currentLawyer) {
        document.getElementById('sidebar-lawyer-name').innerText = currentLawyer.name;
        document.getElementById('step5-lawyer-title').innerText = currentLawyer.title;
        document.getElementById('step5-lawyer-address-sidebar').innerText = currentLawyer.address;
    }

    // Sync data from Step 3
    const vorname = document.getElementById('user-vorname').value || '';
    const nachname = document.getElementById('user-nachname').value || '';
    const strasse = document.getElementById('user-strasse').value || '';
    const plz = document.getElementById('user-plz').value || '';
    const ort = document.getElementById('user-ort').value || '';
    const phone = document.getElementById('user-phone').value || '';
    const email = document.getElementById('user-email').value || '';

    document.getElementById('display-user-name').innerText = `${vorname} ${nachname}`.trim() || 'Nicht angegeben';
    document.getElementById('display-user-address').innerText = strasse ? `${strasse}, ${plz} ${ort}` : 'Nicht angegeben';
    document.getElementById('display-user-phone').innerText = phone || 'Nicht angegeben';
    document.getElementById('display-user-email').innerText = email || 'Nicht angegeben';

    renderCalendar();
    goToStep(5);
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '<span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>';

    const today = new Date();
    const holidays = ["1.1."]; // Mock holiday list

    // Add padding for correct day alignment (Mo=1, Di=2 ... So=0)
    const padding = (today.getDay() + 6) % 7;
    for (let p = 0; p < padding; p++) {
        const span = document.createElement('span');
        grid.appendChild(span);
    }

    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        const dayNum = d.getDate();
        const monthNum = d.getMonth() + 1;
        const dateStr = dayNum + '.' + monthNum + '.';

        const fullDateStr = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
        const isoDateStr = d.toISOString().split('T')[0];

        const isSunday = d.getDay() === 0;
        const isSaturday = d.getDay() === 6;
        const isHoliday = holidays.includes(dateStr);
        const isInactive = isSunday || isHoliday;

        const btn = document.createElement('button');
        btn.innerText = dayNum;
        btn.setAttribute('data-full-date', fullDateStr);
        btn.setAttribute('data-iso-date', isoDateStr);

        if (isInactive) btn.disabled = true;

        const updateStyles = (active) => {
            let classes = "p-4 rounded-2xl border transition-premium text-sm font-black ";
            if (isInactive) {
                classes += "bg-slate-50 text-slate-200 border-slate-50 cursor-not-allowed opacity-30";
            } else if (active) {
                classes += "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20 scale-105";
            } else if (isSaturday) {
                classes += "bg-white text-blue-600 border-blue-100 hover:border-blue-400";
            } else {
                classes += "bg-white hover:border-blue-400 border-slate-100 text-slate-600 shadow-sm";
            }
            btn.className = classes;
        };

        updateStyles(i === 0);
        if (isInactive) btn.disabled = true;

        btn.onclick = () => {
            if (isInactive) return;
            document.querySelectorAll('#calendar-grid button').forEach(b => {
                if (b.btnRedraw) b.btnRedraw(false);
            });
            updateStyles(true);
        };

        btn.btnRedraw = (active) => updateStyles(active);
        grid.appendChild(btn);
    }
}

function selectTime(btn) {
    const time = btn.innerText.trim();
    console.log('Time selected:', time);

    // Reset all slots
    document.querySelectorAll('.time-slot').forEach(b => {
        b.classList.remove('bg-blue-600', 'text-white', 'shadow-xl', 'shadow-blue-500/30', 'border-blue-600', 'scale-105');
        b.classList.add('bg-slate-50/50', 'text-slate-700', 'border-transparent');
    });

    // Set active slot
    btn.classList.remove('bg-slate-50/50', 'text-slate-700', 'border-transparent');
    btn.classList.add('bg-blue-600', 'text-white', 'shadow-xl', 'shadow-blue-500/30', 'border-blue-600', 'scale-105');

    // Update display
    const selectedDayBtn = document.querySelector('#calendar-grid button.bg-blue-600');
    const fullDate = selectedDayBtn?.getAttribute('data-full-date') || '-';
    const bookingDisplay = document.getElementById('booking-time-display');
    if (bookingDisplay) {
        bookingDisplay.innerText = `${fullDate} um ${time} Uhr`;
        bookingDisplay.setAttribute('data-iso-date', selectedDayBtn?.getAttribute('data-iso-date'));
        bookingDisplay.setAttribute('data-time', time);
    }
}

async function confirmBooking() {
    showLoading('Zahlung wird vorbereitet...');

    const bookingData = {
        timestamp: new Date().toISOString(),
        userName: document.getElementById('user-vorname').value + ' ' + document.getElementById('user-nachname').value,
        userEmail: document.getElementById('user-email').value,
        userPhone: document.getElementById('user-phone').value,
        userAddress: document.getElementById('user-strasse').value + ', ' + document.getElementById('user-plz').value + ' ' + document.getElementById('user-ort').value,
        topic: lastTopic,
        analysis: lastAnalysisData ? lastAnalysisData['Professionelle Analyse'] : 'Individuelle Analyse',
        risk: document.getElementById('analysis-risk') ? document.getElementById('analysis-risk').innerText : 'Gering',
        recommendation: document.getElementById('analysis-recommendation') ? document.getElementById('analysis-recommendation').innerText : 'Keine',
        lawyer: currentLawyer?.name,
        consultationType: selectedConsultationType,
        price: currentPrice,
        bookingTime: document.getElementById('booking-time-display').innerText
    };

    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (result.checkout_url) {
            window.location.href = result.checkout_url;
        } else {
            throw new Error(result.error || 'Checkout konnte nicht erstellt werden.');
        }
    } catch (err) {
        hideLoading();
        alert('Fehler: ' + err.message);
    }
}

function generateLegalDocument() {
    const vorname = document.getElementById('user-vorname').value || 'Max';
    const nachname = document.getElementById('user-nachname').value || 'Mustermann';
    const date = new Date().toLocaleDateString('de-DE');

    const content = `
JURISMIND SMARTLAW AGENT - RECHTSSICHERES DOKUMENT
Datum: ${date}
Mandant: ${vorname} ${nachname}
Thema: ${lastTopic}

GEGENSTAND DER ANALYSE:
------------------------
${lastAnalysisData['Professionelle Analyse'] || 'Individuelle Fallprüfung'}

RECHTLICHE BEURTEILUNG:
------------------------
${lastAnalysisData['KI-Einschätzung'] || ''}

RECHTSPRECHUNG:
------------------------
${lastAnalysisData['Gerichtsurteile'] || 'Es gelten die allgemeinen BGH-Grundsätze.'}

HINWEIS:
Dieses Dokument wurde automatisiert erstellt und dient der Vorbereitung Ihres Anwaltstermins.
JurisMind GmbH - Ihr Partner für digitales Mietrecht.
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTopic = lastTopic.replace(/\s+/g, '_');
    a.download = `JurisMind_Analyse_${safeTopic}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    alert('Ihr Dokument wurde generiert und heruntergeladen.');
}

function downloadICS() {
    const bookingDisplay = document.getElementById('booking-time-display');
    const isoDate = bookingDisplay?.getAttribute('data-iso-date'); // YYYY-MM-DD
    const time = bookingDisplay?.getAttribute('data-time'); // HH:MM

    if (!isoDate || !time) {
        alert('Fehler beim Generieren des Kalendereintrags.');
        return;
    }

    const startDateTime = isoDate.replace(/-/g, '') + 'T' + time.replace(':', '') + '00';

    // End time 30 mins later
    const [hh, mm] = time.split(':').map(Number);
    const endDate = new Date(isoDate);
    endDate.setHours(hh);
    endDate.setMinutes(mm + 30);
    const endDateTime = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const simpleEnd = isoDate.replace(/-/g, '') + 'T' + (mm >= 30 ? (hh + 1).toString().padStart(2, '0') : hh.toString().padStart(2, '0')) + (mm >= 30 ? (mm - 30).toString().padStart(2, '0') : (mm + 30).toString().padStart(2, '0')) + '00';

    const lawyerName = currentLawyer?.name || 'Rechtsanwalt';
    const lawyerAddress = currentLawyer?.address || '';
    const summary = `Erstberatung: ${lastTopic} - JurisMind`;
    const description = `Ihr gebuchter Termin bei ${lawyerName}.\\\\nThema: ${lastTopic}\\\\nAnschrift: ${lawyerAddress}`;

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//JurisMind//SmartLaw Agent//DE',
        'BEGIN:VEVENT',
        `DTSTART:${simpleEnd.startsWith('T') ? startDateTime : isoDate.replace(/-/g, '') + 'T' + time.replace(':', '') + '00'}`,
        `DTEND:${simpleEnd}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${lawyerAddress}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'JurisMind_Termin.ics';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}

function goToStep(num) {
    const steps = [
        document.getElementById('view-step-1'),
        document.getElementById('view-step-2'),
        document.getElementById('view-step-3'),
        document.getElementById('view-step-4'),
        document.getElementById('view-step-5'),
        document.getElementById('view-step-6')
    ];
    const progress = document.getElementById('progress-bar');
    const progText = document.getElementById('progress-text');
    const stepInfo = document.getElementById('step-info');

    // Reset
    steps.forEach(el => el && el.classList.add('step-hidden'));

    const configs = {
        1: { width: '17%', info: 'Schritt 1 von 6 • 17%' },
        2: { width: '34%', info: 'Schritt 2 von 6 • 34%' },
        3: { width: '51%', info: 'Schritt 3 von 6 • 51%' },
        4: { width: '68%', info: 'Schritt 4 von 6 • 68%' },
        5: { width: '85%', info: 'Schritt 5 von 6 • 85%' },
        6: { width: '95%', info: 'Schritt 6 von 6 • 95%' }
    };

    if (steps[num - 1]) {
        steps[num - 1].classList.remove('step-hidden');
        progress.style.width = configs[num].width;
        progText.innerText = configs[num].width;
        stepInfo.innerText = configs[num].info;
        setStepper(num);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function setStepper(num) {
    const steppers = [
        document.getElementById('stepper-1'),
        document.getElementById('stepper-2'),
        document.getElementById('stepper-3'),
        document.getElementById('stepper-4'),
        document.getElementById('stepper-5'),
        document.getElementById('stepper-6')
    ];

    steppers.forEach(el => {
        if (!el) return;
        el.classList.add('opacity-50');
        el.querySelector('p:first-child')?.classList.remove('stepper-active');
    });

    for (let i = 0; i < num; i++) {
        if (steppers[i]) {
            steppers[i].classList.remove('opacity-50');
            if (i === num - 1) steppers[i].querySelector('p:first-child')?.classList.add('stepper-active');
        }
    }
}

async function askQuestion() {
    const q = document.getElementById('question').value;
    if (!q) return;

    const results = document.getElementById('results-content');
    results.innerHTML = '<p class="animate-pulse">Analysiere Fragestellung...</p>';

    try {
        const response = await fetch('/api/analyze-custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Server Fehler');
        }

        const data = await response.json();
        lastAnalysisData = data;
        lastTopic = 'Spezifische Analyse';
        displayResults('Spezifische Analyse', data);
    } catch (err) {
        results.innerHTML = `<div class="p-6 bg-red-50 rounded-2xl border border-red-100"><p class="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Analyse-Fehler</p><p class="text-sm text-red-500">${err.message || 'Die KI ist aktuell nicht erreichbar.'}</p></div>`;
    }
}

function quickAction(action) {
    const results = document.getElementById('results-content');
    results.scrollIntoView({ behavior: 'smooth', block: 'center' });
    loadTopic(action);
}

async function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const results = document.getElementById('results-content');
    results.innerHTML = `
        <div class="flex flex-col items-center py-6 scale-in">
            <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-sm font-bold text-blue-600 animate-pulse uppercase tracking-widest">Dokument wird digitalisiert...</p>
            <p class="text-[10px] text-slate-400 mt-2 font-bold">${file.name}</p>
        </div>
    `;

    const reader = new FileReader();
    reader.onload = async function (e) {
        const base64Data = e.target.result.split(',')[1];
        const mimeType = file.type;

        try {
            const response = await fetch('/api/analyze-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_content: base64Data,
                    mime_type: mimeType,
                    file_name: file.name
                })
            });

            if (!response.ok) throw new Error('Analyse fehlgeschlagen');

            const data = await response.json();
            lastAnalysisData = data;
            lastTopic = 'Dokumenten-Analyse';
            displayResults('Dokumenten-Analyse', data);

        } catch (err) {
            results.innerHTML = `<div class="p-6 bg-red-50 rounded-2xl border border-red-100"><p class="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">OCR-Fehler</p><p class="text-sm text-red-500">${err.message}</p></div>`;
        }
    };
    reader.readAsDataURL(file);
}

function openPaypalModal() {
    document.getElementById('paypal-modal-backdrop').style.display = 'block';
    document.getElementById('paypal-modal').style.display = 'block';
    document.getElementById('paypal-checkout-amount').innerText = currentPrice + ',00 €';
}

function closePaypalModal() {
    document.getElementById('paypal-modal-backdrop').style.display = 'none';
    document.getElementById('paypal-modal').style.display = 'none';
}

function handlePaypalLogin() {
    const email = document.getElementById('paypal-email').value;
    if (!email.includes('@')) {
        alert('Bitte eine gültige E-Mail eingeben.');
        return;
    }
    document.getElementById('paypal-login-view').classList.add('hidden');
    document.getElementById('paypal-checkout-view').classList.remove('hidden');
}

function finalizePaypalPayment() {
    paypalAuthorized = true;
    closePaypalModal();
    confirmBooking();
}

function selectPayment(el, method) {
    currentPaymentMethod = method;
    document.querySelectorAll('.payment-opt').forEach(opt => opt.classList.remove('border-blue-600', 'bg-white'));
    el.classList.add('border-blue-600', 'bg-white');

    // Forms logic
    document.getElementById('cc-form').classList.add('hidden');
    document.getElementById('sepa-form').classList.add('hidden');

    if (method === 'Kreditkarte') document.getElementById('cc-form').classList.remove('hidden');
    if (method === 'SEPA') document.getElementById('sepa-form').classList.remove('hidden');
    if (method === 'SOFORT') openSofortModal();
}

function openSofortModal() {
    document.getElementById('sofort-modal-backdrop').style.display = 'block';
    document.getElementById('sofort-modal').style.display = 'block';
    document.getElementById('sofort-price').innerText = currentPrice + ',00 €';
}

function closeSofortModal() {
    document.getElementById('sofort-modal-backdrop').style.display = 'none';
    document.getElementById('sofort-modal').style.display = 'none';
}

function handleSofortRedirect() {
    closeSofortModal();
    confirmBooking();
}
