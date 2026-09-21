import React from 'react';
import { Table, TableRootProps } from '@chakra-ui/react';

interface CustomTableProps extends TableRootProps {
  headers: string[];
  data: React.ReactNode[][];
  actions?: (rowIndex: number) => React.ReactNode;
}

export const CustomTable: React.FC<CustomTableProps> = ({ headers, data, actions, ...props }) => {
  return (
    <Table.Root {...props}>
      <Table.Header>
        <Table.Row>
          {headers.map((header, index) => (
            <Table.ColumnHeader key={index}>{header}</Table.ColumnHeader>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((row, rowIndex) => (
          <Table.Row key={rowIndex}>
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
