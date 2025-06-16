import React from 'react';
import Desctop from "./Desktop/index";
import Mobile from "./Mobile/index";

const Header = () => {
    return (
        <div className='container'>
            <div className="header-mobile-media">
                <Mobile/>
            </div>

            <div className="header-desktop-media">
                <Desctop/>
            </div>
        </div>
    );
};

export default Header;