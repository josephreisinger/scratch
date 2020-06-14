import React, { useState } from 'react';

import classNames from 'classnames/bind';
import style from './Editable.module.css';
const cx = classNames.bind(style);

type Props = {
    value: string;
    onUpdateValue: (value: string) => void;
};

const Editable: React.FC<Props> = (props: Props) => {
    const [isEditing, setEditing] = useState(false);

    return (
        <div className={cx('editable')} onBlur={() => setEditing(false)} onMouseDown={() => setEditing(true)}>
            {isEditing ? (
                <input
                    type="text"
                    name="task"
                    placeholder="Write a task name"
                    value={props.value}
                    onChange={(e) => props.onUpdateValue(e.target.value)}
                />
            ) : (
                <span>{props.value}</span>
            )}
        </div>
    );
};

export default Editable;
