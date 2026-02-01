import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Typography,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface AccessibleDataListProps {
  title: string;
  columns: Array<{
    key: string;
    label: string;
    align?: 'left' | 'right' | 'center';
  }>;
  data: Array<Record<string, any>>;
  caption?: string;
  ariaLabel?: string;
}

const AccessibleDataList: React.FC<AccessibleDataListProps> = ({
  title,
  columns,
  data,
  caption,
  ariaLabel
}) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table 
          aria-label={ariaLabel || title}
          aria-describedby={caption ? 'table-caption' : undefined}
        >
          {caption && (
            <caption id="table-caption" style={{ textAlign: 'left', padding: '8px', fontStyle: 'italic' }}>
              {caption}
            </caption>
          )}
          
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell 
                  key={column.key}
                  align={column.align || 'left'}
                  sx={{ fontWeight: 'bold', backgroundColor: 'grey.50' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow 
                key={rowIndex}
                hover
                aria-rowindex={rowIndex + 1}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={`${rowIndex}-${column.key}`}
                    align={column.align || 'left'}
                    aria-label={`${column.label}: ${row[column.key]}`}
                  >
                    {row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {data.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {t('common.noData')}
            </Typography>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
};

export default AccessibleDataList;