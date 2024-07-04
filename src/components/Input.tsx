import { TextField, TextFieldProps } from '@mui/material';
import React, { forwardRef } from 'react';
import { FieldError } from 'react-hook-form';

export interface IInputProps extends Omit<TextFieldProps, 'error'> {
  error?: FieldError;
  ref?: React.Ref<HTMLInputElement>;
}

const Input = forwardRef(({ className = '', error, placeholder, ...rest }: IInputProps, ref: React.Ref<HTMLInputElement>) => {
  return (
    <TextField className={className} error={!!error?.message} label={placeholder} placeholder={placeholder} helperText={error?.message} inputRef={ref} {...rest} />
  );
});

Input.displayName = 'Input';

export default Input;
