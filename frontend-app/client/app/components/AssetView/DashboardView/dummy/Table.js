import React from 'react';
import DataGrid from '../../../common/DataGrid';

const pow = Math.pow(2, 32);
const generateString = () => (Math.random() * pow).toString(14).slice(10);

function getDataSource(n) {
  const dataSource = [];
  for (let i = 0; i < n; i++) {
    dataSource.push({
      student_name: generateString(),
      id: generateString(),
    });
  }
  return dataSource;
}

const Table = props => <DataGrid dataSource={getDataSource(10)} {...props} />;

export default Table;
