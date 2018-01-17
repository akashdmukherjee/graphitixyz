export const ThemeName = 'graphiti-light';
const ThemeRules = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '615dae', fontStyle: 500 },
    { token: 'identifier.sql', foreground: '666666' },
    { token: 'predefined.sql', foreground: 'e69138', fontStyle: 500 },
    { token: 'operator.sql', foreground: '615dae', fontStyle: 500 },
    { token: 'string.sql', foreground: 'f26450', fontStyle: 500 },
    { token: 'number.sql', foreground: 'f26450', fontStyle: 500 },
  ],
};

export default ThemeRules;
