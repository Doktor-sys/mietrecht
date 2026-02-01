import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    Stepper,
    Step,
    StepLabel,
    LinearProgress,
    IconButton,
    InputAdornment,
    Divider,
    Paper,
} from '@mui/material';
import {
    Send as SendIcon,
    Lightbulb as LightbulbIcon,
    Search as SearchIcon,
    Article as ArticleIcon,
    Gavel as GavelIcon,
    Description as DescriptionIcon,
    Warning as WarningIcon,
    PersonSearch as PersonSearchIcon,
    GavelOutlined,
    HelpOutline,
    Assignment,
    Security,
    AccountBalance,
    Business,
    Home,
    Construction,
    Apartment,
    WaterDrop,
    VolumeUp,
    ReportProblem,
    MeetingRoom,
    Handyman,
} from '@mui/icons-material';

const topics = [
    { icon: <GavelOutlined />, label: 'Kündigungsschutz', color: '#1976d2' },
    { icon: <Home />, label: 'Mietminderung', color: '#2e7d32' },
    { icon: <AccountBalance />, label: 'Nebenkosten', color: '#d32f2f' },
    { icon: <HelpOutline />, label: 'Wohnrecht', color: '#9c27b0' },
    { icon: <AccountBalance />, label: 'Kaution', color: '#ed6c02' },
    { icon: <Handyman />, label: 'Renovierung', color: '#0288d1' },
    { icon: <Apartment />, label: 'Modernisierung', color: '#455a64' },
    { icon: <AccountBalance />, label: 'Rückzahlung', color: '#c62828' },
    { icon: <Assignment />, label: 'Hausordnung', color: '#388e3c' },
    { icon: <Security />, label: 'Tierhaltung', color: '#7b1fa2' },
    { icon: <Business />, label: 'Wohnfläche', color: '#0288d1' },
    { icon: <WaterDrop />, label: 'Wasserschaden', color: '#455a64' },
    { icon: <VolumeUp />, label: 'Lärm', color: '#1976d2' },
    { icon: <ReportProblem />, label: 'Mängel', color: '#2e7d32' },
    { icon: <MeetingRoom />, label: 'Räumung', color: '#d32f2f' },
    { icon: <ArticleIcon />, label: 'Mietvertrag', color: '#9c27b0' },
];

