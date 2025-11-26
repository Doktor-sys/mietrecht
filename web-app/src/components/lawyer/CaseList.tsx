import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Chip,
    IconButton,
    Paper,
    Box,
} from '@mui/material';
import {
    Gavel as GavelIcon,
    ArrowForwardIos as ArrowForwardIcon,
    Message as MessageIcon,
} from '@mui/icons-material';

interface Case {
    id: string;
    title: string;
    clientName: string;
    status: 'active' | 'pending' | 'closed';
    lastUpdate: string;
    type: string;
}

const mockCases: Case[] = [
    {
        id: '1',
        title: 'Mietminderung wegen Schimmel',
        clientName: 'Max Mustermann',
        status: 'active',
        lastUpdate: '2023-11-23',
        type: 'Mietrecht',
    },
    {
        id: '2',
        title: 'Kündigung Eigenbedarf',
        clientName: 'Maria Müller',
        status: 'pending',
        lastUpdate: '2023-11-22',
        type: 'Mietrecht',
    },
    {
        id: '3',
        title: 'Nebenkostenabrechnung 2022',
        clientName: 'Hans Schmidt',
        status: 'active',
        lastUpdate: '2023-11-20',
        type: 'Mietrecht',
    },
];

export const CaseList: React.FC = () => {
    return (
        <Paper elevation={0} variant="outlined">
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {mockCases.map((caseItem, index) => (
                    <React.Fragment key={caseItem.id}>
                        <ListItem
                            alignItems="flex-start"
                            secondaryAction={
                                <Box>
                                    <IconButton edge="end" aria-label="message" sx={{ mr: 1 }}>
                                        <MessageIcon />
                                    </IconButton>
                                    <IconButton edge="end" aria-label="details">
                                        <ArrowForwardIcon />
                                    </IconButton>
                                </Box>
                            }
                        >
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <GavelIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="subtitle1" component="span">
                                            {caseItem.title}
                                        </Typography>
                                        <Chip
                                            label={caseItem.status}
                                            size="small"
                                            color={caseItem.status === 'active' ? 'success' : 'warning'}
                                            variant="outlined"
                                        />
                                    </Box>
                                }
                                secondary={
                                    <React.Fragment>
                                        <Typography
                                            sx={{ display: 'inline' }}
                                            component="span"
                                            variant="body2"
                                            color="text.primary"
                                        >
                                            {caseItem.clientName}
                                        </Typography>
                                        {` — Last update: ${caseItem.lastUpdate}`}
                                    </React.Fragment>
                                }
                            />
                        </ListItem>
                        {index < mockCases.length - 1 && <Box sx={{ mx: 2, borderBottom: 1, borderColor: 'divider' }} />}
                    </React.Fragment>
                ))}
            </List>
        </Paper>
    );
};
