import Input from '@/components/Input';
import Slider from '@/components/Slider';
import { Box } from '@mui/material';
import React from 'react'
import { Control, Controller } from 'react-hook-form';

export interface IFinancingExpensesFormValues {
  escrowTaxes: number;
  escrowHomeownersInsurance: number;
  escrowHazardInsurance: number;
}

export interface IFinancingExpensesCalculatedValues {
  monthlyPaymentWoPMI: number;
}

interface IFinancingExpensesProps {
  data: IFinancingExpensesFormValues & IFinancingExpensesCalculatedValues;
  control: Control<any, any>;
}

const FinancingExpenses = ({ data, control }: IFinancingExpensesProps) => {
  return (
    <Box className="max-w-full w-[600px] gap-8 flex flex-wrap mx-auto">
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Escrow: Taxes" error={error} />
              <Slider
                onChange={(...args) => {
                  field.onChange(...args);
                  field.onBlur();
                }}
                value={field.value}
                shiftStep={100}
                step={100}
                min={0}
                max={100000}
              />
            </Box>
          )
        }}
        name="escrowTaxes"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Escrow: Homeowner's Insurance" error={error} />
              <Slider
                onChange={(...args) => {
                  field.onChange(...args);
                  field.onBlur();
                }}
                value={field.value}
                shiftStep={100}
                step={100}
                min={0}
                max={100000}
              />
            </Box>
          )
        }}
        name="escrowHomeownersInsurance"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Escrow: Hazard Insurance" error={error} />
              <Slider
                onChange={(...args) => {
                  field.onChange(...args);
                  field.onBlur();
                }}
                value={field.value}
                shiftStep={100}
                step={100}
                min={0}
                max={100000}
              />
            </Box>
          )
        }}
        name="escrowHazardInsurance"
      />
      <Box className="w-full md:w-calc-1/2-4">
        <Input className="w-full" placeholder="Terms (Years)" value={data.monthlyPaymentWoPMI} />
      </Box>
    </Box>
  )
}

export default FinancingExpenses