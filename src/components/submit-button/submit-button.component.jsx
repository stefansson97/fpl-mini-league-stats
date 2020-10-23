import React from 'react';
import styled from 'styled-components';


const Button = styled.button`
    height: 35px;
    width: 100%;
    border-radius: 7px;
    color: white;
    background-color: #3371ff;
    border: none;
    outline: none;
    cursor: pointer;
    font-size: 15px;
    font-weight: bold;
    transition: all 0.2s ease;

    :hover {
        background-color: #2552b8;
    }
`



function SubmitButton({children}) {

    return(
        <Button type='submit'>{children}</Button>
    )
}

export default React.memo(SubmitButton)