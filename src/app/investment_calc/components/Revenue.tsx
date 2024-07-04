import Input from '@/components/Input';
import { Box, Slider } from '@mui/material';
import React from 'react'
import { Control, Controller } from 'react-hook-form';

export interface IRevenueFormValues {
  rentLive: number;
  rent2: number;
  rent3: number;
  rent4: number;
  otherRevenue: number;
}

export interface IRevenueCalculatedValues {
  rentSum: number;
}

interface IRevenueProps {
  control: Control<any, any>;
  data: IRevenueCalculatedValues;
}

const Revenue = ({ data, control }: IRevenueProps) => {
  return (
    <Box className="max-w-full w-[600px] gap-8 flex flex-wrap mx-auto">
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Unit #1 Rent or Live In" error={error} />
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
        name="rentLive"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Unit #1 Rent or Live In" error={error} />
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
        name="rent2"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Unit #1 Rent or Live In" error={error} />
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
        name="rent3"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Unit #1 Rent or Live In" error={error} />
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
        name="rent4"
      />
      <Controller
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Box className="w-full md:w-calc-1/2-4">
              <Input {...field} type="number" className="w-full" placeholder="Other Revenue (w+d, prkg)" error={error} />
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
        name="otherRevenue"
      />
      <Box className="w-full md:w-calc-1/2-4">
        <Input
          className="w-full"
          placeholder="Rent Revenues sum"
          value={data.rentSum}
        />
      </Box>
    </Box>
  )
}

export default Revenue