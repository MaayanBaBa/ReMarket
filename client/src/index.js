import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import { AuthProvider } from './context/AuthContext'
import { createTheme, ThemeProvider } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#8c6f4f',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#52677b',
      contrastText: '#ffffff'
    },
    background: {
      default: '#eff0ed',
      paper: '#ffffff'
    },
    text: {
      primary: '#1f2429',
      secondary: '#6f7581'
    },
    divider: 'rgba(31,36,41,0.12)',
    action: {
      hover: 'rgba(140,111,79,0.08)',
      selected: 'rgba(82,103,123,0.14)',
      disabledBackground: 'rgba(31,36,41,0.08)',
      disabled: 'rgba(31,36,41,0.38)'
    }
  },
  shape: {
    borderRadius: 14
  },
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    button: {
      textTransform: 'none',
      fontWeight: 700
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#eff0ed',
          backgroundImage: 'radial-gradient(circle at top left, rgba(140,111,79,0.08), transparent 25%), radial-gradient(circle at bottom right, rgba(82,103,123,0.08), transparent 25%)',
          color: '#1f2429'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid rgba(31,36,41,0.08)',
          boxShadow: '0 16px 40px rgba(34,50,80,0.08)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid rgba(31,36,41,0.08)',
          boxShadow: '0 18px 35px rgba(43,58,77,0.08)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: '#faf9f5',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(31,36,41,0.12)'
          }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#6f7581'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderBottom: '1px solid rgba(31,36,41,0.08)',
          boxShadow: '0 10px 24px rgba(31,36,41,0.08)'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#fcfcfb'
        }
      }
    }
  }
})

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <CssBaseline />
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
