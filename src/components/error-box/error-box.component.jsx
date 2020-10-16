import React from 'react';
import styled from 'styled-components';

const Styles = styled.div`
    background-color: #f66358;
    color: white;
    height: 10%;
    width: 30%;
    padding: 7px;
    border-radius: 50px;
    margin-bottom: 10px;

    @media only screen and (max-width: 1280px) {
        width: 40%;
    }
    @media only screen and (max-width: 1180px) {
        width: 50%;
    }
    @media only screen and (max-width: 1080px) {
        width: 60%;
    }
    @media only screen and (max-width: 980px) {
        width: 70%;
    }
    @media only screen and (max-width: 880px) {
        width: 80%;
    }
`


export default function ErrorBox({error}) {

    return (
        <Styles>
            {error.message}
        </Styles>
    )
}