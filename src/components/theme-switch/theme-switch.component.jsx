import React, {useContext} from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../../ThemeProvider';

const Styles = styled.div`
    position: absolute;
    top: 30px;
    right: 50px;
    color: ${props => props.theme.darkTheme ? 'white' : '#0e182a'};
    cursor: pointer;
`

function ThemeSwitch() {

    const {darkTheme, changeTheme} = useContext(ThemeContext)
    
    Styles.defaultProps = {
        theme: {
          darkTheme: darkTheme  }
    }

    return (
        <Styles onClick={changeTheme}>
             {darkTheme ? (<i className="far fa-lightbulb fa-3x"></i>) :  (<i className="fas fa-lightbulb fa-3x"></i>)}
        </Styles>
    )
}

export default ThemeSwitch;