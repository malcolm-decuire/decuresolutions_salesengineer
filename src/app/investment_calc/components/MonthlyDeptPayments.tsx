import Input from '@/components/Input';
import Slider from '@/components/Slider';
import { Box } from '@mui/material';
import React from 'react'
import { Control, Controller } from 'react-hook-form';

export interface IMonthlyDeptPaymentsFormValues {
  firstHomeMonthlyMortgagePayment: number;
  studentLoansMonthlyPayment: number;
  carNoteMonthlyPayment: number;
  creditCardPayments: number;
  otherDebtMonthlyPayment: number;
}

export interface IMonthlyDeptPaymentsCalculatedValues {
  totalMonthlyDebtPayments: number;
}


interface IMonthlyDeptPaymentsProps {
  control: Control<any, any>,
  data: IMonthlyDeptPaymentsFormValues & IMonthlyDeptPaymentsCalculatedValues
}

const MonthlyDeptPayments = ({ control, data }: IMonthlyDeptPaymentsProps) => {
  return (
    <Box className="max-w-full w-[600px] gap-8 flex flex-wrap mx-auto">
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="First Home Monthly Mortgage Payment" error={error} />
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
        name="firstHomeMonthlyMortgagePayment"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Student Loans Monthly Payment" error={error} />
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
        name="studentLoansMonthlyPayment"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Car Note Monthly Payment" error={error} />
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
        name="carNoteMonthlyPayment"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Credit Card Payments" error={error} />
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
        name="creditCardPayments"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Other Debt Monthly Payment" error={error} />
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
        name="otherDebtMonthlyPayment"
      />
      <Box className="w-full md:w-calc-1/2-4">
        <Input className="w-full" placeholder="PMI Expense ($)" value={`$${data.totalMonthlyDebtPayments}`} />
      </Box>
    </Box>
  )
}

export default MonthlyDeptPayments