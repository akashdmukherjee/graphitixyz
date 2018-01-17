export const SQLSnippets = {
  '[Akash SQL Snippet 1]': {
    label: 'Akash SQL Snippet 1',
    documentation: `SELECT employee_name, employee_id, age, gender, AVG(rating) as avg_rating
FROM employees e
LEFT OUTER JOIN emp_ratings r ON e.employee_id = r.employee_id
WHERE country='India' OR continent='North America'
ORDER BY employee_id
    `,
    insertText: '[Akash SQL Snippet 1] ',
  },
  '[Devajit SQL Snippet 1]': {
    label: 'Devajit SQL Snippet 1',
    documentation: 'employee_name, employee_id, salary',
    insertText: '[Devajit SQL Snippet 1] ',
  },
  '[Devajit SQL Snippet 2]': {
    label: 'Devajit SQL Snippet 2',
    documentation: 'employee_id = 100',
    insertText: '[Devajit SQL Snippet 2] ',
  },
  '[Geetish SQL Snippet 2]': {
    label: 'Geetish SQL Snippet 2',
    documentation: '( SELECT id, enrollment_number FROM employees )',
    insertText: '[Geetish SQL Snippet 2] ',
  },
  '[Akash SQL Snippet 2]': {
    label: 'Akash SQL Snippet 2',
    documentation: 'SUM(sales)',
    insertText: '[Akash SQL Snippet 2] ',
  },
};

const createSQLSnippetsProposals = (monaco) => {
  return Object.keys(SQLSnippets).map(key => ({
    ...SQLSnippets[key],
    kind: monaco.languages.CompletionItemKind.Module,
  }));
};

export default createSQLSnippetsProposals;
