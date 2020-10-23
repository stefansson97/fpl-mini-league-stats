import React, { useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../../ThemeProvider';

const Styles = styled.div`
    padding-top: 30px;
    padding-bottom: 30px;
    font-size: 2.5rem;
    font-weight: 500;
    color: ${(props) => props.theme.darkTheme ? 'white' : '#0e182a'};
    animation-name: title-animation;
    animation-duration: 1s;
`

function MiniLeagueTitle({ miniLeagueName }) {

    const { darkTheme } = useContext(ThemeContext);

    Styles.defaultProps = {
      theme: {
        darkTheme: darkTheme  }
    }

    return (
        <Styles>
            {miniLeagueName}
        </Styles>
    )
}

export default React.memo(MiniLeagueTitle);