const LegalAgentDashboard: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);

    const activeStep = answer ? 1 : 0;
    const steps = [
        { label: 'Mietrechtliche Frage', sub: 'Schritt 1' },
        { label: 'Mietrechtliche Analyse', sub: 'Schritt 2' },
        { label: 'Anwaltssuche', sub: 'Schritt 3' },
        { label: 'Terminauswahl', sub: 'Schritt 4' },
        { label: 'Bestätigung', sub: 'Schritt 5' },
        { label: 'Erstberatung, Zahlung für Anwaltstermin', sub: 'Schritt 6' },
    ];

    React.useEffect(() => {
        fetch('http://localhost:5000/api/topics')
            .then(r => r.json())
            .then(data => setAvailableTopics(data))
            .catch(err => console.error('Error fetching topics:', err));
    }, []);

    const handleAskQuestion = async () => {
        if (!question) return;
        setLoading(true);
        setAnswer(null);

        try {
            // Find topic in question
            let foundTopic = null;
            for (const topic of availableTopics) {
                if (question.toLowerCase().includes(topic.toLowerCase())) {
                    foundTopic = topic;
                    break;
                }
            }

            if (foundTopic) {
                const res = await fetch(`http://localhost:5000/api/topic/${foundTopic}`);
                const data = await res.json();
                setAnswer({ topic: foundTopic, contents: data });
            } else {
                setAnswer({ error: 'Bitte verwenden Sie Schlüsselwörter wie: Kündigung, Mietminderung, Kaution' });
            }
        } catch (err) {
            console.error('Error asking question:', err);
            setAnswer({ error: 'Verbindung zum Server fehlgeschlagen.' });
        } finally {
            setLoading(false);
        }
    };

    const handleTopicClick = async (topicLabel: string) => {
        setLoading(true);
        setAnswer(null);
        setQuestion(`Ich habe eine Frage zum Thema ${topicLabel}`);

        try {
            const res = await fetch(`http://localhost:5000/api/topic/${topicLabel.toLowerCase().replace('schutz', '')}`);
            if (res.ok) {
                const data = await res.json();
                setAnswer({ topic: topicLabel, contents: data });
            } else {
                // Fallback for German umlauts or specific naming
                const searchName = topicLabel.toLowerCase().includes('kündigung') ? 'kündigung' : topicLabel.toLowerCase();
                const res2 = await fetch(`http://localhost:5000/api/topic/${searchName}`);
                if (res2.ok) {
                    const data = await res2.json();
                    setAnswer({ topic: topicLabel, contents: data });
                } else {
                    setAnswer({ error: `Thema "${topicLabel}" wurde in der Datenbank noch nicht im Detail hinterlegt.` });
                }
            }
        } catch (err) {
            setAnswer({ error: 'Fehler beim Laden des Themas.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header Section */}
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: '#444' }}>
                    JurisMind SmartLaw Agent
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    Revolution der Rechtsberatung - Sofort verfügbar
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto', fontSize: '0.9rem' }}>
                    Der SmartLaw Agent bietet Mietern und Vermietern schnellen, verständlichen und zuverlässigen Zugang zu mietrechtlicher Beratung.
                    KI gestützt, DSGVO konform und mit nahtloser Anwaltsvermittlung. Demokratisierung von Rechtswissen: Juristische Expertise für jeden.
                </Typography>
            </Box>

            <Paper elevation={0} sx={{ p: 2, mb: 4, borderBottom: '1px solid #eee', bgcolor: '#fafafa' }}>
                <Grid container alignItems="center" spacing={1}>
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', pl: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', lineHeight: 1.2 }}>
                                Beratung starten
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                Schritt {activeStep + 1} von {steps.length} {Math.round(((activeStep + 1) / steps.length) * 100)}%
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Stepper activeStep={activeStep} alternativeLabel sx={{
                            '& .MuiStepLabel-label': { fontSize: '0.62rem', whiteSpace: 'normal', lineHeight: 1.1, minHeight: '2.4em' },
                            '& .MuiStepLabel-iconContainer': { transform: 'scale(0.65)' }
                        }}>
                            {steps.map((step, index) => (
                                <Step key={index}>
                                    <StepLabel>
                                        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', fontSize: '0.62rem', lineHeight: 1 }}>{step.label}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>{step.sub}</Typography>
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={((activeStep + 1) / steps.length) * 100}
                                    sx={{ height: 6, borderRadius: 5, bgcolor: '#eee' }}
                                />
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '0.8rem' }}>
                                {Math.round(((activeStep + 1) / steps.length) * 100)}%
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Main Content Grid */}
            <Grid container spacing={4}>
                {/* Left Column */}
                <Grid item xs={12} lg={8}>
                    {/* Question Box */}
                    <Card elevation={1} sx={{ mb: 4, borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Ihre Mietrechtliche Frage
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Beschreiben Sie Ihr mietrechtliches Problem..."
                                variant="outlined"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Button
                                    variant="text"
                                    startIcon={<SendIcon />}
                                    disabled={!question || loading}
                                    onClick={handleAskQuestion}
                                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                                >
                                    {loading ? 'Analysiere...' : 'Frage senden'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Topics Section */}
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Mietrechtliche Themen
                    </Typography>
                    <Grid container spacing={2}>
                        {topics.map((topic, index) => (
                            <Grid item xs={6} sm={3} key={index}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        textAlign: 'center',
                                        py: 2,
                                        cursor: 'pointer',
                                        border: '1px solid transparent',
                                        '&:hover': { bgcolor: '#f5f5f5', borderColor: '#eee' },
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => handleTopicClick(topic.label)}
                                >
                                    <Box sx={{ color: topic.color, mb: 1 }}>
                                        {topic.icon && React.isValidElement(topic.icon) ?
                                            React.cloneElement(topic.icon as React.ReactElement, { sx: { fontSize: 32 } }) :
                                            <HelpOutline sx={{ fontSize: 32 }} />
                                        }
                                    </Box>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                        {topic.label}
                                    </Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} lg={4}>
                    {/* Results Box */}
                    <Card elevation={1} sx={{ mb: 3, borderRadius: 2, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CardContent sx={{ textAlign: 'center', width: '100%', p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Ergebnisse
                            </Typography>
                            {!answer && !loading && (
                                <>
                                    <LightbulbIcon sx={{ fontSize: 48, color: '#444', mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Bitte geben Sie Ihre mietrechtliche Frage ein oder wählen Sie ein Thema aus.
                                    </Typography>
                                </>
                            )}
                            {loading && (
                                <Box sx={{ py: 4 }}>
                                    <LinearProgress />
                                    <Typography variant="body2" sx={{ mt: 2 }}>Analysiere Daten...</Typography>
                                </Box>
                            )}
                            {answer && (
                                <Box sx={{ textAlign: 'left' }}>
                                    {answer.error ? (
                                        <Typography color="error">{answer.error}</Typography>
                                    ) : (
                                        <>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                                                Thema: {answer.topic}
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />

                                            {/* Step 1: KI-Einschätzung */}
                                            {answer.contents['KI-Einschätzung'] && (
                                                <Box sx={{ mb: 3, p: 2, bgcolor: '#f0f7ff', borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                                        KI-Einschätzung (für Mieter/Vermieter)
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#333' }}>
                                                        {answer.contents['KI-Einschätzung']}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Step 2: Professionelle Analyse & Urteile */}
                                            {answer.contents['Professionelle Analyse'] && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 1 }}>
                                                        Juristische Analyse (für den Anwalt)
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                                        {answer.contents['Professionelle Analyse']}
                                                    </Typography>

                                                    {answer.contents['Gerichtsurteile'] && (
                                                        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#d32f2f', display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                <GavelIcon sx={{ fontSize: 14, mr: 0.5 }} /> Wichtige Gerichtsurteile:
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'pre-line' }}>
                                                                {answer.contents['Gerichtsurteile']}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}

                                            {/* Fallback for old data structure */}
                                            {!answer.contents['KI-Einschätzung'] && Object.entries(answer.contents).map(([key, value]: [string, any]) => (
                                                <Box key={key} sx={{ mb: 2 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                                                        {key}:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {value}
                                                    </Typography>
                                                </Box>
                                            ))}

                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                size="small"
                                                sx={{ mt: 3, textTransform: 'none', borderRadius: 2 }}
                                                onClick={() => setAnswer(null)}
                                            >
                                                Neue Frage
                                            </Button>
                                        </>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions Box */}
                    <Card elevation={1} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                                Schnellaktionen
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, cursor: 'pointer' }}>
                                        <ArticleIcon sx={{ fontSize: 20, mr: 1, color: '#1976d2' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Mietvertrag prüfen</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, cursor: 'pointer' }}>
                                        <DescriptionIcon sx={{ fontSize: 20, mr: 1, color: '#2e7d32' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Kündigungsschreiben</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, cursor: 'pointer' }}>
                                        <Assignment sx={{ fontSize: 20, mr: 1, color: '#ed6c02' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Mängelliste</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, cursor: 'pointer' }}>
                                        <PersonSearchIcon sx={{ fontSize: 20, mr: 1, color: '#7b1fa2' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Anwalt finden</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default LegalAgentDashboard;
