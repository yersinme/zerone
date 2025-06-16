import React from 'react';
import Logo from '../../../../assets/icons/zerone-logo.svg'
import {HEADER_LINKS} from './config'
import Button from '../../../shared/Button';

const Desctop = () => {
    return (
            <div className="header-item">
                <img src={Logo} alt="sd" className="header-item-logo"/>

                <div className="header-item-links">
                    {HEADER_LINKS.map((link) => (
                        <a href={link.path} key={link.id} className="header-item-links-link">
                            {link.title}
                        </a>
                    ))}
                </div>

                <Button title="Регистрация"/>
            </div>

    );
};

export default Desctop;