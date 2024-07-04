import Input from './Input';
import Slider from './Slider';
import { Box } from '@mui/material';
import React from 'react'
import { Control, Controller } from 'react-hook-form';

export interface IYourFinancialSituationFormValues {
  yourCurrentRent: number;
  yourCurrentAnnualSalary: number;
  yourCurrentSavings: number;
}

export interface IYourFinancialSituationCalculatedValues {
  monthlyGrossIncome: number;
}

interface IYourFinancialSituationProps {
  data: IYourFinancialSituationFormValues & IYourFinancialSituationCalculatedValues;
  control: Control<any, any>
}

const YourFinancialSituation = ({ control, data }: IYourFinancialSituationProps) => {
  return (
    <Box className="max-w-full w-[600px] gap-8 flex flex-wrap mx-auto">
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Your Current Rent" error={error} />
              <Slider
                onChange={(...args) => {
                  field.onChange(...args);
                  field.onBlur();
                }}
                value={field.value}
                shiftStep={100}
                step={100}
                min={0}
                max={1000000}
              />
            </Box>
          )
        }}
        name="yourCurrentRent"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Your Current Annual Salary / Gross Income" error={error} />
              <Slider
                onChange={(...args) => {
                  field.onChange(...args);
                  field.onBlur();
                }}
                value={field.value}
                shiftStep={100}
                step={100}
                min={0}
                max={10000000}
              />
            </Box>
          )
        }}
        name="yourCurrentAnnualSalary"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Your Current Savings" error={error} />
              <Slider
                onChange={(...args) => {
                  field.onChange(...args);
                  field.onBlur();
                }}
                value={field.value}
                shiftStep={100}
                step={100}
                min={0}
                max={10000000}
              />
            </Box>
          )
        }}
        name="yourCurrentSavings"
      />
      <Box className="w-full md:w-calc-1/2-4">
        <Input className="w-full" placeholder="Monthly Gross Income" value={`$${data.monthlyGrossIncome}`} />
      </Box>
    </Box>
  )
}

export default YourFinancialSituation