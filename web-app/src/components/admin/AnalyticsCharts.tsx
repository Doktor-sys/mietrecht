import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { Box, Paper, Typography, Grid } from '@mui/material';

// Mock Data
const userGrowthData = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 600 },
    { name: 'Mar', users: 900 },
    { name: 'Apr', users: 1200 },
    { name: 'May', users: 1500 },
    { name: 'Jun', users: 2000 },
];

const apiUsageData = [
    { name: 'Mon', calls: 2400 },
    { name: 'Tue', calls: 1398 },
    { name: 'Wed', calls: 9800 },
    { name: 'Thu', calls: 3908 },
    { name: 'Fri', calls: 4800 },
    { name: 'Sat', calls: 3800 },
    { name: 'Sun', calls: 4300 },
];

export const AnalyticsCharts: React.FC = () => {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 300 }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>
                        User Growth
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={userGrowthData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 300 }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>
                        API Usage (Last 7 Days)
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={apiUsageData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="calls" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>
        </Grid>
    );
};
