import React, { useState, useEffect, createContext } from 'react';

export const ThemeContext = createContext();

export default function ThemeProvider({children}) {

    const [darkTheme, setDarkTheme] = useState(false);

    useEffect(() => {
        window.localStorage.setItem('darkTheme', darkTheme)
    }, [darkTheme]);

    const changeTheme = () => {
        console.log(darkTheme)
        setDarkTheme(prevValue => !prevValue);
    }

    const value = {darkTheme, changeTheme}

    return(
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}