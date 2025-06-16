import React, {FC} from 'react';

interface ButtonProps {
    title: string
}

const Button: FC<ButtonProps> = ({title}) => {
    return (
        <button className="button">
            {title}
        </button>
    );
};

export default Button;