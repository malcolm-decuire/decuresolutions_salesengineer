///////////////////////////////////////
//20240704 bad coding habits die hard
////////////////////////////////////

import Input from './Input';
import Slider from './Slider';
import { Box } from '@mui/material';
import React from 'react'
import { Control, Controller } from 'react-hook-form';

export interface IPmiFormValues {
  pmiExpensePercentage: number;
}

export interface IPmiCalculatedValues {
  pmiExpenseAmount: number;
  monthlyPaymentWPmi: number;
  PITI: number;
}

interface ILoanTermsProps {
  data: IPmiFormValues & IPmiCalculatedValues;
  control: Control<any, any>
}

const Pmi = ({ data, control }: ILoanTermsProps) => {
  return (
    <Box className="max-w-full w-[600px] gap-8 flex flex-wrap mx-auto">
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Box className="w-full md:w-calc-1/2-4">
            <Input
              {...field}
              onChange={e => {
                field.onChange(e);
              }}
              type="number"
              className="w-full"
              placeholder="PMI Expense (%)"
              error={error}
            />
            <Slider
              onChange={(...args) => {
                field.onChange(...args);
                field.onBlur();
              }}
              value={field.value}
              shiftStep={1}
              step={1}
              min={0}
              max={100}
            />
          </Box>
        )}
        name="pmiExpensePercentage"
      />
      <Box className="w-full md:w-calc-1/2-4">
        <Input className="w-full" placeholder="PMI Expense ($)" value={`$${data.pmiExpenseAmount}`} />
      </Box>
      <Box className="w-full md:w-calc-1/2-4">
        <Input className="w-full" placeholder="Monthly Payment w/PMI" value={`$${data.monthlyPaymentWPmi}`} />
      </Box>
      <Box className="w-full md:w-calc-1/2-4">
        <Input className="w-full" placeholder="P.I.T.I. Principal Interest Taxes Insurance" value={`$${data.PITI}`} />
      </Box>
    </Box>
  )
}

export default Pmi