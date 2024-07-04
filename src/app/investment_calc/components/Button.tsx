'use client';

import React from 'react';
import { Button as MuiButton, ButtonProps } from '@mui/material';
import Link from 'next/link';

interface IButtonProps extends ButtonProps {
  children: React.ReactNode;
}

const Button = ({ children, className, ...rest }: IButtonProps) => (
  <MuiButton
    className={`bg-green-500 text-white-500 ${className}`}
    {...(rest.href ? { LinkComponent: Link } : {})}
    {...rest}>
    {children}
  </MuiButton>
);

export default Button;
