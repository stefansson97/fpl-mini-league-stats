import React, { useState, useEffect, createContext } from 'react';

export const ThemeContext = createContext();

export default function ThemeProvider({children}) {

    const [darkTheme, setDarkTheme] = useState(() => {
        if(window.localStorage.getItem('darkTheme') === 'true') return true;
        return false;
    });

    useEffect(() => {
        window.localStorage.setItem('darkTheme', darkTheme)
    }, [darkTheme]);

    const changeTheme = () => {
        setDarkTheme(prevValue => !prevValue);
    }

    const value = {darkTheme, changeTheme}

    return(
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}