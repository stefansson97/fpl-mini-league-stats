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



`


export default function ErrorBox({error}) {

    return (
        <Styles>
            {error.message}
        </Styles>
    )
}