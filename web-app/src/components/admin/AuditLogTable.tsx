import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    TextField,
    Box,
    Pagination,
    CircularProgress,
    Typography,
} from '@mui/material';
import { format } from 'date-fns';

// Mock Data Interface
interface AuditLog {
    id: string;
    action: string;
    userId: string;
    resource: string;
    status: 'success' | 'failure';
    timestamp: string;
    details: string;
}

// Mock Data Generator
const generateMockLogs = (count: number): AuditLog[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `log-${i}`,
        action: i % 3 === 0 ? 'LOGIN' : i % 3 === 1 ? 'DOCUMENT_ACCESS' : 'SETTINGS_CHANGE',
        userId: `user-${Math.floor(Math.random() * 10)}`,
        resource: i % 3 === 1 ? `doc-${Math.floor(Math.random() * 100)}` : 'system',
        status: Math.random() > 0.1 ? 'success' : 'failure',
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
        details: 'Operation details...',
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const AuditLogTable: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('');
    const rowsPerPage = 10;

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setLogs(generateMockLogs(50));
            setLoading(false);
        }, 1000);
    }, []);

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const filteredLogs = logs.filter(
        (log) =>
            log.action.toLowerCase().includes(filter.toLowerCase()) ||
            log.userId.toLowerCase().includes(filter.toLowerCase())
    );

    const paginatedLogs = filteredLogs.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom component="div">
                    System Audit Logs
                </Typography>
                <TextField
                    label="Filter Logs"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={filter}
                    onChange={(e) => {
                        setFilter(e.target.value);
                        setPage(1);
                    }}
                    sx={{ mb: 2 }}
                />
            </Box>
            <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Resource</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedLogs.map((log) => (
                            <TableRow hover role="checkbox" tabIndex={-1} key={log.id}>
                                <TableCell>{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                                <TableCell>{log.action}</TableCell>
                                <TableCell>{log.userId}</TableCell>
                                <TableCell>{log.resource}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={log.status}
                                        color={log.status === 'success' ? 'success' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                    count={Math.ceil(filteredLogs.length / rowsPerPage)}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                />
            </Box>
        </Paper>
    );
};
