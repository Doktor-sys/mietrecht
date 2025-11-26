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
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Assessment as AssessmentIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    Menu as MenuIcon,
} from '@mui/icons-material';
import { AnalyticsCharts } from '../components/admin/AnalyticsCharts';
import { AuditLogTable } from '../components/admin/AuditLogTable';

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
            id={`admin-tabpanel-${index}`}
            aria-labelledby={`admin-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export const AdminDashboardPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        setDrawerOpen(open);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={toggleDrawer(true)}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        SmartLaw Admin Dashboard
                    </Typography>
                </Toolbar>
            </AppBar>

            <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
                <Box
                    sx={{ width: 250 }}
                    role="presentation"
                    onClick={toggleDrawer(false)}
                    onKeyDown={toggleDrawer(false)}
                >
                    <List>
                        <ListItem button onClick={() => setTabValue(0)}>
                            <ListItemIcon><DashboardIcon /></ListItemIcon>
                            <ListItemText primary="Overview" />
                        </ListItem>
                        <ListItem button onClick={() => setTabValue(1)}>
                            <ListItemIcon><AssessmentIcon /></ListItemIcon>
                            <ListItemText primary="Audit Logs" />
                        </ListItem>
                        <ListItem button>
                            <ListItemIcon><PeopleIcon /></ListItemIcon>
                            <ListItemText primary="Users" />
                        </ListItem>
                        <ListItem button>
                            <ListItemIcon><SettingsIcon /></ListItemIcon>
                            <ListItemText primary="Settings" />
                        </ListItem>
                    </List>
                    <Divider />
                </Box>
            </Drawer>

            <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
                <Paper sx={{ width: '100%', mb: 2 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        centered
                    >
                        <Tab label="Overview" icon={<DashboardIcon />} iconPosition="start" />
                        <Tab label="Audit Logs" icon={<AssessmentIcon />} iconPosition="start" />
                    </Tabs>
                </Paper>

                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        {/* Key Metrics */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography variant="h6" color="textSecondary">Total Users</Typography>
                                <Typography variant="h3">1,245</Typography>
                                <Typography variant="body2" color="success.main">+5% from last month</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography variant="h6" color="textSecondary">Active Cases</Typography>
                                <Typography variant="h3">342</Typography>
                                <Typography variant="body2" color="primary.main">12 new today</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography variant="h6" color="textSecondary">Revenue (MTD)</Typography>
                                <Typography variant="h3">€12.5k</Typography>
                                <Typography variant="body2" color="success.main">+12% vs target</Typography>
                            </Paper>
                        </Grid>

                        {/* Charts */}
                        <Grid item xs={12}>
                            <AnalyticsCharts />
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <AuditLogTable />
                </TabPanel>
            </Container>
        </Box>
    );
};
