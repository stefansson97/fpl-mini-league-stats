import React, { useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../../ThemeProvider';

const Styles = styled.div`
    border: 8px solid transparent;
    border-top: 8px solid ${props => props.theme.darkTheme ? 'white' : '#0e182a'};
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    margin-top: 30px;

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`


export default function Loading() {

    const {darkTheme} = useContext(ThemeContext)
    
    Styles.defaultProps = {
        theme: {
          darkTheme: darkTheme  }
    }

    return(
        <Styles />
    )
}
