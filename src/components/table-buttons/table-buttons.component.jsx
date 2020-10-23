import React, { useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../../ThemeProvider';

const Styles = styled.div`
    display: flex;
    justify-content: space-between;
    width: 90%;

    .page-btn {
        border: none;
        border-radius: 5px;
        background-color: ${(props) => props.theme.darkTheme ? 'white' : '#0e182a'};
        color: ${(props) => props.theme.darkTheme ? '#0e182a' : 'white'};
        cursor: pointer;
        outline: none;
        width: 20%;
        height: 50px;
        margin-top: 5px;
        font-size: 1.2rem;
        transition: all 0.5s ease;
    }

    .disabled {
        opacity: 0.3;
        pointer-events: none;
    }

    .desktop-btn-text {
        display: block;
    }

    .mobile-btn-text {
        display: none;
    }

    @media only screen and (max-width: 780px) {
        width: 100%;

        .desktop-btn-text {
            display: none;
        }
    
        .mobile-btn-text {
            display: block;
        }
      }
`



function TableButtons({clickPrevious, clickNext, pageNumber, totalPages}) {

    const { darkTheme } = useContext(ThemeContext)
    
    Styles.defaultProps = {
        theme: {
          darkTheme: darkTheme  }
    }

    return (
        <Styles>
            <button onClick={clickPrevious} className={'page-btn' + (pageNumber === 1 ? ' disabled' : '')}>
                <div className='desktop-btn-text'>Previous</div>
                <div className='mobile-btn-text'><i className="fas fa-arrow-left"></i></div>
            </button>
            <button onClick={clickNext} className={'page-btn' + (pageNumber === totalPages ? ' disabled' : '')}>
                <div className='desktop-btn-text'>Next</div>
                <div className='mobile-btn-text'><i className="fas fa-arrow-right"></i></div>
            </button>
        </Styles>
    )
}

export default React.memo(TableButtons);