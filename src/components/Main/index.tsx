import React from 'react';
import Button from '../shared/Button';
import MainSubImg from '../../assets/img/main-sub-img.svg';

const Main = () => {
    return (
        <div className="main">
            <div className='main-content container'>
                <div className='main-content-item'>
                    <h1 className='main-content-item-text'>Silk Era Road <br/> 23-24 сентября 2025</h1>
                    <Button title="Зарегистрироваться "/>
                </div>

                <div className='main-content-text-sub'>
                    <img src={MainSubImg} alt="img"
                         className='main-item-content-text-sub-img'/>
                </div>
            </div>
        </div>
    );
};

export default Main;