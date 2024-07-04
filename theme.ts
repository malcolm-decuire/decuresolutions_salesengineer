// 'use client';

// import { ThemeOptions } from '@mui/material';
// import { createTheme as muiCreateTheme } from '@mui/material/styles';

// const createTheme = (): ThemeOptions =>
//   muiCreateTheme({
//     breakpoints: {
//       values: {
//         xs: 0,
//         sm: 576,
//         md: 768,
//         lg: 1024,
//         xl: 1280,
//       },
//     },
//     palette: {
//       mode: 'light',
//       primary: {
//         light: '#88c155',
//         500: '#5E801E',
//       },
//       error: {
//         500: '#ee294c',
//       },
//       secondary: {
//         main: '#e3e2e2'
//       }
//     },
//     typography: {
//       h1: {
//         fontSize: 36,
//       },
//       h2: {
//         fontSize: 28,
//       }
//     },
//     components: {
//       MuiButton: {
//         styleOverrides: {
//           root: {
//             borderRadius: '24px',
//             height: '40px',
//             padding: '0 20px',
//             cursor: 'pointer',
//             textTransform: 'none',
//             outline: '',
//             '&.Mui-focused': {
//               borderRadius: '10px',
//             },
//             '&.Mui-disabled': {
//               opacity: 0.3,
//             },
//           },
//         },
//       },
//       MuiTextField: {
//         styleOverrides: {
//           root: {
//             position: 'relative',
//           }
//         }
//       },
//       MuiFormHelperText: {
//         styleOverrides: {
//           root: {
//             position: 'absolute',
//             bottom: -20,
//             left: 0,
//             margin: 0
//           }
//         }
//       },
//       MuiSlider: {
//         styleOverrides: {
//           root: ({ theme }) => {

//             return {
//               color: theme.palette.primary.light,
//             }
//           },
//         },
//       },
//     },
//   });

// export default createTheme;

/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
'use client';
import { createTheme as muiCreateTheme, ThemeProvider, Theme } from '@mui/material/styles';

const createTheme = (): Theme =>
  muiCreateTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 1024,
        xl: 1280,
      },
    },
    palette: {
      mode: 'light',
      primary: {
        light: '#88c155',
        main: '#5E801E',
      },
      error: {
        main: '#ee294c',
      },
      secondary: {
        main: '#e3e2e2',
      },
    },
    typography: {
      h1: {
        fontSize: 36,
      },
      h2: {
        fontSize: 28,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '24px',
            height: '40px',
            padding: '0 20px',
            cursor: 'pointer',
            textTransform: 'none',
            '&.Mui-focused': {
              borderRadius: '10px',
            },
            '&.Mui-disabled': {
              opacity: 0.3,
            },
            ['@media (max-width:576px)']: {
              height: '35px',
              padding: '0 15px',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            position: 'relative',
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            position: 'absolute',
            bottom: -20,
            left: 0,
            margin: 0,
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            color: '#88c155',
            ['@media (max-width:576px)']: {
              color: '#e3e2e2',
            },
          },
        },
      },
    },
  });

const theme = createTheme();

export default theme;
export { ThemeProvider, theme };
