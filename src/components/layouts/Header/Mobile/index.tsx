import React from 'react';
import Logo from '../../../../assets/icons/zerone-logo.svg'
import Burger from '../../../../assets/icons/burger-icon.svg'

const Mobile = () => {
    return (
        <div className="header-mobile">
            <img src={Logo} alt="sd" className="header-mobile-logo"/>
            <div className='header-mobile-btn'>
                <p className='header-mobile-btn-text'>меню</p>
                <img src={Burger} alt="sd" className="header-mobile-btn-burger"/>
            </div>
        </div>
    );
};

export default Mobile;