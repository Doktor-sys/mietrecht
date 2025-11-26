import React, { useState } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Tabs,
    Tab,
    AppBar,
    Toolbar,
    IconButton,
    Avatar,
    Button,
} from '@mui/material';
import {
    Gavel as GavelIcon,
    Event as EventIcon,
    Person as PersonIcon,
    Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { CaseList } from '../components/lawyer/CaseList';
import { AppointmentList } from '../components/lawyer/AppointmentList';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`lawyer-tabpanel-${index}`}
            aria-labelledby={`lawyer-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export const LawyerDashboardPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GavelIcon color="primary" />
                        SmartLaw Anwalts-Portal
                    </Typography>
                    <IconButton color="inherit">
                        <NotificationsIcon />
                    </IconButton>
                    <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">Dr. Max Mustermann</Typography>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>MM</Avatar>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
                <Grid container spacing={3}>
                    {/* Welcome Section */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="h5" gutterBottom>
                                    Willkommen zurück, Dr. Mustermann
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Sie haben 2 neue Nachrichten und 1 anstehenden Termin heute.
                                </Typography>
                            </Box>
                            <Button variant="contained" color="primary">
                                Neues Mandat anlegen
                            </Button>
                        </Paper>
                    </Grid>

                    {/* Main Content */}
                    <Grid item xs={12}>
                        <Paper sx={{ width: '100%' }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                indicatorColor="primary"
                                textColor="primary"
                                sx={{ borderBottom: 1, borderColor: 'divider' }}
                            >
                                <Tab label="Meine Fälle" icon={<GavelIcon />} iconPosition="start" />
                                <Tab label="Termine" icon={<EventIcon />} iconPosition="start" />
                                <Tab label="Profil" icon={<PersonIcon />} iconPosition="start" />
                            </Tabs>

                            <TabPanel value={tabValue} index={0}>
                                <CaseList />
                            </TabPanel>

                            <TabPanel value={tabValue} index={1}>
                                <AppointmentList />
                            </TabPanel>

                            <TabPanel value={tabValue} index={2}>
                                <Typography variant="h6">Profil-Einstellungen</Typography>
                                <Typography paragraph>
                                    Hier können Sie Ihr Anwaltsprofil bearbeiten, Verfügbarkeiten verwalten und Spezialisierungen angeben.
                                </Typography>
                                {/* Placeholder for profile settings */}
                            </TabPanel>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};
