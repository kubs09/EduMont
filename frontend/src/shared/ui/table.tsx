import React from 'react';
import { Table, TableRootProps } from '@chakra-ui/react';
import { useColorModeValue } from '../contexts/ColorContext';

interface CustomTableProps extends TableRootProps {
  headers: string[];
  data: string[][];
  actions?: (rowIndex: number) => React.ReactNode;
}

export const CustomTable: React.FC<CustomTableProps> = ({ headers, data, actions, ...props }) => {
  const headerBg = useColorModeValue('gray.100', 'gray.700');
  const rowBg = useColorModeValue('white', 'gray.800');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Table.Root {...props}>
      <Table.Header bg={headerBg}>
        <Table.Row>
          {headers.map((header, index) => (
            <Table.ColumnHeader key={index}>{header}</Table.ColumnHeader>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((row, rowIndex) => (
          <Table.Row key={rowIndex} bg={rowBg} _hover={{ bg: rowHoverBg }}>
            {row.map((cell, cellIndex) => (
              <Table.Cell key={cellIndex}>{cell}</Table.Cell>
            ))}
            {actions && <Table.Cell>{actions(rowIndex)}</Table.Cell>}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};
