import React, { ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import theme from '../../../../theme'; // Adjust the path to your theme file

interface Props {
  children: ReactNode;
}

const ThemeProvider: React.FC<Props> = ({ children }) => {
  return <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>;
};

export default ThemeProvider;