import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Typography,
    Paper,
    Box,
    Button,
} from '@mui/material';
import {
    Event as EventIcon,
    VideoCall as VideoCallIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

interface Appointment {
    id: string;
    clientName: string;
    date: string;
    time: string;
    type: 'video' | 'phone' | 'in-person';
    topic: string;
}

const mockAppointments: Appointment[] = [
    {
        id: '1',
        clientName: 'Max Mustermann',
        date: 'Today',
        time: '14:00 - 15:00',
        type: 'video',
        topic: 'Erstberatung Schimmel',
    },
    {
        id: '2',
        clientName: 'Sarah Weber',
        date: 'Tomorrow',
        time: '10:00 - 11:00',
        type: 'phone',
        topic: 'Rückfrage Kündigung',
    },
];

export const AppointmentList: React.FC = () => {
    return (
        <Paper elevation={0} variant="outlined">
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {mockAppointments.map((apt, index) => (
                    <React.Fragment key={apt.id}>
                        <ListItem
                            alignItems="flex-start"
                            secondaryAction={
                                apt.type === 'video' && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<VideoCallIcon />}
                                        color="primary"
                                    >
                                        Join Call
                                    </Button>
                                )
                            }
                        >
                            <ListItemIcon>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText',
                                        borderRadius: 1,
                                        p: 1,
                                        minWidth: 60,
                                    }}
                                >
                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                        {apt.date}
                                    </Typography>
                                    <EventIcon fontSize="small" />
                                </Box>
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="subtitle1" component="div">
                                        {apt.clientName}
                                    </Typography>
                                }
                                secondary={
                                    <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTimeIcon fontSize="inherit" />
                                            <Typography variant="body2" component="span">
                                                {apt.time}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {apt.topic} ({apt.type})
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                        {index < mockAppointments.length - 1 && <Box sx={{ mx: 2, borderBottom: 1, borderColor: 'divider' }} />}
                    </React.Fragment>
                ))}
            </List>
        </Paper>
    );
};
