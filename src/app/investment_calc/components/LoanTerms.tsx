///////////////////////////////////////
//20240704 bad coding habits die hard
////////////////////////////////////

import Input from './Input';
import Slider from './Slider';
import { Box } from '@mui/material';
import React from 'react'
import { Control, Controller } from 'react-hook-form';

export interface ILoanTermsFormValues {
  homePrice: number;
  downPaymentPercentage: number;
  interestRate: number;
}

export interface ILoanTermsCalculatedValues {
  downPaymentAmount: number;
  mortgage: number;
  terms: number;
  numberOfPayments: number;
  mortgagePayment: number;
}

interface ILoanTermsProps {
  data: ILoanTermsFormValues & ILoanTermsCalculatedValues;
  control: Control<any, any>
}

const LoanTerms = ({ data, control }: ILoanTermsProps) => {

  const {
    downPaymentAmount,
    mortgage,
    terms,
    numberOfPayments,
    mortgagePayment,
  } = data

  return (
    <Box className="max-w-full w-[600px] gap-8 flex flex-wrap mx-auto">
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Home Price" error={error} />
              <Slider
                onChange={(...args) => {
                  field.onChange(...args);
                  field.onBlur();
                }}
                value={field.value}
                shiftStep={100}
                step={100}
                min={0}
                max={100000000}
              />
            </Box>
          )
        }}
        name="homePrice"
      />
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
              placeholder="Downpayment (%)"
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
        name="downPaymentPercentage"
      />
      <Box className="w-full md:w-calc-1/2-4">
        <Input className="w-full" placeholder="Downpayment ($)" value={`$${downPaymentAmount}`} />
      </Box>
      <Box className="w-full md:w-calc-1/2-4">
        <Input className="w-full" placeholder="Mortage" value={mortgage} />
      </Box>
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Box className="w-full md:w-calc-1/2-4">
            <Input
              {...field}
              type="number"
              className="w-full"
              placeholder="Interest Rate(per year)"
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
        name="interestRate"
      />
      <Box className="w-full md:w-calc-1/2-4">
        <Input className="w-full" placeholder="Terms (Years)" value={terms} />
      </Box>
      <Box className="w-full md:w-calc-1/2-4">
        <Input className="w-full" placeholder="# of Payments" value={numberOfPayments} />
      </Box>
      <Box className="w-full md:w-calc-1/2-4">
        <Input className="w-full" placeholder="Mortgage Payment (Principal & Interest)" value={mortgagePayment} />
      </Box>
    </Box>
  )
}

export default LoanTerms