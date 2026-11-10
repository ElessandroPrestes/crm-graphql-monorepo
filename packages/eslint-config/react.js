import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export function createReactConfig(files = ['**/*.{ts,tsx}']) {
  return [
    {
      files,
      languageOptions: {
        globals: {
          ...globals.browser,
        },
      },
    },
    {
      files,
      ...jsxA11y.flatConfigs.recommended,
    },
    {
      files,
      plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react-refresh/only-export-components': [
          'warn',
          {
            allowConstantExport: true,
          },
        ],
      },
    },
  ];
}

export default createReactConfig();
