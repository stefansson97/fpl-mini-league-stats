import React from 'react';
import styled from 'styled-components';

const Styles = styled.div`
    border: 8px solid transparent;
    border-top: 8px solid #61892f;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`


export default function Loading() {
    return(
        <Styles />
    )
}
